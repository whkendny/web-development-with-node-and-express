#### 第九章 Cookie 与会话

##### 9.1 简介
- **HTTP是无状态协议**。
> - 当浏览器中加载页面，然后转到同一网站的另一页面时，服务器和浏览器都没有任何内在的方法可以认识到，这是同一浏览器访问同一网站。
> - 换一种说法，Web工作的方式就是在每个HTTP请求中都要包含所有必要的信息，服务器才能满足这个请求。

- 所以需要用某种办法在HTTP上建立状态，于是便有了cookie和会话。

##### 9.2 关于cookie
- **cookie的想法很简单**：服务器发送一点信息，浏览器**在一段可配置的时期内保存它**。发送哪些信息确实是由服务器来决定：**通常只是一个唯一ID号，标识特定浏览器，从而维持一个有状态的假象**。
- cookie对用户来说不是加密的;
- 服务器向客户端发送的所有cookie都能被客户端查看。
- 用户对cookie有绝对的控制权,可以删除或禁用cookie;
- 一般的cookie可以被篡改;
- 不管浏览器什么时候发起一个跟cookie关联的请求，盲目地相信cookie中的内容，都有可能会受到攻击。要确保cookie不被篡改，使用**签名cookie**。

##### 9.3 cookie可以用于攻击
- 跨站脚本攻击 （XSS）攻击方式 :  XSS攻击中有一种技术就涉及用**恶意的JavaScript修改cookie中的内容**。所以不要轻易相信返回到服务器的cookie内容。
- 用签名cookie会有帮助（不管是用户修改的还是恶意JavaScript修改的，这些篡改都会**在签名cookie中留下明显的痕迹**），并且还可以**设定选项指明cookie只能由服务器修改**。这些cookie的用途会受限，但它们肯定更安全。
- 如果可以选择，会话要优于cookie
- 大多数情况下，可以**用会话维持状态**; 并且**会话更容易，不用担心会滥用用户的存储，而且也更安全**。
- 当服务器希望客户端保存一个cookie时，它会**发送一个响应头Set-Cookie**，其中包含**名称/值对**。当客户端向服务器发送含有cookie的请求时，它会发送多个请求头Cookie，其中包含这些cookie的值。

##### 9.4 凭证的外化
- 为了保证cookie的安全，必须有一个**cookie秘钥**。cookie秘钥是一个`字符串`，服务器知道它是什么，**它会在cookie发送到客户端之前对cookie加密**。这是一个不需要记住的密码，所以可以是随机字符串。
- 推荐用一个[随机密码生成器]()来生成cookie秘钥。
- 外化第三方凭证是一种常见的做法，比如cookie秘钥、数据库密码和API令牌（Twitter、Facebook等）。这不仅易于维护（容易找到和更新凭证），还可以让版本控制系统忽略这些凭证文件。这对放在GitHub或其他开源源码控制库上的开源代码库尤其重要。
- 因此可以准备**将凭证外化在一个JavaScript文件**中（用JSON或XML也行，但我觉得JavaScript最容易）。
- 创建文件credentials.js：
```javascript
module.exports = {
    cookieSecret: '把你的cookie秘钥放在这里',
};
```
- 现在，为了防止不慎把这个文件添加到源码库中，在.gitignore文件中加上credentials.js。
```JavaScript
var credentials = require('./credentials.js');
```

###### 9.5 Express中的Cookie
- 在程序中开始设置和访问cookie之前，需要先引入中间件`cookie-parser`。
首先`npm install --save cookie-parser`，然后
```javascript
app.use(require('cookie-parser')(credentials.cookieSecret));
```
- 完成这个之后，就可以**在任何能访问到响应对象的地方设置cookie或签名cookie**：
```javascript
// 设置cookie值
res.cookie('monster', 'nom nom');
res.cookie('signed_monster', 'nom nom', { signed: true }); //签名cookie
```
- 签名cookie的优先级高于未签名cookie。如果将签名cookie命名为signed_monster，那就不能用这个名字再命名未签名cookie（它返回时会变成undefined）。
- 要获取客户端发送过来的cookie的值（如果有的话），只需访问请求对象的cookie或signedCookie属性：
```javascript
//获取cookies值
var monster = req.cookies.monster;
var signedMonster = req.signedCookies.monster;
```
- 任何字符串都可以作为cookie的名称。
- 要删除cookie，用res.clearCookie：
```javascript
res.clearCookie('monster');
```

