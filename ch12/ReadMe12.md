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
- 在搭建一个设计好要向外扩展的网站时， 最重要的是持久
化。 如果你习惯于用基于文件的
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
准备创建第二个程序文件， 用之前一直在用的非集群程序文件在集群中运行程序。 为此我们必须先对 meadowlark.js 做些轻微的调整：
```javascript
function startServer() {
    http.createServer(app).listen(app.get('port'), function(){
    console.log( 'Express started in ' + app.get('env') +
    ' mode on http://localhost:' + app.get('port') +
    '; press Ctrl-C to terminate.' );
    });
}

// 通过 require.main === module来检测到一个模块是否为应用程序的主模块
if(require.main === module){
  // 应用程序直接运行； 启动应用服务器
    startServer();
} else {
  // 应用程序作为一个模块通过 "require" 引入 : 导出函数
  // 创建服务器
    module.exports = startServer;
}
```
> - 这样修改之后， meadowlark.js既可以直接运行（node meadowlark.js），也 可以通 过require语句作为一个模块引入。


- 然后创建一个新的脚本，`meadowlark_cluster.js`

```javascript
var cluster = require('cluster');

function startWorker() {
    var worker = cluster.fork();  //为系统中的每个cpu启动一个工作线程
    console.log('CLUSTER: Worker %d started', worker.id);
}

if(cluster.isMaster){

    require('os').cpus().forEach(function(){
	    startWorker();
    });

    // log any workers that disconnect; if a worker disconnects, it
    // should then exit, so we'll wait for the exit event to spawn
    // a new worker to replace it
    cluster.on('disconnect', function(worker){
        console.log('CLUSTER: Worker %d disconnected from the cluster.',
            worker.id);
    });

    // when a worker dies (exits), create a worker to replace it
    //监听工作线程的 exit 事件， 重新繁衍死掉的工作线程
    cluster.on('exit', function(worker, code, signal){
        console.log('CLUSTER: Worker %d died with exit code %d (%s)',
            worker.id, code, signal);
        startWorker();
    });

} else {
    // start our app on worker; see meadowlark.js
    require('./meadowlark.js')();

}
```
> [包`cluster`](http://blog.fens.me/nodejs-core-cluster/)
> - 第三方的cluster，让node可以利用多核CPU实现并行。在V0.6.0版本，Nodejs内置了cluster的特性。自此，Nodejs终于可以作为一个独立的应用开发解决方案。cluster模块，可以帮助我们简化多进程并行化程序的开发难度，轻松构建一个用于负载均衡的集群。
- 在这个 JavaScript 执行时， 它或者在**主线程的上下文中**（当**用 node meadowlark_cluster.js 直接运行它时**）， 或者**在工作线程的上下文**中（在 Node 集群系统执行它时）。
- 属性 `cluster.isMaster(主线程的上下文中)` 和 `cluster.isWorker（工作线程的上下文中）` 决定了你运行在哪个上下文中。
- 运行这个脚本时， 它是在主线程模式下执行的， 并且我们用 cluster.fork 为系统中的每个 CPU 启动了一个工作线程。
- 还监听了工作线程的 exit 事件， 重新繁衍死掉的工作线程;

- 假定你在多核系统上， 应该能看到一些工作线程启动了。 如果你想看到不同工作线程处理不同请求的证据， 在路由前添加下面这个中间件：
```javascript
app.use(function(req,res,next){
		var cluster = require('cluster');
		if(cluster.isWorker) {
			console.log('Worker %d received request',	cluster.worker.id);
		}
		next();
});
```
> 现在你可以用浏览器连接你的应用程序。 刷新几次， 看看你怎么能在每个请求上得到不同的工作线程

**12.3.2 处理未捕获的异常**
- 在 Node 的异步世界中， 未捕获的异常是特别需要关注的问题。
- 整个服务器都搞垮了; 它不仅没向用户显示一个友好的错误信息， 而且现在你的服务器还宕机了， 不能再处理请求了。 这是因为 setTimeout是异步执行的，抛出异常的函数被推迟到 Node 空闲时才执行。问题是，当 Node得到空闲可以执行这个函数时，它已经没有其所服务的请求的上下文了，所以它已经没有资源了，只能毫不客气地关掉整个服务器，因为现在它处于不确定的状态（Node 无法得知函数的目的，或者其调用者的目的，所以它不可能再假设后续函数还能正确工作）
```javascript
app.get('/epic-fail', function(req, res){
    process.nextTick(function(){
      throw new Error('Kaboom!');
  });
});
```
- process.nextTick 跟调用没有参数的 setTimeout 非常像， 但它效率更高。
-  我们会处理很多异步执行的任务， 比如数据库访问、 文件系统访问和网络访问， 并且它们都会遇到未捕获的异常。
- 如果出现了未捕获异常，唯一能做的也只是关闭服务器。在这种情况下，最好的做法就是尽可能正常地关闭服务器， 并且有个故障转移机制。 最容易的故障转移机制是使用集群（就像之前提到的）。
- 如果你的程序是运行在集群模式下的，当一个工作线程死掉后，主线程会繁衍另一个工作线程来取代它。（你甚至不需要有多个工作线程，有一个工作线程的集群就够了，尽管那样故障转移可能会稍微有点慢。）
- Node正常关闭服务器的两种机制：`uncaughtException事件`和`域`(推荐)。
- 一个域基本上是一个执行上下文，它会捕获在其中发生的错误。有了域，你在错误处理上可以更灵活，不再是只有一个全局的未捕获异常处理器，你可以有很多域，可以在处理易出错的代码时创建一个新域；
- 每个请求都在一个域中处理是一种好的做法， 这样你就可以追踪那个请求中所有的未捕获错误并做出相应的响应（正常地关闭服务器）。 添加一个中间件就可以非常轻松地满足这个要求。 这个中间件应该在所有其他路由或中间件前面：
```javascript
app.use(function(req, res, next){
  // 为这个请求创建一个域
  var domain = require('domain').create();
  // 处理这个域中的错误
  domain.on('error', function(err) {
      console.error('DOMAIN ERROR CAUGHT\n', err.stack);
      try {
          // 在 5 秒内进行故障保护关机
          setTimeout(function(){
            console.error('Failsafe shutdown.');
            process.exit(1);
          }, 5000);
        // 从集群中断开
        var worker = require('cluster').worker;
        if(worker) worker.disconnect();
        // 停止接收新请求
        server.close();
        try {
          // 尝试使用 Express 错误路由
          next(err);
        } catch(err) {
          // 如果 Express 错误路由失效， 尝试返回普通文本响应
          console.error('Express error mechanism failed.\n', err.stack);
          res.statusCode = 500;
          res.setHeader('content-type', 'text/plain');
          res.end('Server error.');
        }
      } catch(err){
        console.error('Unable to send 500 response.\n', err.stack);
      }
    });
  // 向域中添加请求和响应对象
  domain.add(req);
  domain.add(res);
  // 执行该域中剩余的请求链
  domain.run(next);
});
// 其他中间件和路由放在这里
var server = http.createServer(app).listen(app.get('port'), function(){
console.log('Listening on port %d.', app.get('port'));
});
```
> - 第一件事是创建一个域， 然后在上面附着一个错误处理器。
> - 只要这个域中出现未捕获的错误， 就会调用这个函数。 我们在这里采取的方式是试图给任何处理中的请求以恰当的响应， 然后关闭服务器。
> - 根据错误的性质， 可能无法响应处理中的请求， 所以我们首先要确立关闭服务器的截止时间。
> - 一旦确立了截止时间， 我们会从集群中断开（如果在集群中）， 以防止集群给我们分配更多的请求。 然后明确告诉服务器我们不再接受新的连接。
> - 最后， 我们试图传到错误处理路由（next(err)） 来响应产生错误的请求。 如果那会抛出错误， 我们退回去用普通的 Node API 响应。 如果其他的全部失败了， 我们会记录错误（客户端得不到响应， 最终会超时）
> - 一旦设置好未处理异常处理器， 我们就把请求和响应对象添加到域中（允许那些对象上的所有方法抛出的错误都由域处理）。 最后， 我们在域的上下文中运行管道中的下一个中间件。 注意， 这可以有效地运行域中管道里的所有中间件， 因为对 next() 的调用是链起来的。

- 拓展阅读
- [The 4 Keys to 100% Uptime with Node.js](http://engineering.fluencia.com/blog/2013/12/20/the-4-keys-to-100-uptime-with-nodejs)
- [域的官方文档](http://nodejs.org/api/domain.html)

**12.3.3 用多台服务器扩展**
**用集群向外扩展可以实现单台服务器的性能最大化**，但当你需要多台服务器时会怎样？这时情况会变得有点复杂。要实现这种并行，你需要一台代理服务器（为了跟一般用于访问外部网络的代理区别开，经常被称为反向代理或正向代理， 但我发现这种叫法既费解又没必要，所以我只称它为代理）
- 代理领域的两个后起之秀： `Nginx` 和 `HAProxy`;
- 基于Node的代理服务器： [proxy](https://npmjs.org/package/proxy) 和 [node-http-proxy](https://www.npmjs.org/package/http-proxy)
>　如果你要求不高， 或者是用于开发， 这些都是很好的选择。 对于生产环境而言， 我推荐你用 Nginx 或 HAProxy（这两个都是免费的， 尽管提供服务是收费的）
- 如果你确实配置了一台代理服务器， 请确保告知 Express 你用了代理， 并且它应该得到信任：
```javascript
app.enable('trust proxy');
```
> - 这样可以确保 req.ip、 req.protocol 和 req.secure 能反映客户端和代理服务器之间连接的细节，而不是客户端和你的应用之间的。
> - 还有，req.ips将会是一个数组，表明原始客户端 IP和所有中间代理的名称或 IP地址。


##### 12.4 网站监控
网站监控是你可以采取的最重要的（也是最常被忽视的） QA 措施之一。

**12.4.1 第三方正常运行监控**
- [UptimeRobot](http://uptimerobot.com/)有50个免费监控，并且配置简单。警报可以通过邮件、短信（文本消息）、 Twitter或者iPhone应用程序发送。
- 你可以监控单个页面的返回码（除200之外的所有返回码都可以视为错误），或者检查页面上有没有某个关键字。不过要记住，如果你用关键字监控，它可能会影响你的分析（你可以从大多数分析服务中去掉正常运行监控产生的流量）。
- 比较精密的监控使用：[Pingdom](http://pingdom.com/)和 [Site24x7](http://www.site24x7.com/zhcn/index.html)

**12.4.2 应用程序故障**

##### 12.5 压力测试
- 压力测试（或负载测试）:为了让你相信`服务器可以正常地应对成百上千的并发请求`。
> - 添加一个简单的测试， 确保程序可以满足一秒内对主页的 100 次请求。我们用
Node 模块 loadtest 做压力测试: `npm install --save loadtest`
```javascript
var loadtest = require('loadtest');
var expect = require('chai').expect;

suite('Stress tests', function() {

	test('Homepage should handle 50 requests in under a second', function(done) {
		var options = {
			url: 'http://localhost:3000',
			concurrency: 4,
			maxRequests: 50,
		};
		loadtest.loadTest(options, function(err,result) {
			expect(!err);
			expect(result.totalTimeSeconds < 1);
			done();
		});
	});

});

```
