# PE 文件结构速览

分析 Windows 程序，第一件事是搞清楚这个文件"长什么样"。PE（Portable Executable）格式是所有 Windows 可执行文件的容器。

## 整体布局

```text
┌─────────────────────┐
│ DOS Header (64B)    │  MZ 开头，e_lfanew 指向 PE 头
├─────────────────────┤
│ DOS Stub            │  那行 "This program cannot be run in DOS mode"
├─────────────────────┤
│ PE Signature        │  "PE\0\0"
├─────────────────────┤
│ COFF File Header    │  机器类型、节数量、时间戳
├─────────────────────┤
│ Optional Header     │  入口点、镜像基址、数据目录
├─────────────────────┤
│ Section Table       │  每个节的名称/大小/属性
├─────────────────────┤
│ Section Data        │  .text .rdata .data .rsrc ...
└─────────────────────┘
```

## 几个关键字段

| 字段 | 位置 | 含义 |
| --- | --- | --- |
| `Machine` | COFF 头 | `0x14c` = x86，`0x8664` = x64，`0x1c0` = ARM |
| `AddressOfEntryPoint` | Optional 头 | 入口点 RVA，加 ImageBase 得虚拟地址 |
| `ImageBase` | Optional 头 | 首选加载基址，常见 `0x400000`（32 位）、`0x140000000`（64 位） |
| `Subsystem` | Optional 头 | `2` = GUI，`3` = 控制台 |
| `SizeOfImage` | Optional 头 | 加载到内存后占多大 |

## 节表：最值得看的部分

每个节有两个大小，**这两个值的差异往往是线索**：

- `VirtualSize`（`Misc_VirtualSize`）：加载到内存中的大小
- `SizeOfRawData`：在磁盘文件中的大小

正常情况下 `SizeOfRawData` 略大于 `VirtualSize`（按文件对齐补齐）。如果出现**明显反常**，比如某个本该有代码的节 `SizeOfRawData` 为 0，那说明磁盘上没有这部分原始数据，运行时才由别的东西填进去。

## 用 pefile 快速侦察

```python
import pefile

pe = pefile.PE('target.exe')

print('架构:', hex(pe.FILE_HEADER.Machine))
print('入口:', hex(pe.OPTIONAL_HEADER.AddressOfEntryPoint))
print('基址:', hex(pe.OPTIONAL_HEADER.ImageBase))
print('子系统:', pe.OPTIONAL_HEADER.Subsystem)

for s in pe.sections:
    name = s.Name.rstrip(b'\x00').decode(errors='replace')
    print(f'{name:10} virt={s.Misc_VirtualSize:#010x} raw={s.SizeOfRawData:#010x}')
```

## 地址的两种表示

理解这两者的换算，是后面所有分析的前提：

:::tip RVA 与 VA

- **VA**（Virtual Address）：进程内存里的绝对地址，如 `0x00401A3D`
- **RVA**（Relative Virtual Address）= `VA - ImageBase`

调试器里显示的通常是 VA。而文件中记录的是 RVA —— 因为文件不知道将来会被加载到哪里。
加载基址可能因 ASLR 而改变，所以跨会话记录地址时**记 RVA 更可靠**。

:::

## 数据目录

Optional Header 末尾是一组数据目录（Data Directory），每个 8 字节（RVA + 大小）：

| 索引 | 内容 |
| --- | --- |
| 0 | Export（导出表） |
| 1 | Import（导入表，看它调用了哪些 API） |
| 2 | Resource（资源） |
| 5 | Relocation（重定位） |
| 9 | TLS（线程局部存储，反调试常用） |

**导入表是最快的线索来源**：看到 `VirtualProtect` + `WriteProcessMemory` 的组合，基本可以判断这程序会改自己的内存；看到 `IsDebuggerPresent` / `CheckRemoteDebuggerPresent`，说明有反调试。

## 什么时候 PE 结构不够用

如果节表显示代码节在磁盘上是空的，或者导入表只有寥寥几个函数（被壳藏了），那静态看 PE 得到的信息就到此为止了——接下来得转到运行时观察。
