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
- 缓存极大提升了网站的性能， 但也不是没有代价的。 特别是如果你修改了静态资源， 客户
可能直到浏览器中缓存的版本过期后才能见到。
- 解决方案是**指纹法**：只是在资源名上加上某种版本信息。你更新资产后，资源名称会变，浏览器就知道它需要下载这个资源了。
- 除了单个文件的指纹，另外一个流行的方案是**资源打包**。打包即把所有 CSS 捣烂到一个人类几乎不可能看懂的文件中，客户端 JavaScript也是如此。既然总会创建新文件，一般做那些文件的指纹更容易也更常见。
##### 16.7 打包和缩小
- 打包： 将多个文件变成一个文件的过程；
- 缩小： 在打包的过程中将源码中不必要的东西都去掉，eg：空格/将变量名变短等；
> - 打包和缩小还有一个额外的好处， 即减少了需要做指纹处理的资产数量。

- 安装必要模块：
```
npm install --save-dev grunt-contrib-uglify   //用于javascript
npm install --save-dev grunt-contrib-cssmin   //用于css
npm install --save-dev grunt-hashres          //用于做文件指纹
```
- 然后在 Gruntfile 中加载这些任务：
```javascript
[
	// ...
	'grunt-contrib-less',
	'grunt-contrib-uglify',
	'grunt-contrib-cssmin',
	'grunt-hashres',
].forEach(function(task){
	grunt.loadNpmTasks(task);
});
```
- 并设置这些任务：
```javascript
// configure plugins
grunt.initConfig({
	uglify: {
		all: {
			files: {
				'public/js.min/meadowlark.min.js': ['public/js/**/*.js']
			}
		}
	},
	cssmin: {
		combine: {
			files: {
				'public/css/meadowlark.css': ['public/css/**/*.css',
				'!public/css/meadowlark*.css']
			}
		},
		minify: {
			src: 'public/css/meadowlark.css',
			dest: 'public/css/meadowlark.min.css',
		},
	},
	hashres: {
		options: {
			fileNameFormat: '${name}.${hash}.${ext}'
		},
		all: {
			src: [
				'public/js.min/meadowlark.min.js',
				'public/css/meadowlark.min.css',
			],
			dest: [
				'views/layouts/main.handlebars',
			]
		},
	}
 }
});
```
- 数组中的第二个元素： 字符串前面那个感叹号说不要包含那些文件……这样可以防止它循环包含它自己生成的文件！

> 这些任务有依赖关系：
```
grunt less
grunt cssmin
grunt uglify
grunt hashres
```

- 设置grunt 任务命令脚本
```JavaScript
grunt.registerTask('default', ['cafemocha', 'jshint', 'exec']);
grunt.registerTask('static', ['less', 'cssmin', 'uglify', 'hashres']);
```
- 输入 grunt static， 一切事情就都被做好了。

###### 16.7.2 在开发模式中跳过打包和缩小
- 打包和缩小文件不利于前端调试；
- 为了在开发模式中禁用打包和缩小，可以引用connect-bundle模块；

- 在用这个模块之前，我们先创建一个配置文件。我们现在定义打包， 但稍后还要用这个配置文件指定数据库配置。 一般配置文件会用 JSON 格式
- 可以用 require 读取和解析 JSON 文件， 就好像它是个模块一样：
```JavaScript
var config = require('./config.json');
```
然而因为我厌烦了输入引号， 所以一般更愿意把配置放在 JavaScript 文件中（几乎跟 JSON文件一样， 只是少了几个引号）。 接下来创建 config.js：

```JavaScript
module.exports = {
	bundles: {
		clientJavaScript: {
			main: {
				file: '/js.min/meadowlark.min.62a6f623.js',
				location: 'head',
				contents: [
					'/js/contact.js',
					'/js/cart.js',
				]
			}
		},
		clientCss: {
			main: {
				file: '/css/meadowlark.min.2a8883cf.css',
				contents: [
					'/css/main.css',
					'/css/cart.css',
				]
			}
		},
	},
}

```
- 定义了JavaScript和CSS的打包。打包可以有多个（比如一个用于桌面端， 一个用于移动端），但我们的例子只有一个，称为 main。
- 注意，在 JavaScript 打包中，我们可以指定位置。出于性能和依赖方面的原因，你可能会把JavaScript放在不同的位置。

接下来修改 views/layouts/main.handlebars：
```JavaScript
{{#each _bundles.css}}
	<link rel="stylesheet" href="{{static .}}">
{{/each}}

{{#each _bundles.js.head}}
	<script src="{{static .}}"></script>
{{/each}}
```

- 现在如果我们想用指纹化的打包名， 必须修改 config.js，而不是 views/layhandlebars。 还要相应地修改 Gruntfile.js：

```JavaScript
hashres: {
	options: {
		fileNameFormat: '${name}.${hash}.${ext}'
	},
	all: {
		src: [
			'public/js/meadowlark.min.js',
			'public/css/meadowlark.min.css',
		],
		dest: [
			'config.js',
		]
	},
}
```
- 现在运行grunt static，你会看到config.js中的打包名的指纹已经被更新了。
##### 16.8 关于第三方库
- 如果用到非常多（超过五个）的第三方库，可以将其一起包，像jquery这种常用的第三方库很可能已经在浏览器第三方已经缓存起来了。

##### 16.9 QA
- 与其等着不可避免的 bug 出现， 或者希望代码审查能抓住问题，何不在我们的QA工具链中添加个组件解决问题呢？
- 我们将会用到一个 Grunt 插件 grunt-lint-pattern， 它只是在源码文件中搜索特定的模式， 发现后就生成一个错误。
```bashshell
npm install --save-dev grunt-lint-pattern
```
- 然后将 grunt-lint-patter 添加到 Gruntfile.js 要加载的模块列表中， 然后添加下面的配置：

```JavaScript
lint_pattern: {
	view_statics: {
		options: {
			rules: [
				{
					pattern: /<link [^>]*href=["'](?!\{\{|(https?:)?\/\/)/,
					message: 'Un-mapped static resource found in <link>.'
				},
				{
					pattern: /<script [^>]*src=["'](?!\{\{|(https?:)?\/\/)/,
					message: 'Un-mapped static resource found in <script>.'
				},
				{
					pattern: /<img [^>]*src=["'](?!\{\{|(https?:)?\/\/)/,
					message: 'Un-mapped static resource found in <img>.'
				},
			]
		},
	files: {
		src: [ 'views/**/*.handlebars' ]
	 }
},
css_statics: {
	options: {
		rules: [
			{
				pattern: /url\(/,
				message: 'Un-mapped static found in LESS property.'
			},
		]
	},
	files: {
		src: [
			'less/**/*.less'
		]
	}
}
```

并将 lint_pattern 添加到默认规则中：
```JavaScript
grunt.registerTask('default', ['cafemocha', 'jshint', 'exec', 'lint_pattern']);
```
- 现在运行 grunt 时（我们应该定期这样做）， 会抓到所有未映射的静态实例
