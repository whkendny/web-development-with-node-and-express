var express = require('express');
var app = express();

// 设置程序端口
app.set('port', process.env.PORT || 3000);

//定制404页面
/*
res.type('text/plain');
res.status(404);
等同于 node的 res.writeHead()

res.send()等同于 node中的 res.end()
*/

/*
页面及其路由
*/
/*
app.get 是添加路由的方法，url 忽略大小写或反斜杠，并且在进行
匹配时也不考虑查询字符串。
参数： url,      页面路径
      function:  路由调用后就会调用回调函数，并且把请求和响应对象作为参数
                 传递给本函数。（状态码默认为：200，不用显式的指定）
*/
app.get('/', function(req, res){
  res.type('text/plain');
  res.send('indexPage');
})
app.get('/about', function(req, res){
  res.type('text/plain');
  res.send('aboutPage');
})
app.get('/about/me', function(req, res){
  res.type('text/plain');
  res.send('aboutMePage');
})

/*
服务端
*/
/*
 app.use()是用于显式添加中间件的方法。
*/
app.use(function(req, res, next){
  res.type('text/plain');
  res.status(404);
  res.send('404-not Found11');
})

app.use(function(err, req, res, next){
  console.error(err.stack);
  res.type('text/plain');
  res.status(500);
  res.send('500 - serverError');
})

app.listen(app.get('port'), function(){
  console.log('Express started on https://localhost:' +
    app.get('port') + '; press Ctrl-C to terminate.')
})
