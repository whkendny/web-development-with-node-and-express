### 第四章
#### 一. git工具
1. 初始化项目文件夹： `git init`
2. 添加修改至暂缓区，此时的文件还没有被提交 `git Add -A`
3. 从暂缓区提交修改  `git commit -m "fix"`
4. 复制远程仓库项目： `git clone url`
5. 检出某个标签： `git checkout tagName`
6. 创建一个新的分支并检出 `git checkout -b newTagName`

**[详细操作见](http://www.ruanyifeng.com/blog/2014/06/git_remote.html)**

#### 二. npm 包
1. `package.json`的作用：[详细信息见](http://javascript.ruanyifeng.com/nodejs/packagejson.html)
 - 描述项目文件、列出项目所有的依赖项;
 - 存放项目的元数据(eg:项目名称，作者， 授权信息等), 项目元数据还包括README.md；

#### 三. Node 模块；
- Node模块提供一个模块化和封装的机制（实现一些特定的功能）， Node默认会在node_modules中寻找这些模块。
- npm包则提供一种存储，版本化和引用项目（不限于模块）的标准范式，eg: 我们在主程序文件中将express作为一个模块引入：
```
  var express = require('express');
```
