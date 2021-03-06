#### 第十章 中间件
##### 10.1  什么是中间件?
- 中间件是一种功能的封装方式，具体来说就是封装在程序中处理HTTP 请求的功能。
>从实战上讲，例如之前定义的500页面:
```javascript
app.use(function(err, req, res , next){
    console.error(err.stack);
    res.type('text/plain');
    res.status(500);
    res.render('500');
});
```

- 中间件有的有三个参数,有的有四个参数:
> - err : 用来做错误处理
> - req / res ： 用于请求和响应
> - next : 指向中间件后继续后续处理

##### 10.2 如何理解中间件?
> 中间件是**在管道中执行的**。你可以想象一个送水的真实管道。水从一端泵入，然后在到达目的地之前还会经过各种仪表和阀门。这个比喻中很重要的一部分是顺序问题，你把压力表放在阀门之前和之后的效果是不同的。同样，如果你有个向水中注入什么东西的阀门，这个阀门“下游”的所有东西都会含有这个新添加的原料。在Express程序中，通过调用app.use 向管道中插入中间件。

- 在管道的最后放一个“捕获一切”请求的处理器是常见的做法，由它来处理跟前面其他所
有路由都不匹配的请求。这个中间件一般会返回状态码 404（未找到）。
- 那么请求在管道中如何“终止”呢？这是由传给**每个中间件的 next 函数来实现**的。如果不调用 next() ，请求就在那个中间件中终止了。

> 从中间件和路由的区别来理解会更加直观，**路由的功能是根据请求路径和请求方法来处理特定的请求**，而**中间件则作用于全部请求**。这个特性就**决定了中间件可以预先加工所有请求再转交给特定的路由来进行处理。**

- 关于中间件与路由必须铭记:
> - 路由处理器（ •  app.get 、 app.post 等，经常被统称为 `app.VERB` ）可以被看作**只处理特定HTTP 谓词（ GET 、 POST 等）的中间件**。同样，也可以将中间件看作可以处理全部 HTTP谓词的路由处理器（基本上等同于 app.all ，可以处理任何 HTTP 谓词；对于 PURGE 之类特别的谓词会有细微的差别，但对于普通的谓词而言，效果是一样的）。
> - 路由处理器的第一个参数必须是路径。如果你想让某个路由匹配所有路径，只需用 •  `/* `。中间件也可以将路径作为第一个参数，但它是可选的（如果忽略这个参数，它会匹配所有路径，就像指定了 `/\*` 一样）。
> - 路由处理器和中间件的参数中都有回调函数，这个函数有 2 个、3 个或 4 个参数（从技 •术上讲也可以有 0 或 1 个参数，但这些形式没有意义）。如果有 2 个或 3 个参数，头两个参数是请求和响应对象，第三个参数是 next 函数。如果有 4 个参数，它就变成了错
误处理中间件，第一个参数变成了错误对象，然后依次是请求、响应和 next 对象。
> - 如果不调用 `next()` ，管道就会被终止，也不会再有处理器或中间件做后续处理。如果你不调用 next() ，则应该发送一个响应到客户端（ `res.send `、` res.json` 、 `res.render `等）；如果你不这样做，客户端会被挂起并最终导致超时。
> - 如果调用了 `next()` ，一般不宜再发送响应到客户端。如果你发送了，管道中后续的中间件或路由处理器还会执行，但它们发送的任何响应都会被忽略。

在Express 4.0 中，中间件和路由处理器是按它们的连入顺序调用的，顺序更清晰。也就是书写代码的顺序来处理他们之间的关系，这样的结构就和作者所具的管道非常像。
```javascript
app.use(function(req, res, next){
  console.log('processing request for "' + req.url + '"....');
  next();
});

app.use(function(req, res, next){
  console.log('terminating request');
  res.send('thanks for playing!');
  // 注意，我们没有调用next()……这样请求处理就终止了
});

app.use(function(req, res, next){
  console.log('whoops, i\'ll never get called!');
});
```
> 这里有三个中间件。第一个只是在将请求传给下一个中间件之前记录一条消息。然后下一个中间件会真正地处理请求。注意，如果我们忽略了res.send，则不会有响应返回到客户端，最终会导致客户端超时。最后一个中间件永远也不会执行，因为所有请求都在前一个中间件中终止了。

##### 10.3 中间件与入口函数分离
- 中间件必须是一个函数。
- 你会注意到`express.static` 是一个函数，但我们真的会调用它，所以它必须返回另一个函数。看一下：
```javascript
app.use(express.static); // 这个不会像我们期望的那样工作  
console.log(express.static()); // 将会输出"function"，表明express.static 是一个会返回函数的函数
```
