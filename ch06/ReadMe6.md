#### 第六章 请求和响应对象
**说明**: 在用Express构建Web服务器时，大部分工作是从**请求对象开始**，到**响应对象终止**。这个两个对象起源于Node,Express对其进行了扩展。

###### 一. URL的组成部分

![](http://img.mukewang.com/571b0c460001a03615950450.jpg)

1.1 **协议 (protocol)**: 协议确定如何传输请求。
> 主要是处理**http**和**https**。其他常见的协议还有file 和ftp。

1.2 **主机名（hostname）**: 主机名标识服务器。
- 运行在本地计算机（localhost）和本地网络的服务器可以简单地表示，比如用一个单词，或一个数字 IP 地址。
- 在 Internet 环境下，主机名通常以一个顶级域名（TLD）结尾，比如 .com 或 .net。另外，也许还会有子域名作为主机名的前缀。请求和响应对象子域名可以是任何形式的，其中 www 最为常见。子域名通常是可选的。

1.3 **端口(port)**： 每一台服务器都有一系列端口号。
- 一些端口号比较“特殊”，如 80 和 443 端口。如果省略端口值，那么默认 80 端口负责 HTTP 传输，443 端口负责 HTTPS 传输。
- 如果不使用 80 和 443 端口，就需要一个大于 10231的端口号。

1.4 **路径（path）**： URL 中影响应用程序的第一个组成部分通常是路径（在考虑协议、主机名和端口的基础上做决定很合理，但是不够好）。路径是应用中的页面或其他资源的唯一标识。

1.5 **查询字符串(querystring)**：查询字符串是一种键值对集合，是可选的。
- 它以问号（?）开头，键值对则以与号（&）分隔开。所有的名称和值都必须是 URL 编码的。对此，JavaScript 提供了一个嵌入式的函数 encodeURIComponent 来处理。
> 例如，空格被加号（+）替换。其他特殊字符被数字型字符替换。

1.6 **信息片段（fragment）**: 信息片段（或散列）被严格限制在浏览器中使用，不会传递到服务器。
- 用它控制单页应用或 AJAX 富应用越来越普遍。
- 最初，信息片段只是用来让浏览器展现文档中通过锚点标记（<a id="chapter06">）指定的部分。

##### 二 HTTP请求方法
**HTTP 协议确定了客户端与服务器通信的请求方法集合（通常称为 HTTP verbs）**
- GET和POST的方法最常见
- 在浏览器中键入一个 URL（或点击一个链接），服务器会接收到一个 HTTP GET 请求，其中的重要信息是 URL 路径和查询字符串。至于如何响应，则需要应用程序结合方法、路径和查询字符串来决定。
- 对于一个网站来说，大部分页面都响应 GET 请求。POST 请求通常用来提交信息到服务器后台（例如表单处理）。
- 服务器将请求中包含的所有信息（例如表单）处理完成之后，用以响应的 HTML 通常与相应的 GET 请求是一样的。与服务器通信时，浏览器只使用 GET 和POST 方法（如果没有使用 AJAX）。
- 另一方面，网络服务通常会使用更多的创造性 HTTP 方法。例如，一个 HTTP 方法被命名注 1： 0~1023 端口为“知名端口”。为 DELETE，它就用来接受 API 指令执行删除功能。
- 使用 Node 和 Express，可以完全掌控响应方法（尽管一些更复杂的方法支持得不是很好）。在 Express 中，通常要针对特殊方法编写处理程序。

##### 三. 请求报头
- 我们浏览网页时，发送到服务器的并不只是 URL。当你访问一个网站时，浏览器会发送很多**“隐形”信息**。
- 服务器会因此得知优先响应哪种语言的页面（例如，在西班牙下载 Chrome 浏览器，如果有西班牙语的版本，就会接收到一个西班牙语的访问页面）。它也会发送“用户代理”信息（浏览器、操作系统和硬件设备）和其他一些信息。
- 所有能够确保你了解请求对象头文件属性的信息都将会作为请求报头发送。
- 如果想查看浏览器发送的信息，可以创建一个非常简单的 Express 路由来展示一下：
``` JavaScript
app.get('/headers', function(req,res){
  res.set('Content-Type','text/plain');
  var s = '';
  for(var name in req.headers) s += name + ': ' + req.headers[name] + '\n';
  res.send(s);
});
```

##### 四. 响应报头
- 正如浏览器以请求报头的形式发送隐藏信息到服务器，当服务器响应时，同样会回传一些**浏览器没必要渲染和显示的信息**，通常是**元数据**和**服务器信息**。
**响应报头** 主要包含的信息：
> - 内容类型头信息；
> - 指出响应信息是否被压缩；
> - 使用的是哪种编码
等等

- 响应报头还可以包含关于浏览器对资源缓存时长的提示。优化网站时需要着重考虑这一点。响应报头还经常会包含一些关于服务器的信息，一般会指出服务器的类型，有时甚至会包含操作系统的详细信息。
- 返回服务器信息存在一个问题，那就是它会给黑客一个可乘之机，从而使站点陷入危险。非常重视安全的服务器经常忽略此信息，甚至提供虚假信息。禁用 Express 的 X-Powered-By 头信息很简单：`app.disable('x-powered-by');`

##### 五. 互联网媒体类型
- 内容类型报头信息极其重要，没有它，客户端很难判断如何渲染接收到的内容。
- 内容类型报头就是一种**互联网媒体类型** 由： **一个类型**、**一个子类型** 以及 **可选的参数** 组成。
> - 例如，`text/html;charset=UTF-8` 说明类型是 text，子类型是 html，字符编码是 UTF-8。

- 互联网编号分配机构维护了一个官方的[互联网媒体类型清单](http://www.iana.org/assignments/media-types/media-types.xhtml);
- 常见的 content type、Internet media type 和 MIME type 是可以互换的。MIME（多用途互联网邮件扩展）是互联网媒体类型的前身，它们大部分是相同的。

##### 六. 请求体
除请求报头外，请求还有一个**主体（就像作为实际内容返回的响应主体一样）** 。
- 一般 GET请求没有主体内容，但 POST 请求是有的。POST 请求体最常见的媒体类型是 `application/x-www-form-urlendcoded`，**是键值对集合的简单编码**，用 & 分隔（基本上和查询字符串的格式一样）。
- 如果 POST 请求需要支持文件上传，则媒体类型是`multipart/form-data`，它是一种更为复杂的格式。最后是 AJAX 请求，它可以使用 application/json。

##### 七. 参数
- “参数”这个词可以有很多种解释，它通常是困惑的源头。对于任何一个请求，参数可以来自查询字符串、会话、请求体或指定的路由参数。
- 在 Node 应用中，请求对象的参数方法会重写所有的参数。因此我们最好不要深究。通常这会带来问题，一个参数在查询字符串中，另一个在 POST 请求体中或会话中，哪个会赢呢？这会产生让人抓狂的 bug。PHP 是产生这种混乱的主要原因：为了尽量“方便”，它将所有参数重新写入了一个称为 `$_REQUEST` 的变量，由于某种原因，人们曾认为这是个前所未有的好主意。我们将学习保存不同类型参数的专用属性，我认为这能够减少困惑。

##### 八. 请求对象
- 请求对象（通常传递到回调方法，这意味着你可以随意命名，通常命名为 req 或 request）的生命**周期始于 Node** 的一个核心对象 `http.IncomingMessage` 的实例。Express 添加了一些附加功能。
- 我们来看看请求对象中最有用的属性和方法（除了来自 Node 的 req.headers 和req.url，所有这些方法都由 Express 添加）。

| 属性/方法       |  功能                 |       注释      |
| -----------    | -------------------   |   ---------     |  
| req.params     | 一个数组，包含命名过的路由参数。           |                            |
| req.param(name)| 返回命名的路由参数，或者 GET 请求或 POST 请求参数。|  建议忽略此方法。  |
| req.query    |  一个对象，包含以键值对存放的查询字符串参数（通常称为 GET 请求参数）||
| req.body     | 一个对象，包含 POST 请求参数。这样命名是因为 POST 请求参数在 REQUEST 正文中传递，而不像查询字符串在 URL 中传递。要使 req.body 可用，需要中间件能够解析请求正文内容类型| |
| req.route    | 关于当前匹配路由的信息                  | 主要用于路由调试。  |
|req.cookies/req.singnedCookies| 一个对象，包含从客户端传递过来的 cookies 值， 从客户端接收到的请求报头| |
|req.accepts([types]) |一个简便的方法，用来确定客户端是否接受一个或一组指定的类型（可选类型可以是单个的 MIME 类型，如 application/json、一个逗号分隔集合或是一个数组）|写公共API 的人对该方法很感兴趣。假定浏览器默认始终接受 HTML|
|req.ip  | 客户端的 IP 地址 |  |
|req.path | 请求路径（不包含协议、主机、端口或查询字符串） |   |
|req.host|一个简便的方法，用来返回客户端所报告的主机名 | 这些信息可以伪造，所以不应该用于安全目的 |
|req.xhr |一个简便属性，如果请求由 Ajax 发起将会返回 true|  |
|req.protocol|用于标识请求的协议（http 或 https）|   |
|req.secure|一个简便属性，如果连接是安全的，将返回 true| req.protocol==='https'|
|req.url/req.originalUrl | 有点用词不当，这些属性返回了路径和查询字符串（它们不包含协议、主机或端口）。req.url 若是出于内部路由目的，则可以重写，但是 req.orginalUrl 旨在保留原始请和查询字符串 |   |      
| req.acceptedLanguages | 一个简便方法，用来返回客户端首选的一组（人类的）语言 | 这些信息是从请求报头中解析而来的。 |
##### 九 [响应对象](http://blog.csdn.net/christine95/article/details/50500171)
- 响应对象（通常传递到回调方法，这意味着你可以随意命名它，通常命名为 res、resp 或response）的生命周期始于 Node 核心对象 http.ServerResponse 的实例。
- Express 添加了一些附加功能。我们来看看响应对象中最有用的属性和方法（所有这些方法都是由 Express添加的）。

| 属性/方法       |  功能                 |       注释      |
| -----------    | -------------------   |   ---------     |  
| res.status(code)| 设置 HTTP 状态代码。 | Express 默认为 200（成功），所以你可以使用这个方法返回状态404（页面不存在）或 500（服务器内部错误），或任何一个其他的状态码。|
|res.redirect([status],url) |重定向浏览器。默认重定向代码是 302（建立）。|通常，你应尽量减少重定向，除非永久移动一个页面，这种情况应当使用代码 301（永久移动）。|
|res.set(name,value)  |设置响应头。| 这通常不需要手动设置。|
|res.cookie（name,vaue,[options]）|设置客户端 cookies 值。 |需要中间件支持|
|res.clearCookie(name,[options]) | 清除客户端 cookies 值| 需要中间件支持|
|res.send(body)、 res.send(status,body)|向客户端发送响应及可选的状态码。|Express 的默认内容类型是 text/html。如果你想改为 text/plain，需要在 res.send 之前调用 res.set('Content-Type','text/plain\')。如果 body 是一个对象或一个数组，响应将会以 JSON 发送（内容类型需要被正确设置），不过既然你想发送 JSON，我推荐你调用 res.json。 |     
|res.json(json), res.json(status,json)|向客户端发送 JSON 以及可选的状态码| |
|res.type(type) | 一个简便的方法，用于设置 Content-Type 头信息。基本上相当于 res.set('Content-Type','type')，只是如果你提供了一个没有斜杠的字符串，它会试图把其当作文件的扩展名映射为一个互联网媒体类型。比如，res.type('txt') 会将 Content-Type 设为text/plain。|此功能在有些领域可能会有用（例如自动提供不同的多媒体文件），但是通常应该避免使用它，以便明确设置正确的互联网媒体类型。|
|res.format(object)|这个方法允许你根据接收请求报头发送不同的内容。|这是它在 API 中的主要用途，这里有一个非常简单的例子：res.format({'text/plain':'hithere','text/html':'<b>hi there</b>'})|  
|res.attachment([filename]),res.download(path,[filename],[callback]) |这两种方法会将响应报头 Content-Disposition 设为 attachment，这样浏览器就会选择下载而不是展现内容。你可以指定 filename 给浏览器作为对用户的提示。用 res.download 可以指定要下载的文件，而 res.attachment 只是设置报头。| |
|res.sendFile(path,[option],[callback]) |这个方法可根据路径读取指定文件并将内容发送到客户端。使用该方法很方便。使用静态中间件，并将发送到客户端的文件放在公共目录下，这很容易。然而，如果你想根据条件在相同的 URL 下提供不同的资源，这个方法可以派上用场。 | |  
|res.links(links)| 设置链接响应报头。|这是一个专用的报头，在大多数应用程序中几乎没有用处。|
|res.locals,res.render(view,[locals],callback)|res.locals 是一个对象，包含用于渲染视图的默认上下文。|res.render 使用配置的模请求和响应对象 |
> 板引擎渲染视图（不能把 res.render 的 locals 参数与 res.locals 混为一谈，上下文**在 res.locals 中会被重写，但在没有被重写的情况下仍然可用**）。res.render 的默认响应代码为 200，使用 res.status 可以指定一个不同的代码。
> - 响应对象的方法基本分三类：
>> - 响应的内容：
```JavaScript
res.send(body),res.send(status,body)
res.json(json),res.json(status,json)
res.jsonp(json),req.jsonp(status,json)
res.sendFile(path,[option],[callback])
res.locals,res.render(view,[locals],callback)
```
>>　- 响应的报头：
```JavaScript
res.status(code)
res.set(name,value)
res.type(type)
res.format(object)
res.attachment([filename]),res.download(path,[filename],[callback])
res.redirect([status],url)
```
> - 响应的数据：
```JavaScript
res.cookie（name,vaue,[options]）,res.clearCookie(name,[options])
```



##### 十 获取更多信息
- Express源码的[目录结构](http://cnodejs.org/topic/5746cdcf991011691ef17b88)如下图：   
![](http://dn-cnode.qbox.me/FnuptVMv5TZchESOT0JRT0re7KZ0)

- /lib/application.js:　Express主接口。（中间节如何接入，视图是如何渲染的）
- /lib/express.js ： 这是一个相对较短的shell，是/lib/application.js 中Connect的功能扩展，它返回一个函数，可以用http.createServer运行Express;
- /lib/request.js : 扩展了Node的`http.IncomingMessage`对象，提供了一个稳健的请求对象。关于请求对象属性和方法的所有信息都在这个文件里。
- /lib/response.js : 扩展了Node的`http.ServerReponse`对象，提供响应对象。关于响应对象的所有属性和方法都在这个文件里。
- /lib/router/route.js: 提供基础路由支持。尽管路由是应用的核心，但这个文件只有不到200行，你会发现它非常地简单优雅。

#####  十一. 内容渲染
- 大多数情况下，渲染内容用`res.render`，它最大程度地根据布局渲染视图。如果想写一个快速测试页，也许会用到`res.send`。
- 你可以使用`req.query`得到查询字符串的值;
- 使用`req.session`得到会话值;
- 使用`req.cookie/req.singedCookies`得到cookies值。

- 基本用法
```JavaScript
//基本用法
app.get('/about', function(req, res){
 res.render('about');
});
```
- 200以外的响应代码
```JavaScript
app.get('/error', function(req, res){
 res.status(500);
 res.render('error');
});
//或是一行...
app.get('/error', function(req, res){
 res.status(500).render('error');
});
```
- 将上下文传递给视图，包括查询字符串、cookie和session值
```JavaScript
app.get('/greeting', function(req, res){
res.render('about', {
    message: 'welcome',
    style: req.query.style,
    userid: req.cookie.userid,
    username: req.session.username,
});
});
```
- 没有布局的视图渲染
```JavaScript
//下面的layout没有布局文件，即views/no-layout.handlebars
//必须包含必要的HTML
app.get('/no-layout', function(req, res){
  res.render('no-layout', { layout: null });
});
```
- 使用定制布局渲染视图
```JavaScript
// 使用布局文件views/layouts/custom.handlebars
app.get('/custom-layout', function(req, res){
  res.render('custom-layout', { layout: 'custom' });
});
```
- 渲染纯文本输出
```JavaScript
app.get('/test', function(req, res){
  res.type('text/plain');
  res.send('this is a test');
});
```
- 添加错误处理程序
```JavaScript
//这应该出现在所有路由方法的结尾
//需要注意的是，即使你不需要一个“下一步”方法
//它也必须包含，以便Express将它识别为一个错误处理程序
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).render('error');
});
```

- 添加一个404处理程序
```JavaScript
//这应该出现在所有路由方法的结尾
app.use(function(req, res){
res.status(404).render('not-found');
});
```
##### 十二. 处理表单
- 当处理表单时，表单信息一般在req.body中（或者偶尔在req.query中）。可以使用req.xhr来判断是AJAX请求还是浏览请求;

- 基本表单处理
```JavaScript
//必须引入中间件body-parser
app.post('/process-contact', function(req, res){
  console.log('Received contact from ' + req.body.name +
     ' <' + req.body.email + '>');
  //保存到数据库....
  res.redirect(303, '/thank-you');
});
```
- 更强大的表单处理
```JavaScript
//必须引入中间件body-parser
app.post('/process-contact', function(req, res){
console.log('Received contact from ' + req.body.name +
' <' + req.body.email + '>');
try {
  //保存到数据库....
  return res.xhr ?
      res.render({ success: true }) :
      res.redirect(303, '/thank-you');
} catch(ex) {
  return res.xhr ?
      res.json({ error: 'Database error.' }) :
      res.redirect(303, '/database-error');
}
});
```

##### 十三. 提供一个API
- 如果提供一个类似于表单处理的API，参数通常会在req.query中，虽然也可以使用req.body。与其他API不同，这种情况下通常会返回JSON、XML或纯文本，而不是HTML。
- 你会经常使用不太常见的HTTP方法，比如PUT、POST和DELETE。

eg:　“产品”数组（通常是从数据库中检索）：
```jsonp
var tours = [
{ id: 0, name: 'Hood River', price: 99.99 },
{ id: 1, name: 'Oregon Coast', price: 149.95 },
];
```

- 简单的GET节点，只返回JSON数据
```JavaScript
app.get('/api/tours'), function(req, res){
  res.json(tours);
});
```

- 根据客户端的首选项，使用Express中的res.format方法对其响应。GET节点，返回JSON、XML或text;
```
app.get('/api/tours', function(req, res){
var toursXml = '<?xml version="1.0"?><tours>' +
    products.map(function(p){
       return '<tour price="' + p.price +
             '" id="' + p.id + '">' + p.name + '</tour>';
    }).join('') + '</tours>'';

var toursText = tours.map(function(p){
       return p.id + ': ' + p.name + ' (' + p.price + ')';
    }).join('\n');

   res.format({
        'application/json': function(){
              res.json(tours);
       },
        'application/xml': function(){
              res.type('application/xml');
              res.send(toursXml);
       },
       'text/xml': function(){
             res.type('text/xml');
             res.send(toursXml);
       }
      'text/plain': function(){
             res.type('text/plain');
             res.send(toursXml);
      }
 });
});
```

- PUT节点**更新一个产品信息然后返回JSON**。参数在查询字符串中传递（路由字符串中的'':id''命令Express在req.params中增加一个id属性）。用于更新的PUT节点
```JavaScript
//API用于更新一条数据并且返回JSON；参数在查询字符串中传递
app.put('/api/tour/:id', function(req, res){
var p = tours.some(function(p){ return p.id == req.params.id });
if( p ) {
         if( req.query.name ) p.name = req.query.name;
         if( req.query.price ) p.price = req.query.price;
         res.json({success: true});
} else {
         res.json({error: 'No such tour exists.'});
}
});
```
- 用于删除的DEL节点
```JavaScript
// API用于删除一个产品
api.del('/api/tour/:id', function(req, res){
var i;
for( var i=tours.length-1; i>=0; i-- )
    if( tours[i].id == req.params.id ) break;
if( i>=0 ) {
    tours.splice(i, 1);
    res.json({success: true});
} else {
    res.json({error: 'No such tour exists.'});
}
});
```
