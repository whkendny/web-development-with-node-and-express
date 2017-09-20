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
