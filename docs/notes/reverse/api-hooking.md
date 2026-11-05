# API 拦截：IAT、inline hook 与网络改道

想把一个程序的所有网络请求就地接管，最脏的做法是改 `hosts`——污染系统文件、要管理员权限、多开必冲突、域名一变就失效。

干净的做法是**在进程内部把目标 API 拦下来**。这篇讲三种拦截层次、各自的适用条件，以及两个会让人卡很久的坑。

## 三种层次

| 方式 | 改的是什么 | 隐蔽性 | 能否应对「导入表被抽空」 |
| --- | --- | --- | --- |
| 代理 DLL（同名替换） | 加载哪个模块 | 低，文件可见 | 可以 |
| IAT 改写 | 导入表中的函数指针 | 中，改的是数据 | **不行** |
| inline hook | 函数入口的代码字节 | 中，改的是代码 | 可以 |

前两种依赖一个前提：**目标程序的导入表是完整的**。第三种不依赖，代价是要自己解析指令长度。

## 一、IAT 改写

PE 的导入表最终会落成一个 `IMAGE_THUNK_DATA` 数组，每一项存的是函数地址。程序调用导入函数时，走的是 `call dword ptr [这里的地址]`。

把这个槽里的地址换成自己的函数，程序再调用就走到你这里了。

```c
static int iat_patch_slot(PVOID *slot, PVOID newfn, PVOID *oldfn)
{
    DWORD old = 0;
    if (!VirtualProtect(slot, sizeof(PVOID), PAGE_EXECUTE_READWRITE, &old)) return 0;
    if (oldfn) *oldfn = *slot;          // 存下原地址，后面要透传
    *slot = newfn;
    VirtualProtect(slot, sizeof(PVOID), old, &old);
    FlushInstructionCache(GetCurrentProcess(), slot, sizeof(PVOID));
    return 1;
}
```

遍历导入表找目标槽有两种匹配策略：

**策略一：按导入名匹配**

沿 `OriginalFirstThunk` 走，每项指向一个 `IMAGE_IMPORT_BY_NAME`（含函数名）。

**策略二：按已解析地址匹配**

不依赖名字，直接在全部 `FirstThunk` 槽里找「值等于真实函数地址」的那一项：

```c
PVOID real = (PVOID)GetProcAddress(GetModuleHandleA("ws2_32.dll"), "connect");
// 遍历所有导入描述符的所有 FirstThunk 槽，找 *slot == real
```

策略二的好处是**不依赖 `OriginalFirstThunk`**，坏处是要求 IAT 已经解析完成（延迟加载的模块还没解析就问不到）。

:::tip 为什么两套都要写

正常编译出来的程序，策略一必然成功。但只要目标经过特殊处理（导入表被重排、按序号导入、或运行时重建），策略一就会失效——这时策略二往往是唯一的救命稻草。

:::

## 二、导入表被抽空的情况

有些保护壳会把导入表**按序号重写**：磁盘上每个 DLL 只剩一条 ordinal 记录，函数名全被抹掉。

```
DLL Name: WS2_32.dll
  vma: 01201da4   Ordinal 14   Member-Name: <none>
```

看到 `<none>` 就该知道：**按名字匹配这条路彻底堵死了**。程序运行时靠别的方式（自身加密的 IAT、动态 `GetProcAddress`）拿到真实地址，静态表根本不可用。

这时只剩两条路：

1. **等运行时**：程序跑起来之后导入表可能被恢复，轮询重试；
2. **直接 inline hook**：不碰导入表，改函数本体。

实践中两条一起用：轮询 IAT 作为首选，装不上就退到 inline hook。

## 三、inline hook

原理很简单：在函数入口写一条 `jmp`，跳到自己的函数；自己的函数干完活，再跳回原函数被覆盖段之后继续。

