### 第18章 安全

##### 18.1 HTTPS
- 使用 HTTPS 是提供安全服务的第一步。
- 互联网的本质决定了第三方有可能截取客户端和服务器端之间传输的数据包。
- HTTPS 会对那些包进行加密，让攻击者极难访问到所传输的信息。
- 你可以把 HTTPS 当作确保网站安全的基础。它不提供认证，但为认证奠定了基础。
> 比如说，认证系统可能涉及传输密码：如果密码是未经加密进行传输的，再复杂的认证也不能
确保系统的安全。安全的强度取决于整个体系中最弱的一环，而其中第一环就是网络协议。

- HTTPS协议基于服务器上的公钥证书，有时也叫SSL证书。SSL证书目前的标准格式是X.509。证书背后的思想是由证书颁发机构（CA）发行证书。
- CA 让浏览器厂商能访问**受信根证书**。在你安装浏览器时，其中就包含这些受信根证书，并靠它们建立起CA和浏览器之间的信任链。要用这个信任链，你的服务器必须使用由CA颁发的证书。
- 结果是要提供 HTTPS，则需要有来自 CA 的证书，那怎么才能得到这样的证书呢？(三种途径)
> - 可以自己生成;
> - 从免费 CA 那里获取;
> - 从商业 CA 那里买一个;

###### 18.1.1 [生成自己的证书](http://www.cnblogs.com/anlia/p/5920820.html)
- 生成自己的证书: 一般只适用于开发和测试用途（还有可能是部署在内网中）。
- 由于 CA确立起来的层级性，浏览器只信任由已知 CA（并且那个可能不是你）生成的证书。
- 要生成自己的证书，你需要一个 OpenSSL 实现


###### 18.1.2　使用免费的证书颁发机构

###### 18.1.3　购买证书
选择证书厂商时会考虑下面四点:
- 客户支持;
- 避免链式根证书;
- 单域证书、多子域证书、多域证书及通配证书;
- 域证书、组织证书和扩展验证证书
> - **域证书:** 就像它的名字一样，只是证明你是在用你自己所认为的域名做业务。
> - **组织证书:** 在某种程度上为你在打交道的真正组织提供保证。
> - **扩展认证证书:** 这是 SSL 证书中的劳斯莱斯。它们像组织证书一样能证实组织的存在，但它们要求更高标准的证据，甚至要求昂贵的审查来建立你的数据安全实践（尽管看起来这种要求越来越少了）。

###### 18.1.4　对你的Express应用启用HTTPS
- 将私钥和SSL证书放在ssl子目录下;
- 用 https 模块代替 http 模块，把 options 对象传给createServer方法就可以了：

```javascript
var options = {
  key: fs.readFileSync(__dirname + '/ssl/meadowlark.pem'),
  cert: fs.readFileSync(__dirname + '/ssl/meadowlark.crt'),
};

server = https.createServer(options, app).listen(app.get('port'), function(){
  console.log( 'Express started in ' + app.get('env') +
  ' mode on port ' + app.get('port') + ' using HTTPS' +
  '; press Ctrl-C to terminate.' );
});
```
> 现在可以连接到 https://localhost:3000。如果连接 http://localhost:3000，只会访问超时。

###### 18.1.5　关于端口的说明
- 如果没有指明端口，浏览器HTTP协议默认用的是端口 80 (一般不显示);
- HTTPS 的标准(默认)端口是 443;
- 大多数系统 端口 1~1024 需要提升权限才能打开;

###### 18.1.6　HTTPS和代理
- 如果你的网站运行在一个共享的托管环境下，几乎可以肯定的是，会有个代理服务器将请求路由给你的应用程序。
- 如果用了代理服务器，客户端（用户的浏览器）会跟代理服务器通信，不是直接连到你的服务器上。然后代理服务器很可能通过常规的 HTTP 跟你的应用通信（因为你的应用和代理服务器都运行在同一个可信网络中）。你经常会听到有人说 HTTPS 止于代理服务器。
- 应用程序需要同时处理安全和非安全请, 其代理设置有如下三种解决方案:
> - 第一种是简单地将代理配置成所有 HTTP 请求都重定向到HTTPS，本质上是强制所有跟你的应用程序的通信都通过 HTTPS
> - 第二种方式在某种程度上是将客户端 - 代理所用的通信协议发给你的服务器。最常用的办法是通过 X-Forwarded-Proto 头。如在 Nginx 中设定这个请求头：
`proxy_set_header X-Forwarded-Proto $scheme;`
然后在你的应用中检查用的是不是 HTTPS 协议：

