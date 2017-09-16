#### 1. [express中next函数](http://cnodejs.org/topic/5757e80a8316c7cb1ad35bab)
- 1.1 next()的作用?
> 在定义express中间件函数的时候都会将第三个参数定义为next，next函数主要负责**将控制权交给下一个中间件**，**如果当前中间件没有终结请求，并且next没有被调用，那么请求将被挂起**， 后边定义的中间件将得不到被执行的机会。

- 1.2 何时使用Next
> next函数主要是用来确保所有注册的中间件被一个接一个的执行，那么我们就应该在所有的中间件中调用next函数，但有一个特例，如果我们定义的中间件终结了本次请求，那就不应该再调用next函数，否则就可能会出问题，我们来看段代码

```javascript
app.get('/a', function(req, res, next) {
    res.send('sucess');
    next();
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  console.log(404);
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});
```
> 发送请求"/a"，控制台打印日志如下：

```
404
GET /a 500 6.837 ms - -
Error: Can't set headers after they are sent.
    at ServerResponse.OutgoingMessage.setHeader (_http_outgoing.js:345:11)
```
> 为什么代码会抛异常呢，就是因为我们在res.send之后调用了next函数，虽然我们本次的请求已经被终止，但后边的404中间件依旧会被执行，而后边的中间件试图去向res的headers中添加属性值，所以就会抛出上边的异常。

> 读到这你可能会有个疑问，如果我不在res.send后边调用next函数，那后边定义的404中间件是不是永远都不会被执行到。现在我们删除res.send后边next函数调用，发送请求"/xxx"，我们就会发现404中间件被执行了，(ㄒoㄒ)，这不是和我们之前说的矛盾了吗，我们的自定义中间件没有调用next，但后边定义的中间件仍旧被执行了，这究竟是为什么呢。看来只能求助源码了~~~