```text
原函数入口                    自己的 hook
  55 8B EC ...     ──jmp──▶   hk_connect(...)
                                ├─ 感兴趣：改参数、记录
                                └─ 不感兴趣：透传
                                  │
                                  ▼
                              蹦床（被搬走的原始指令 + jmp 回原函数后面）
```

关键在**蹦床（trampoline）**：被覆盖的原始字节必须先复制出来，末尾补一条跳回原函数 `+n` 的 `jmp`。

```c
BYTE *tr = VirtualAlloc(NULL, 64, MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);

memcpy(tr, target, n);                      // 被覆盖的指令
tr[n] = 0xE9;                               // 跳回 target + n
DWORD back = (target + n) - (tr + n + 5);
memcpy(tr + n + 1, &back, 4);

target[0] = 0xE9;                           // 入口写 jmp
DWORD rel = hookfn - (target + 5);
memcpy(target + 1, &rel, 4);
for (int i = 5; i < n; i++) target[i] = 0x90;
```

:::danger 蹦床必须可执行

把 `memcpy` 出来的指令放在普通栈或数据段里，一执行就是 `page fault on execute access`。

这不是逻辑错误，是内存属性问题——`VirtualAlloc` 时要带 `PAGE_EXECUTE_READWRITE`。调试器里看到「跳到某个地址就崩」，先怀疑这个。

:::

### 指令长度解析

覆盖长度 `n` 必须**落在指令边界上**，且 `n >= 5`（`jmp rel32` 占 5 字节）。切断一条指令，蹦床里就是垃圾字节。

写一个只覆盖常见序言的解析器就够了，遇到不认识的操作码**返回 0 表示放弃**，而不是猜一个长度：

```c
static int insn_len(const BYTE *p)
{
    BYTE b = p[0];
    if (b == 0x8D) {                          // lea r32, [...]
        BYTE m = p[1];
        int mod = m >> 6, rm = m & 7, il = 2;
        if (mod != 3 && rm == 4) il += 1;     // SIB
        if (mod == 1) il += 1;
        else if (mod == 2 || (mod == 0 && rm == 5)) il += 4;
        return il;
    }
    if (b == 0x8B || b == 0x89) return 2;
    if (b == 0x83) return 3;
    if (b == 0x81) return 6;
    if (b == 0x55 || b == 0x53 || b == 0x56 || b == 0x57 || b == 0x90) return 1;
    if (b == 0x6A) return 2;
    if (b == 0x68 || b == 0xE8 || b == 0xE9) return 5;
    if (b == 0xEB) return 2;
    if (b == 0x0F && p[1] >= 0x80 && p[1] <= 0x8F) return 6;
    if (b == 0xFF && p[1] == 0x25) return 6;
    return 0;                                 // 不认识 -> 放弃，不要猜
}
```

实测 `ws2_32!connect` 的入口是：

```text
8D 4C 24 04     lea ecx, [esp+4]       4 字节
83 E4 F8        and  esp, -8           3 字节   → 累计 7 字节，可以下手
```

:::warning 「返回 0 就放弃」是设计，不是偷懒

长度猜错会让蹦床执行到指令中间，症状是随机崩溃，且崩溃点离 hook 位置很远，极难排查。

宁可这次装不上、记录一条日志，也不要装上一个错的。

:::

## 四、网络改道：不需要伪造数据包

有了 hook 能力，接管网络有两种思路：

| 思路 | 做法 | 风险 |
| --- | --- | --- |
| 模拟 socket | 假装 `connect` 成功，自己造 `recv` 的数据 | 高，要复刻非阻塞/select/错误码语义 |
| **改道** | 把目标地址改成自己的监听端口，让内核真的连 | **低，全原生** |

改道的实现只有两件事：

