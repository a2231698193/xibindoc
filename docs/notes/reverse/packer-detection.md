# 怎么判断程序有没有加壳

加壳后的程序，磁盘上的代码是被压缩或加密过的，静态分析基本无效。先判断要不要走运行时路线，能省掉大量无用功。

## 快速判断的四条线索

### 1. 看节名

正常编译器产出的节名很规矩：`.text` `.rdata` `.data` `.rsrc` `CODE` `DATA`。

壳的节名有明显的特征：

| 特征 | 可能的壳 |
| --- | --- |
| `.svmp0` ~ `.svmpN`、`.vmp0` | VMProtect |
| `.themida` / `.winlice` | Themida / WinLicense |
| `UPX0` `UPX1`（都是大写、无点） | UPX |
| `.aspack` / `.adata` | ASPack |
| 随机字母节名、或大量 `\x00` 填充的名字 | 通用保护壳 |
| 节数量异常多或异常少 | 可疑 |

### 2. 看熵值

压缩/加密数据的字节分布接近均匀，熵值高。各节熵值可以直接算：

```python
import math
from collections import Counter

def entropy(data: bytes) -> float:
    if not data:
        return 0.0
    counts = Counter(data)
    n = len(data)
    return -sum((c / n) * math.log2(c / n) for c in counts.values())

for s in pe.sections:
    name = s.Name.rstrip(b'\x00').decode(errors='replace')
    print(f'{name:10} entropy={entropy(s.get_data()):.2f}')
```

经验判断：

- 普通代码节 `.text` 通常 **6.0 ~ 6.5**
- 压缩数据的壳节往往 **> 7.0**
- 超过 **7.5** 基本可以确定是加密载荷

但要注意：.NET 程序集、静态链接的大型 C++ 程序也可能熵值偏高，别只看一个指标。

### 3. 看导入表规模

一个正常的 GUI 程序，导入函数通常几百个（user32、kernel32、gdi32 各几十上百）。

如果导入表只有 **十几二十个函数**，且集中在 `LoadLibrary` / `GetProcAddress` / `VirtualAlloc` / `VirtualProtect` 这几个上——这是典型的"运行时动态解析 API"模式，壳的标配。

### 4. 看入口点在哪

入口点如果落在最后一个节的范围内，而不是 `.text` 里，说明**真正执行的第一段代码不在标准代码节**。PEid / DIE（Detect It Easy）这类工具就是综合这几个维度来判断的。

## 但也要警惕误判

:::warning 别只信工具结论

- 有些程序用自研的加壳方案，没有特征节名，熵值也不高
- 有些壳会伪造节名来骗检测工具
- 某些语言（Go、Rust）编译出的二进制本来就节多、体积大，容易被误判

:::

**最可靠的验证方式**：.NET 可以用 dnSpy 直接打开看有没有方法体；原生程序就看入口点反汇编出来的指令——如果开头是一堆算术运算和循环（而不是标准的 `push ebp; mov ebp, esp` prologue），那就是解包代码。

## 加壳对我意味着什么

判断出加了壳之后，分析的**策略会整个改变**：

| 没加壳 | 加了壳 |
| --- | --- |
| 静态反汇编可读 | 静态反汇编是垃圾数据 |
| 改文件字节可行 | 磁盘上没有原始代码，改文件无效 |
| 导入表能看出意图 | 导入表被隐藏 |
| 可以直接用 IDA 分析 | 需要先让程序跑起来，在内存里看 |

所以「先判断有没有壳」是整个分析流程的第一个岔路口。判断错了会浪费几个小时。

## 常见的下一步

如果确认加壳，接下来的方向通常不是"硬脱壳"，而是**运行时观察**：让程序自己解包，然后在内存里找已经恢复的代码。这条路比脱壳稳得多，尤其是在虚拟化壳（VMProtect 的 VM 模式、Themida）面前——那些壳的指令是被翻译成自定义字节码执行的，脱壳还原出来的也不是原指令。

下一篇讲具体怎么做。
