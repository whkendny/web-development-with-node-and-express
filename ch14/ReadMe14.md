### 第十四章 路由
- 路由是将请求（由 URL 和 HTTP 方法指定） 路由到处理它们的代码去的一种机制。
- 信息架构（IA）: 内容的概念性组织。 在考虑路由之前有一个可扩展（但不过于复杂的） IA 会为你的后续工作提供巨大的好处.

- 实现持久的 IA的一些建议：
> - 绝不在 URL中暴露技术细节, eg:  URL 以“.asp” 结尾的网站;
> - 避免在 URL中出现无意义的信息；
> - 避免无谓的长 URL; 在同等条件下， 短的 URL 比长的 URL 好。     
然而你不应该为了缩短 URL 牺牲清晰性，或者 SEO。 缩写很诱人， 但要认真考虑： 在你把它们固定到 URL 中之前， 它们应该是非常常见和普遍的
> - 单词分隔符要保持一致;
> - 绝不要用空格或不可录入的字符;
> - 在 URL 中用小写字母;


##### 14.1 路由和SEO

##### 14.2 子域名
- 除了路径， 子域名一般也是 URL 中用来路由请求的部分。
- 子域名最好保留给程序中显著不同的部分， 比如 REST API（api.meadowlarktravel.com） 或 管 理 界 面（admin.
meadowlarktravel.com）。
- 有时使用子域名是出于技术方面的原因。比如说,如果我们准备
用 WordPress 搭建博客（而网站的其他部分用 Express）， 用 blog.meadowlarktravel.com 更容易（更好的方案是用代理服务器，比如 Nginx）。
-  用子域名分割内容时一般会影响 SEO，所以一般应该留给 SEO 不重要的区域， 比如管理区域和 API。 记住这一点， 并且只有在确实没有其他选择时， 才给对于 SEO 方案来说比较重要的内容使用子域名.
- Express 中的路由机制默认不会把子域名考虑在内：
> app.get(/about) 会处理对 http://meadowlarktravel.com/about、 http://www.meadowlarktravel.com/about 和 http://admin.meadowlarktravel.com/about 的请求。 如果你想分开处理子域名， 可以用 `vhost`包（表示“虚拟主机”，源自 Apache 的机制，一般用来处理子域名）。
>> - 先安装这个包（`npm install --save vhost`）
>> - 然后编辑应用程序文件创建一个子域名

