### 第十六章： 静态内容
静态内容是指应用程序不会基于每个请求而去改变的资源，下面这些一般都是应该是静态资源：
- `多媒体`： 图片、视频和音频文件。当然，图片很有可能是即时生成的（尽管不太常见，但视频和音频也有可能如此），但大多数多媒体资源都是静态的。
- `CSS`:  普通 CSS 是静态资源。
- `JavaScript`： 客户端JavaScript是静态资源。
- `二进制下载文件`: 这包含所有种类： PDF、 压缩文件、 安装文件等类似的东西

##### 16.1 性能方面的考虑
- 如何处理静态资源对网站的性能有很大影响， 特别是网站有很多多媒体内容时。
- 在性能上主要考虑两点： **减少请求次数** 和 **缩减内容的大小**；
- 其中减少（HTTP） 请求的次数更关键， 特别是对移动端来说（通过蜂窝网络发起一次
HTTP 请求的开销要高很多）。
>> 两种方法可以减少请求的次数：
>> - **合并资源**: 主要是架构和前端问题： 要尽可能多地将小图片合并到一个子画面中。 [SpritePad](http://wearekiss.com/spritepad) 的免费服务创建子画面。
>> - **浏览器缓存**: 会在客户端浏览器中存储通用的静态资源， 这对减少 HTTP 请求有帮助。

- 可以通过压缩静态资源的大小来提升性能：
> - 有些技术是无损的（不丢失任何数据就可以实现资源大小的缩减）: JavaScript 和 CSS 的缩小化， 以及 PNG 图片的优化。
> - 有些技术是有损的（通过降低静态资源的品质实现资源大小的缩减）: 增加 JPEG 和视频的压缩等级。

说明： 在使用CDN时一般不用担心CORS。在 HTML中加载外部资源**不违反CORS**原则：只有用AJAX加载的资源才必须启用CORS。


##### 16.2 面向未来的网站
让网站“面向未来” 十分容易： 把静态内容挪到 CDN 上（归根结底是给静态资源创建一个抽象层， 让重新定位它更容易）。
-  **CDN** 是专为提供静态资源而优化的服务器，它利用特殊的头信息（我们马上就会讲到）启用浏览器缓存。另外 CDN 还能基于地理位置进行优化，也就是说它们可以从地理位置上更接近客户端的服务器发布静态内容。

**16.2.1 静态映射**
`让静态资源可重定位、对缓存友善`的策略核心是映射的概念：在编写HTML时，我们真
的没必要担心静态资源将会放在哪里这种具体细节。我们要关心的是静态资源的逻辑组
织。
- 我们会用“协议相对 URL”指向静态资源。即 URL 仅以“//”开头，不用“http://” 或“https://”。这样浏览器用什么协议都可以。如果用户访问的是安全页面，它会用HTTPS，否则用HTTP。
- 简单的映射模式： 只添加**基准URL**。
- 假定所有静态资产都是以斜杠开头的。因为映射器要用于几种不同的文件（视图、CSS和 JavaScript），所以要让它模块化。接下来创建文件lib/static.js：
```JavaScript
var baseUrl = '';
exports.map = function(name){
	return baseUrl + name;
};
```

**16.2.2 视图中的静态资源**
- 创建一个Handlebars辅助函数，让它给出一个到静态资源的链接:
```JavaScript
// set up handlebars view engine
var handlebars = require('express-handlebars').create({
    defaultLayout:'main',
    helpers: {
        static: function(name) {
            return require('./lib/static.js').map(name);
        }
    }
});
```
- 添加了一个 Handlebars 辅助函数 static， 让它调用静态资源映射器。
- 接下来修改main.layout，给商标图片用上这个新的辅助函数：
```html
<header>
  <img src="{{static '/img/logo.jpg'}}" alt="Meadowlark Travel Logo">
</header>
```

**16.2.3 CSS中的静态资源**
- 像 LESS、 Sass 和 Stylus 这样的 CSS预处理器全都支持变量，可以通过变量进行映射处理。
- 以less为例： 编译LESS生成CSS的办法。我们会用 Grunt 任务做这件事
`npm install --save-dev grunt-contrib-less`
- 然后修改 Gruntfile.js。 将 grunt-contrib-less 添加到 Grunt 任务列表中加载, 将下面的代码添加到 grunt.initConfig 中：
```JavaScript
less: {
  development: {
    files: {
        'public/css/main.css': 'less/main.less',
    }
  }
}
```
- 框架已经搭好了， 接下来我们要让 CSS 文件中用的 URL 也是可重定位的。 首先我们
会将**静态映射器**作为LESS的定制函数。这都可以在 Gruntfile.js 中完成:
 ```JavaScript
 less: {
   development: {
     options: {
       customFunctions: {
         static: function(lessObject, name) {
           return 'url("' +
             require('./lib/static.js').map(name.value) +
             '")';
         }
       }
     },
     files: {
       'public/css/main.css': 'less/main.less',
       'public/css/cart.css': 'less/cart.less',
     }
   }
 }
 ```
 - 注意， 我们给映射器的输出添加了标准的 CSS url 指定器和双引号， 这可以确保我们的
CSS 是有效的。 现在只需修改 LESS 文件 less/main.less：
```css
body {
  background-image: static("/img/background.png");
}
```
- 注意,真正的改变只是url变成了static。就是这么容易。

##### 16.3 服务器端JavaScript中的静态资源
- 在服务器端 JavaScript 中使用静态映射器真的很容易， 因为我们已经写了一个模块来做映
射。
- 我们想给应用程序添加一个复活节彩蛋。在草地鹨旅行社，我们都是Bud Clark（前任波特兰市长）的狂热粉丝。所以我们想在Clark生日那天把商标换成他的照片。修改 meadowlark.js：
```JavaScript
// middleware to handle logo image easter eggs
var static = require('./lib/static.js').map;
app.use(function(req, res, next){
	var now = new Date();
	res.locals.logoImage = now.getMonth()==11 && now.getDate()==19 ?
	static('/img/logo_bud_clark.png') :
	static('/img/logo.png');
	next();
});
```
在 views/layouts/main.handlebars中:
```html
<header><img src="{{logoImage}}" alt="Meadowlark Travel Logo"></header>
```
##### 16.4  客户端端JavaScript中的静态资源
- eg: 你用 jQuery 动态修改购物车的图片： 当它是空的时， 视觉效果上是一个空的购物
车。 当用户往里面添了东西后， 购物车里会出现一个盒子。这两张图片是 /img/shop/cart_empty.png 和 /img/shop/cart_full.png。 没有映射， 我们大概会这样做：
```JavaScript
$(document).on('meadowlark_cart_changed'){
	$('header img.cartIcon').attr('src', cart.isEmpty() ?
	'/img/shop/cart_empty.png' : '/img/shop/cart_full.png' );
}
```
- 在我们将图片挪到 CDN 上后， 这就不行了, 解决方案是在服务器端映射， 然后设定定制的 JavaScript 变量。 在 views/layouts/main.handlebars 中这样做：
```html
<script>
var IMG_CART_EMPTY = '{{static '/img/shop/cart_empty.png'}}';
var IMG_CART_FULL = '{{static '/img/shop/cart_full.png'}}';
</script>
```
- 只要在 jQuery 中使用那些变量：
```html
<script>
	$(document).on('meadowlark_cart_changed', function(){
		$('header img.cartIcon').attr('src', cart.isEmpty() ? IMG_CART_EMPTY : IMG_CART_FULL );
	});
</script>
```
- 如果你要在客户端做很多的图片切换， 可能要把所有图片变量放在一个对象中（它本身就
成了一个映射）。 比如可以这样重写前面的代码：
```JavaScript
var static = {
IMG_CART_EMPTY: '{{static '/img/shop/cart_empty.png'}}',
IMG_CART_FULL: '{{static '/img/shop/cart_full.png'}}';
}
```

##### 16.5 提供静态资源
浏览器用来确定如何（以及是否） 缓存的响应头:
- `Expires/Cache-Control`

- `Last-Modified/ETag`

##### 16.6 修改静态资源


##### 16.7 打包和缩小


##### 16.8 关于第三方库


##### 16.9 QA