##### 9.6 设置cookie时可以使用如下这些选项：
| 选项| 说明| 注意|     
|-----|-----|----|
|domain| 控制跟cookie关联的域名。这样可以将cookie分配给特定的子域名。| 注意，不能给cookie设置跟服务器所用域名不同的域名，因为那样它什么也不会做。|
|path|控制应用这个cookie的路径。|注意，路径会隐含地通配其后的路径。如果用的路径是/ （默认值），它会应用到网站的所有页面上。如果用的路径是/foo，它会应用到/foo、/foo/bar等路径上|
|maxAge| 指定客户端应该保存cookie多长时间，单位是毫秒。| 如果你省略了这一选项，浏览器关闭时cookie就会被删掉。（也可以用expiration指定cookie过期的日期，但语法很麻烦。建议用maxAge。）|
|secure| 指定该cookie只通过安全（HTTPS）连接发送。| |
|httpOnly|将这个选项设为true表明这个cookie只能由服务器修改。| 也就是说客户端JavaScript不能修改它。这有助于防范XSS攻击。|
|signed|设为true会对这个cookie签名，这样就需要用res.signedCookies而不是res.cookies访问它。 | 被篡改的签名cookie会被服务器拒绝，并且cookie值会重置为它的原始值。|

##### 9.7 会话
- 会话实际上只是更方便的状态维护方法。
- 要实现会话，必须在客户端存些东西，否则服务器无法从一个请求到下一个请求中识别客户端。
- 通常的做法是用一个包含唯一标识的cookie，然后服务器用这个标识获取相应的会话信息; cookie不是实现这个目的的唯一手段，比如在URL中添加会话信息等；但这些技术混乱、困难且效率低下，所以最好别用。
- HTML5为会话提供了另一种选择，那就是本地存储，但现在还没有令人叹服的理由去采用这种技术而放弃经过验证有效的cookie。
- 从广义上来说，有两种实现会话的方法：
> - 把所有东西都存在cookie里，被称为“基于cookie的会话”，并且仅仅表示比使用cookie便利;然而，它还意味着要把添加到cookie中的所有东西都存在客户端浏览器中，所以不推荐
> - 只在cookie里存一个唯一标识，其他东西都存在服务器上。

##### 9.8 内存存储
- 把会话信息存在服务器上,那么必须找个地方存储它。入门级的选择是**内存会话**。
- 它们非常容易设置，但也有个巨大的缺陷：**重启服务器后会话信息就消失了**。更糟的是，如果扩展了多台服务器，那么每次请求可能是由不同的服务器处理的，所以会话数据有时在那里，有时不在。这明显是不可接受的用户体验。
- 然而出于开发和测试的需要，有它就足够了。
- 首先安装`express-session`（`npm install --save express-session`）;
- 然后，在链入cookie-parser之后链入`express-session`：
```javascript
app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')());
```

- 中间件express-session接受带有如下选项的配置对象：  

| 选项| 说明| 注意|     
|-----|-----|----|
|key | 存放唯一会话标识的cookie名称。默认为connect.sid。||  
|store| 会话存储的实例| 默认为一个MemoryStore的实例，可以满足我们当前的要求。 |
|cookie| 会话cookie的cookie设置 （path、domain、secure等）。|适用于常规的cookie默认值。|


