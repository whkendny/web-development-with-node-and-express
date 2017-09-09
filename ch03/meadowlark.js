var express = require('express');

var app = express();


/*----------------------------------------------------------------------------------------*/
// set up handlebars view engine （引入handlebars视图引擎，并指定默认的布局模板为“main”）
var handlebars = require('express-handlebars')
  .create({
    defaultLayout: 'main'
  });
//设置express的视图引擎
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
// 设置程序端口
app.set('port', process.env.PORT || 3000);

//把static中间件加在所有路由之前
/*
static 中间件相当于给你想要发送的所有静态文件创建一个路由，渲染文件并发送给客户端
*/
app.use(express.static(__dirname + '/public'));

//幸运饼干数组
var fortuneCookies = [
  "Conquer your fears or they will conquer you.",
  "Rivers need springs.",
  "Do not fear what you don't know.",
  "You will have a pleasant surprise.",
  "Whenever possible, keep it simple.",
];

/*
使用视图的新路由替换旧路由
视图引擎默认会返回text/html的内容和200的状态码，所以不需指定
*/
app.get('/', function(req, res) {
  res.render('home');
});
app.get('/about', function(req, res) {
	//随机获取虚拟饼干，返回到about页面
  var randomFortune = fortuneCookies[Math.floor(Math.random() * fortuneCookies.length)];
  res.render('about', {
    fortune: randomFortune
  });
});
/********************************************************************/
//todo... 但在middleware中要指定状态码
// 404 catch-all handler (middleware)  （定制404页面）
app.use(function(req, res, next) {
  res.status(404);
  res.render('404');
});

// 500 error handler (middleware)   （定制500页面）
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500);
  res.render('500');
});

//he app.listen() method is a convenience method for the following (for HTTP only):
app.listen(app.get('port'), function() {
  console.log('Express started on https://localhost:' +
    app.get('port') + '; press Ctrl-C to terminate.');
});