```c
// 1. 让域名解析一律落到本机
static struct hostent *WSAAPI hk_gethostbyname(const char *name) { /* 返回 127.0.0.1 */ }

// 2. 目标端口/地址匹配时改 sockaddr，其余透传
static int WSAAPI hk_connect(SOCKET s, const struct sockaddr *name, int len)
{
    if (name && name->sa_family == AF_INET && len >= sizeof(struct sockaddr_in)) {
        struct sockaddr_in tmp;
        memcpy(&tmp, name, sizeof(tmp));
        if (ntohs(tmp.sin_port) == TARGET_PORT || ntohl(tmp.sin_addr.s_addr) == INADDR_LOOPBACK) {
            tmp.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
            tmp.sin_port = htons(g_local_port);
            return ((PFN_CONNECT)g_orig)(s, (const struct sockaddr *)&tmp, len);  // 走原函数
        }
    }
    return ((PFN_CONNECT)g_orig)(s, name, len);
}
```

**为什么改道比模拟好**：连接是内核真实建立的，`send` / `recv` / `select` / `WSAEWOULDBLOCK` / 超时全部是原生行为。你只需要处理自己关心的那个端口，其余交还给原函数。

:::tip 端口用一个随机值

监听端口绑 `0` 让系统分配，再把实际端口号通过命名共享内存或管道告诉注入的模块。

固定端口会在多开时冲突，而且等于在系统上留了一个可被探测的指纹。

:::

## 五、DllMain 里不要做重量级初始化

这是最贵的一个坑。

```c
BOOL WINAPI DllMain(HINSTANCE h, DWORD reason, LPVOID r)
{
    if (reason == DLL_PROCESS_ATTACH) {
        WSAStartup(MAKEWORD(2, 2), &wsa);   // 死锁
        CreateThread(...);                  // 也危险
    }
    return TRUE;
}
```

`DllMain` 运行在**装载器锁**内。在这把锁里做任何会再去拿装载器锁的事——加载别的 DLL、`WSAStartup`、`LoadLibrary`、部分 CRT 初始化——都会自锁。

症状非常具有迷惑性：

```text
目标进程起来了，但界面永远不出现
自己的日志一行都没写
CPU 占用不高
```

因为**连写日志的那行代码都还没执行到**（日志库初始化本身也要拿锁）。

正确做法：`DllMain` 只做最轻的事，把重量级初始化扔进一个新建的线程：

```c
BOOL WINAPI DllMain(HINSTANCE h, DWORD reason, LPVOID r)
{
    if (reason == DLL_PROCESS_ATTACH) {
        DisableThreadLibraryCalls(h);
        HANDLE t = CreateThread(NULL, 0, worker, NULL, 0, NULL);
        if (t) CloseHandle(t);
    }
    return TRUE;
}
```

worker 线程里第一件事就是写日志——**只要日志不出来，就说明卡在更早的地方**，这是最快的定位信号。

## 六、验证方法

别一上来就对着真实目标试。先写一个最小的宿主程序：

```c
int main(void)
{
    // 1. 起一个本地监听，模拟「服务端」
    // 2. 把端口写进共享内存
    // 3. LoadLibrary 自己的 hook 模块
    // 4. 调 gethostbyname 看返回是不是 127.0.0.1
    // 5. 调 connect 到一个不存在的公网地址，看本地监听的 select 是否可读
}
```

`connect(1.2.3.4:PORT)` 返回 0、本地 `select` 变为可读、`accept` 拿到连接——三条都对上，改道就是真的生效了。

## 小结

| 阶段 | 要解决的问题 | 关键点 |
| --- | --- | --- |
| 选层次 | 导入表可用吗 | ordinal-only 就是 IAT 的死刑 |
| IAT | 找槽、存原地址 | 按名 + 按值双策略 |
| inline | 覆盖长度落在指令边界 | 解析不了就放弃 |
| 改道 | 内核真连接 | 随机端口 + 全原生语义 |
| 初始化 | 绕开装载器锁 | DllMain 只创建线程 |

拦截技术的核心不是「怎么改字节」，而是「**改哪一层最不容易被下游代码的逻辑反噬**」。改得越靠上（业务层），下游越多地方会因为你没伪造的那个字段而出问题；改得越靠下（API 层），原生行为替你兜住的东西就越多。