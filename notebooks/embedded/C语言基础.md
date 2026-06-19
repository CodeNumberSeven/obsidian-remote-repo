## 一、`strlen`和`sizeof`

###  1. 功能
- `sizeof`：计算对象或者类型在内存中占用的字节数（**包含\0**），编译期间求值。
- `strlen`：计算字符串的长度（**不包含\0**），运行期间求值。
### 2. 适用对象
- `sizeof`：可以作用于任何类型，如变量、数组、结构体、函数等。
- `strlen`：只能作用于字符串。
### 3. 返回值
- `sizeof`：返回类型是`size_t`
![[defineSizeof.png]]
- `strlen`：返回类型是`size_t`
```c
size_t strlen(const char *string);
```
![[sizeofAndStrlen.png]]
>==有关上述"\0"和'\0'辨析==
>1. sizeof
> - "\0"：在C语言中，双引号包围的是**字符串常量**。编译器处理时，会在内存中分配一个字符数组。这个数组包含显式的、和编译器自动在末尾加上的休止符\0。因此，实际内存中存了两个\0，数组的总长度为2，在上面的测试中cahr占用的字节为1，故结果为2。
> - '\0'：在 C 语言中，**单引号括起来的字符常量，其类型是 int，而不是 char**。所以输出的是int类型的长度，及4。
>2. strlen
>- "\0"：strlen 的逻辑是“**从起始地址往后找，数到第一个 \0 为止**”。对于包含两个 \0 的数组，它遇到的第一个字符就是 \0，于是立刻停止计数，返回 **0**。
>- '\0'：
>   a. 字符常量 '\0' 的本质是整数 0。
>   b. strlen需要接收一个**内存地址**作为参数。
>   c. 地址 0x0 是操作系统的保留区域，属于空指针（NULL）。程序强行去读取空指针指向的内存，操作系统会立刻把它“杀掉”，抛出段错误。
## 二、`enum`默认值与可指定性
### 1.注意点
枚举类型默认值为0，后一个枚举数比前一个枚举数大1
![[defineEnum.png]]
### 2. 功能
可以显性地指定枚举数的数值
![[exampleEnum.png]]
## 三、`typedef`作用

### 1. 功能
为已有的类型定义新的别名
```c
typedef unsigned int uint32_t;
```
### 2. 使用场景
- 简化复杂类型声明，例如：结构体、指针、函数
- 提高代码的可读性和可维护性
- 方便跨平台的数据类型替换 `int32_t` `uint8_t`
### 3. 注意
- 完成`typedef`之后，并不会为新的别名分配内存空间，换言之则是并没有诞生新的变量类型
- 不能在函数定义中使用`typedef`
```c
// ❌ 绝对非法的写法
typedef int my_function(int a, int b) {  // <-- 试图在写函数实现的同时，用 typedef 把它定义成类型
    return a + b;
}

// ✅ 完全合法的写法
int main() {
    // 这是在 "function body" 里，不是在 "function definition" 的签名上！
    typedef unsigned long long ULL; 
    ULL num = 10;
    return 0;
}
```
## 四、`static`作用

### 1. 作用有三
- 修饰局部变量，局部变量只初始化一次，只在当前作用域可用，不能跨作用域使用![[localVariable.png]]
- 修饰全局变量，全局变量只初始化一次，只在本文件内使用
- 修饰函数，只能在本文件使用
```c

// secret.c
#include <stdio.h>

// ================== 全局变量部分 ==================
// 1. 普通全局变量：大家都能用
int public_money = 10000;

// 2. static 全局变量：【私房钱】，出了这个 secret.c 文件，谁也看不见
static int private_money = 500;

// ================== 函数部分 ==================
// 3. static 函数：【内部辅助工具】，只能在这个文件里被其他函数调用
static void secret_process() {
    printf("执行机密操作，使用了私房钱: %d\n", private_money);
}

// 4. 普通函数：对外暴露的接口
void do_work() {
    printf("开始对外工作...\n");
    secret_process(); // 同一个文件内，调用 static 函数完全没问题
}

// main.c
#include <stdio.h>
// 声明外部变量和函数
extern int public_money;
extern void do_work();

// 试图强行声明外部的 static 东西 (实际上这是徒劳的)
extern int private_money;
extern void secret_process();

int main() {

    // ✅ 成功：访问普通全局变量
    printf("拿到公款: %d\n", public_money);
    // ✅ 成功：调用普通全局函数
    do_work();
  
    // ❌ 报错：试图访问 static 全局变量
    // 如果你取消下面这行的注释，编译时链接器会报错：undefined reference to `private_money'
    // printf("试图偷拿私房钱: %d\n", private_money);

    // ❌ 报错：试图调用 static 函数
    // 如果你取消下面这行的注释，编译时链接器会报错：undefined reference to `secret_process'
    // secret_process();
    return 0;
}

// output
拿到公款: 10000
开始对外工作...
执行机密操作，使用了私房钱: 500
```
### 2. 注意
被`static`修饰的变量的默认值为0
## 五、内联函数概念及作用

## 六、数组名和指针区别

## 七、