```javascript
app.get('/', function(req, res) {
  // 下面这行代码本质上等同于： if(req.secure)
  if(req.headers['x-forwarded-proto']==='https') {
    res.send('line is secure');
  } else{
    res.send('you are insecure!');
  }
});
```
> - 在 Nginix 中有一个专门针对 HTTP 和 HTTPS 的服务器配置块。如果你在跟HTTP 对应的配置块中设置 X-Forwarded-Protocol 时失败了，那客户端就可以伪造请求头欺骗你的应用程序，即便连接不是安全的，也能让你的应用程序认为是安全的。如果你用这种办法，一定要确保设置好 X-Forwarded-
Protocol 请求头。
> - Express 提供了一些便利的属性，在你使用代理时改变行为（十分正确）。不要忘了用 app.
enable('trust proxy') 告诉 Express 要相信代理。一旦你这样做了，  req.protocol 、 req.
secure 和 req.ip 将会指向客户端到代理的连接，不是到你的应用的。

##### 18.2 跨域请求伪造(CSRF)
- 跨站请求伪造（CSRF）攻击利用了**用户一般都会相信浏览器并且在同一个会话中访问多个网站**这样的事实。
- 在 CSRF 攻击中，恶意站点上的脚本会请求另外一个网站：如果你在另一个网站上登录过，恶意网站可以成功访问那个网站上的安全数据。
- 防范 CSRF 攻击: 确保请求合法地来自你的网站; 做法:给浏览器传一个唯一的令牌。当浏览器提交表单时，服务器会进行检查，以确保令牌是匹配的。
- csurf 中间件负责令牌的创建和验证；你只需要确保令牌包含在到服务器的请求中。安装
csurf 中间件（ npm install --save csurf ），然后引入它，添加一个令牌到 res.locals 中：

```javascript
app.use(require('csurf')());
app.use(function(req, res, next) {
	res.locals._csrfToken = req.csrfToken();
	next();
});
```
csurf 中间件添加了 csurfToken 方法到请求对象上。我们不一定非要把它赋给 res.locals ，
可以将 req.csurfToken() 直接传给需要它的视图，但这个工作量一般更小。
> 现在你所有的表单（以及 AJAX 调用）都必须提供一个叫作 `_csrf` 的域，它必须跟生成的
令牌相匹配。然后将其添加到表单:

```html
<form action="/newsletter" method="POST">
  <input type="hidden" name="_csrf" value="{{_csrfToken}}">
  名称：<input type="text" name="name"><br>
  邮箱：<input type="email" name="email"><br>
  <button type="submit"> 提交 </button>
</form>
```
- 如果你有一个 API，很可能不想让 csurf 中间件干扰它。
- 如果你想限制其他网站访问这个 API，应该看看 connect-rest 的 API key 功能。
- 要防止 csurf干扰你的中间件，就在引入 csurf 之前引入它。

##### 18.3 认证

###### 18.3.1　认证与授权
**认证:** 是指验证用户的身份，即他们是自己所宣称的人。
**授权:** 是指确定用户有哪些权力，可以访问、修改或查看什么。

###### 18.3.2　密码的问题


###### 18.3.3　第三方认证
- 第三方认证是指使用某些服务要通过一些主流账号(微信/QQ/微博 等)的服务认证和识别用户的机制;
- 第三方认证经常被称为 联合认证(通常跟安全断言标记语言（SAML）和 OpenID 有关联)或 代理认证(一般是跟 OAuth 关联的) 。
- 第三方认证的优势:
> - **认证负担降低了**。你不用为认证单个用户操心，只要跟信任的第三方交互就行了.
> - **减轻“密码疲劳”**，它是由太多账号引起的压力。
> - 第三方认证 **“没有摩擦”**：用户可以用他们已有的账号更快地用上你的网站。

###### 18.3.4　把用户存在数据库中
给用户创建一个模型吧， models/user.js:
```javascript
// 创建用户模式
var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
	authId: String,
	name: String,
	email: String,
	role: String,
	created: Date,
});

var User = mongoose.model('User', userSchema);
module.exports = User;
```

###### 18.3.5　认证与注册和用户体验
- **认证:** 是指通过可信的第三方或者你之前提供给用户的凭据（比如用户名和密码），验证用
户的身份。
- **注册:** 是用户从你的网站上获取账号的过程（从我们的角度来看，注册是我们在数据库中给用户创建 User 记录的时刻）。

###### 18.3.6　Passport
- Passport 是为 Node/Express 做的认证模块，非常健壮，也非常流行。它没有绑死在任何认证机制上，而是基于可插拔认证策略的思想（如果你不想用第三方认证，它也有本地策略）。

###### 18.3.7　基于角色的授权


###### 18.3.8　添加更多认证提供者

##### 18.4 结论