##### 9.9 使用会话
- 会话设置好以后，使用起来就再简单不过了，只是使用请求对象的session变量的属性：
```javascript
req.session.userName = 'Anonymous';
var colorScheme = req.session.colorScheme || 'dark';
```
> 注意，对于会话而言，我们**不是用请求对象获取值，用响应对象设置值，它全都是在请求对象上操作的**。（响应对象没有session属性。）要删除会话，可以用JavaScript的`delete`操作符：
```javascript
req.session.userName = null;  // 这会将'userName'设为null;但不会移除它
delete req.session.colorScheme;   // 这会移除'colorScheme'
````

##### 9.10 用会话实现即显消息
- “即显”消息（不要跟Adobe Flash搞混了）只是在**不破坏用户导航的前提下向用户提供反馈的一种办法**。
- **用会话实现即显消息** 是最简单的方式（也可以用查询字符串，但那样除了URL会更丑外，还会把即显消息放到书签里）
```javascript
//使用了bootstrap
{{#if flash}}
  <div class="alert alert-dismissible alert-{{flash.type}}">
    <button type="button" class="close"
      data-dismiss="alert" aria-hidden="true">&times;</button>
    <strong>{{flash.intro}}</strong> {{{flash.message}}}
  </div>
{{/if}}
```
- 注意，在flash.message外面用了3个大括号，这样我们就可以在消息中使用简单的HTML（可能是要加重单词或包含超链接）。
- 接下来添加一些中间件，如果会话中有flash对象，将它添加到上下文中。即显消息显示过一次之后，我们就要从会话中去掉它，以免它在下一次请求时再次显示。在路由之前添加下面这段代码：
```JavaScript
app.use(function(req, res, next){
  // 如果有即显消息，把它传到上下文中，然后清除它
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});
```

- 接下来我们看一下如何使用即显消息。假设我们的用户订阅了简报，并且我们想在用户订阅后把他们重定向到简报归档页面去。我们的表单处理器可能是这样的：
```JavaScript
app.post('/newsletter', function(req, res){
  var name = req.body.name || '', email = req.body.email || '';
  // 输入验证
  if(!email.match(VALID_EMAIL_REGEX)) {
    if(req.xhr) return res.json({ error: 'Invalid name email address.' });
    req.session.flash = {
                    type: 'danger',
                    intro: 'Validation error!',
                    message: 'The email address you entered was not valid.',
    };
    return res.redirect(303, '/newsletter/archive');
  }
  new NewsletterSignup({ name: name, email: email }).save(function(err){
    if(err) {
      if(req.xhr) return res.json({ error: 'Database error.' });
      req.session.flash = {
                          type: 'danger',
                          intro: 'Database error!',
                          message: 'There was a database error; please try again later.',
      }
      return res.redirect(303, '/newsletter/archive');
    }
    if(req.xhr) return res.json({ success: true });
    req.session.flash = {
                    type: 'success',
                    intro: 'Thank you!',
                    message: 'You have now been signed up for the newsletter.',
    };
    return res.redirect(303, '/newsletter/archive');
  });
});
```
- 看如何用同一个处理器处理AJAX提交（因为我们检查了req.xhr），并且区分开了输入验证错误和数据库错误。记住，即便在前端做了输入验证，在后台也应该再做一次。
- 即显消息是网站中一种很棒的机制，即便在某些特定区域其他方法更合适一些（比如，即显消息在多表单“向导”或购物车结账流程中就不太合适）。
- 因为在中间件里把即显消息从会话中传给了res.locals.flash，所以必须执行重定向以便显示即显消息。如果不想通过重定向显示即显消息，直接设定`res.locals.flash`，而不是`req.session.flash`。

##### 9.11 会话的用途
- 当想**跨页保存用户的偏好时，可以用会话**。会话最常见的用法是提供用户验证信息，在登录后就会创建一个会话。之后就不用在每次重新加载页面时再登录一次。
- 即便没有用户账号，会话也有用。网站一般都要记住你喜欢如何排列东西，或者你喜欢哪种日期格式，这些都不需要登录。
- 尽管我建议优先选择会话而不是cookie，但理解cookie的工作机制也很重要（特别是因为有cookie才能用会话）。它对于你在应用中诊断问题、理解安全性及隐私问题都有帮助。 ￼
