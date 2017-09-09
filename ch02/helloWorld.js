var http = require('http'),
  fs = require('fs');

/*// todo...源码
exports.createServer = function(requestListener) {
  return new Server(requestListener);
};*/

// base1  Hello World
/*
http.createServer(function(req, res){
 res.writeHead(200, {'Content-type' : 'text/html'}); //plain
 res.write('<h1>Node.js11</h1>');
 res.end('<p>Hello World</p>');
}).listen(3000);

*/

// base2  路由
/*http.createServer(function(req, res) {
  //规范化url,去掉查询字符串、可选的反斜杠，并把它变成小写
  var path = req.url.replace(/\/?(?:\?.*)?$/, '').toLowerCase();
  switch (path) {
    case '':
      res.writeHead(200, {
        'Content-type': 'text/plain'
      });
      res.end('HomePage');
      break;
    case '/about':
      res.writeHead(200, {
        'Content-type': 'text/plain'
      });
      res.end('about');
      break;
    default:
      res.writeHead(404, 'Content-type', 'text/plain');
      res.end('Not Found!');
  }

}).listen(3000);*/

//base3 静态资源服务
/*
__dirname： 会被解析为正在执行脚本所在的目录；
*/

function serveStaticFile(res, path, contentType, responseCode) {
  if (!responseCode) responseCode = 200;
  fs.readFile(__dirname+path, function(err, data) {
    console.log(__dirname+path, err, data);
    if (err) {
      res.writeHead(500, {
        'Content-type': 'text/plain'
      });
      res.end('500-Internal Error');
    } else {
      res.writeHead(responseCode, {
        'Content-type':
        contentType
      });
      res.end(data);
    }
  });
}

http.createServer(function(req, res) {
  //规范化url,去掉查询字符串、可选的反斜杠，并把它变成小写
  var path = req.url.replace(/\/?(?:\?.*)?$/, '').toLowerCase();
  switch (path) {
    case '':
      serveStaticFile(res, '/public/home.html', 'text/html');
      break;
    case '/about':
      serveStaticFile(res, '/public/about.html', 'text/html');
      break;
    case '/img/logo.jpg':
      serveStaticFile(res, '/public/img/logo.jpg', 'image/jpeg');
      break;
    default:
      serveStaticFile(res, '/pulibc/404.html', 'text/html');
      break;
  }

}).listen(3000);