```javascript
// create "admin" subdomain...this should appear
// before all your other routes
var admin = express.Router();
app.use(require('vhost')('admin.*', admin));

// create admin routes; these can be defined anywhere
admin.get('/', function(req, res){
	res.render('admin/home');
});
admin.get('/users', function(req, res){
	res.render('admin/users');
});
```
> - express.Router() 本质上是创建了一个新的 Express 路由器实例。
> - 你可以像对待原始实例(app）那样对它： 像对 app 那样给它添加路由和中间件。 然而在将它添加到 app 上之前，它什么也不会做。 我们通过 vhost 添加它， 将那个路由器实例绑到那个子域名。

##### 14.3 路由处理是中间件
- 只是匹配给定的路径。 但 app.get('/foo',...) 究竟做了什么呢？ 如第 10 章所述， 它只是一种特殊的中间件， 向下会有一个 next 方法传入。
```javascript
app.get('/foo', function(req,res,next){
  if(Math.random() < 0.5) return next();
  res.send('sometimes this');
});

app.get('/foo', function(req,res){
  res.send('and sometimes that');
});
```
- 在一个 app.get 使用任意多个处理器。 在下面这个例子中， 三种不同的响应出现的几率差不多：
```javascript
app.get('/foo',
  function(req,res, next){
    if(Math.random() < 0.33) return next();
    res.send('red');
  },
  function(req,res, next){
    if(Math.random() < 0.5) return next();
    res.send('green');
  },
  function(req,res){
    res.send('blue');
  },
)

```
- 乍一看可能不是特别实用， 但这让你可以创建可以用在任何路由中的通用函数。 比如说，我们有种机制在特定页面上显示特殊优惠。 特殊优惠经常换， 并且不是每个页面上都显示。 我们可以创建一个函数， 将 specials 注入到 res.locals 属性中（第 7 章讲过） ：
```javascript
function specials(req, res, next){
  res.locals.specials = getSpecialsFromDatabase();
  next();
}
app.get('/page-with-specials',specials,function(req,res){
  res.render('page-with-specials');
});
```
- 我们也可以用这种方式**实现授权机制**。 比如说我们的用户授权代码会设定一个会话变量`req.session.authorized`， 则可以像下面这样做一个可重复使用的授权过滤器：
```javascript
function authorize(req, res, next){
  if(req.session.authorized) return next();
  res.render('not-authorized');
}
app.get('/secret', authorize, function(){
  res.render('secret');
})
app.get('/sub-rosa', authorize, function(){
  res.render('sub-rosa');
});
```
##### 14.4 路由路径和正则表达式
- 路由中指定的路径（比如 /foo） 最终会被 Express 转换成一个正则表达式。
- 某些正则表达式中的元字符可以用在路由路径中： +、 ?、 \*、 ( 和 )。
> - 用同一个路由处理 /user 和 /username 两个 URL：

```javascript
app.get('/user(name)?', function(req,res){
  res.render('user');
});

// 匹配 http://khaaan.com ， http://khaaaaan.com
app.get('/khaa+n', function(req,res){
res.render('khaaan');
});
```

- 并不是所有的常规正则表达式元字符在路由路径中都有含义， 虽然只有前面列出来的那些。 这很重要， 因为一般在正则表达式中表示“任意字符” 的句号点（.） 可以不经转义用在路由中。
- 最后， 如果你的路由真的需要功能完整的正则表达式， 也可以支持的:

```javascript
app.get(/crazy|mad(ness)?|lunacy/, function(req,res){
  res.render('madness');
});
```

##### 14.5 路由参数
- 是一种把变量参数放到路由中成为其一部分的办法。
eg: 我们想给每位职员一个页面。 我们的数据库中有职员的简介和图片。 随着公司规模的增长， 给每位职员添加新的路由变得越来越不现实。 我们看一下路由参数是怎么帮我们的：
```javascript
var staff = {
    mitch: { bio: 'Mitch is the man to have at your back in a bar fight.' },
    madeline: { bio: 'Madeline is our Oregon expert.' },
    walt: { bio: 'Walt is our Oregon Coast expert.' },
};
app.get('/staff/:name', function(req, res){
var info = staff[req.params.name];
if(!info) return next(); // 最终将会落入 404
  res.render('staffer', info);
})
```
- 注意我们在路由中如何使用 :name。 它会跟任何字符串匹配（不包括反斜杠）， 并将其跟键 name 一起放到 req.params 对象中。
- 我们会经常用到这个参数，特别是在创建 REST API时。路由中可以有多个参数。 比如说， 如果我们想按城市分解职员列表：
```javascript
var staff = {
  portland: {
    mitch: { bio: 'Mitch is the man to have at your back.' },
    madeline: { bio: 'Madeline is our Oregon expert.' },
  },
  bend: {
    walt: { bio: 'Walt is our Oregon Coast expert.' },
  },
};
app.get('/staff/:city/:name', function(req, res){
  var info = staff[req.params.city][req.params.name];
  if(!info) return next(); // 最终将会落入 404
  res.render('staffer', info);
});
```

##### 14.6 组织路由
推荐下面这四条组织路由的指导原则:
- 给路由处理器用命名函数;
> - 到目前为止， 我们都是在行内写路由处理器的， 实际上就是马上在那里定义处理路由的函数。
> - 这对于小程序或原型来说没问题， 但随着网站的增长， 这种方式很快就会变得过
于笨重。

- 路由不应该神秘;
> - 对于大型网站， 可以根据功能区域把路由分开；


- 路由组织应该是可扩展的;

- 不要忽视自动化的基于视图的路由处理器;
> - 如果你的网站由很多静态和固定URL的页面组成，你的所有路由最终看起来将像是：`app.get('/static/thing', function(req,res){                      res.render('static/thing');  }`
> 要减少不必要的重复代码， 可以考虑使用自动化的基于视图的路由处理器。 本章后面介绍了这种方式， 并且它可以跟定制路由一起用。

##### 14.7 在模块中声明路由
组织路由的第一步是把它们都放到它们自己的模块中。这有很多种办法。
- 一种方式是将你的模块做成一个函数， 让它返回包含“方法” 和“处理器” 属性的对象数组。然后你可以这样在应用程序文件中定义路由：
```javascript
var routes = require('./routes.js')();
routes.forEach(function(route){
    app[route.method](route.handler);
})
```
> - 这种方式有它的优势，并且可能非常适合动态地存储路由，比如在数据库或 JSON文件中。
- 然而，如果你不需要那样的功能，我建议将 app实例传给模块，然后让它添加路由。 的例子中用的就是这种方式。 创建文件 routes.js， 将所有路由都放进去：

```javascript
module.exports = function(app){
  app.get('/', function(req,res){
    app.render('home');
}))
//...
};
```
- 如果只是剪切粘贴，我们可能会遇到一些问题。比如说，我们的/about处理器用的fortune对象在这个上下文中没有。
- 我们可以添加必要的引入，但先等一下：我们很快就要把处理器挪到它们自己的模块中去了，然后我们会解决这个问题。
- 那么我们如何连入路由呢？ 简单， 在 meadowlark.js 中直接引入路由：
```javascript
require('./routes.js')(app);
```

##### 14.8 按逻辑对处理器分组
- 以某种方式将相关功能分组更好。 那样不仅更容易利用共享的功能， 并且更容易修改相关的方法。
- 现在我们先把功能分组到各自的文件中：`handlers/main.js` 中放首页处理器、`/about` 处理器，以及所有不属于任何其他逻辑分组的处理器， `handlers/vacations.js` 中放跟度假相关的处理器， 以此类推

- `handlers/main.js`：
```javascript
var fortune = require('../lib/fortune.js');

exports.home = function(req, res){
	res.render('home');
};

exports.about = function(req, res){
	res.render('about', {
		fortune: fortune.getFortune(),
		pageTestScript: '/qa/tests-about.js'
	} );
};

exports.newsletter = function(req, res){
	res.render('newsletter');
};
//。。。
```
接下来修改 routes.js 以使用它：
```javascript
var main = require('./handlers/main.js');
module.exports = function(app){
  app.get('/', main.home);
  app.get('/about', main.about);
  //...
};
```
- 这满足了所有的指导原则。`/routes.js`非常直白。一眼就能看出来网站里有哪些路由，以及它们是在哪里处理的。

##### 14.9 自动化渲染视图
- 如果你希望回到以前， 只要把 HTML 文件放到一个目录中， 然后很快你的网站就能提供它的旧时光，想添加文件` views/foo.handlebars`,可以通过路由 /foo 访问了。看看怎么做。在我们的应用程序文件中，就在 404 处理器之前，添加下面的中间件：
```javascript
// add support for auto views
var autoViews = {};

app.use(function(req,res,next){
    var path = req.path.toLowerCase();
    // check cache; if it's there, render the view
    // 检查缓存； 如果它在那里， 渲染这个视图
    if(autoViews[path]) return res.render(autoViews[path]);
    // if it's not in the cache, see if there's
    // a .handlebars file that matches
    // 如果它不在缓存里， 那就看看有没有 .handlebars 文件能匹配
    if(fs.existsSync(__dirname + '/views' + path + '.handlebars')){
        autoViews[path] = path.replace(/^\//, '');
        return res.render(autoViews[path]);
    }
    // no view found; pass on to 404 handler
    // 没发现视图； 转到 404 处理器
    next();
});
```
> 现在我们只要添加个 .handlebars 文件到 view 目录下， 它就神奇地渲染在相应的路径上了。
注意，常规路由会避开这一机制（因为我们把自动视图处理器放在了其他所有路由后面），所以如果你有个路由为 /foo 渲染了不同的视图， 那它会取得优先权。

##### 14.10 其他路由组织方式
最流行的两种路由组织方式： **命名空间路由（namespaced routing）** 和 **随机应变路由（resourceful routing）**
> - 当很多路由都以相同的前缀开始时， **命名空间路由** 很不错（比如 /vacations）。 有个 Node 模块叫 express-namespace， 它让这种方式变得很容易。
> - **随机应变路由** 基于一个对象中的方法自动添加路由。 如果网站的逻辑是天然面向对象的， 这项技术就很好用。 express-resource 包是如何实现这种路由组织风格的范例。
