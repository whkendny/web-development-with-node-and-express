### 第12章  与生产相关的问题
##### 12.1 执行环境
- Express支持执行环境的概念，它是一种在生产、开发或测试模式中运行应用程序的方法。（可以按自己的想法创建很多种不同的环境。）
> - 要记住，开发、生产和测试是“标准”环境，Express、Connect以及第三方中间件可能会基于这些环境做出决定。
> - 换句话说，如果你有一个“临时”环境，则无法让它自动集成生产环境的属性。

- 尽管可以调用`app.set('env', 'production')`指定执行环境，但不建议这样做;
> - 因为那意味着不管什么情况，你的应用程序都会一直运行在那个环境中。
> - 更糟的是，它可能在一个环境中开始运行，然后切换到另一个环境。
> - 用环境变量NODE_ENV指定执行环境更好
```javascript
//通过调用`app.get('env')`让它报告一下它运行在哪种模式下：
http.createServer(app).listen(app.get('port'), function(){
  console.log( 'Express started in ' + app.get('env') +
                ' mode on http://localhost:' + app.get('port') +
                '; press Ctrl-C to terminate.' );
});
```
- 如果你没有指定执行环境，开发模式就是默认模式。 我们试着把它放在生产模式下：
```shell
$ export NODE_ENV=production
$ node meadowlark.js
```
> - 这会在生产模式下运行服务器， 但当服务器终止时， 环境变量 NODE_ENV 还是原来的值。
> - 如果在生产模式下启动 Express， 你可能会注意到有些组件不适合在生产模
式下使用的警告信息。
> - 如果你一直在按照本书的例子做， 会看到 connect.session 用了内存存储， 这不适合生产环境。


#### 12.2 环境特定配置
- 执行环境大体是一个可以利用的工具， 你可以轻松地决定应用程序在不同的环境下应该做
何表现。 但尽量缩小开发、 测试和生产环境之间的差异。
- 我们要给程序添加一些日志。 在开发环境中， 我们会用 `Morgan（npm install --save morgan）`， 它的输出是便于查看的彩色文本。 在生产环境中，我们用 `express-logger（npm install --save express-logger）`， 它支持日志循环（每 24 小时复制一次， 然后开始新的日志， 防止日志文件无限制地增长）。给程序文件添加日志支持：
```javascript
// logging
switch(app.get('env')){
    case 'development':
    	// compact, colorful dev logging
    	app.use(require('morgan')('dev')); break;
    case 'production':
        // module 'express-logger' supports daily log rotation
        app.use(require('express-logger')({ path: __dirname + '/log/requests.log'}));   break;
}
```
> - 如果你要测试日志， 可以在生产模式下运行程序（`NODE_ENV=production node meadowlark.
js`）
> - 如果你想实际看看日志的循环功能， 可以编辑 `node_modules/express-logger/logger.js`，
修改变量 defaultInterval， 比如从 24 小时改成 10 秒

##### 12.3 扩展你的网站
- 扩展通常是指：**向上扩展** 和 **向外扩展**；
> - **向上扩展**: 指让服务器变得更强： 更快的CPU， 更好的架构， 更多内核， 更多内存， 等等。
> - **向外扩展**: 只是意味着更多的服务器。随着云计算的流行和虚拟化的普及， 服务器和计算能力的相关性变得越来越小， 并且对于网站的扩展需求而言， 向外扩展是成本收益率更高的办法。
- 在用 Node 开发网站时， 你应该总是考虑向外扩展的可能性。
- 在搭建一个设计好要向外扩展的网站时， 最重要的是持久化。 如果你习惯于用基于文件的
存储做持久化， 那就此打住吧， 因为那会让人发疯的。
- 除非所有服务器都能访问到那个文件系统， 否则你不应该用本地文件系统做持久化(只读数据
是个例外， 比如日志和备份)。

**12.3.1 用应用集群扩展**
- Node 本身支持应用集群， 它是一种简单的、 单服务器形式的向外扩展。
- 使用应用集群， 你可以为系统上的每个内核（CPU） 创建一个独立的服务器（有更多的服务器而不是内核数
不会提高程序的性能）。

应用集群好在两个地方：
1. 它有助于实现给定服务器性能的最大化（硬件或虚拟机）；
2. 它是一种在并行条件下测试程序的低开销方式。

尽管在主程序文件中做这些工作的做法十分普遍， 但我们
准备创建第二个程序文件， 用之前一直在用的非集群程序文件在集群中运行程序。 为此我
们必须先对 meadowlark.js 做些轻微的调整：
```javascript

```

**12.3.2 处理未捕获的异常**


**12.3.3 用多台服务器扩展**


##### 12.4 网站监控

**12.4.1 第三方正常运行监控**

**12.4.2 应用程序故障**
