### 第七章 handlebars 模板引擎
#### 7.1  简介
 - 用JavaScript生成HTML

```javascript
 document.write('<h1>Please Don\'t Do This</h1>');
 document.write('<p><span class="code">document.write</span> is naughty,\n');
 document.write('and should be avoided at all costs.</p>');
 document.write('<p>Today\'s date is ' + new Date() + '.</p>');
```

> - 问题:切换上下文环境是困难的。

- 如果你写了大量的JavaSctipt，混合在HTML中会引起麻烦和混乱; 由JavaScript生成的HTML充满了问题：
> - 必须不断地考虑哪些字符需要转义以及如何转义。
> - 使用JavaScript来生成那些自身包含JavaScript代码的HTML会很快让你抓狂。
> - 通常会失去编辑器的语法高亮显示和其他方便的语言特性。
> - 很难发现格式不正确的HTML。
> - 很难直观地分析。
> - 很难让别人读懂你的代码。

- 模板解决了在目标语言中编写代码的问题，同时也让插入动态数据成为了可能; 只有在某些最简单的情况下才会使用JavaScript生成HTML。

#### 7.2 模板引擎的选择
1. **性能**: 希望模板引擎尽可能地快
2. **客户端、服务端或兼而有之**: 如果需要在这两端都使用模板，推荐选择那些在两端都表现优秀的模板引擎。
3. **抽象**: 让代码更可读（例如，在普通HTML文本中使用大括号）

[Template-Engine-Chooser!](http://garann.github.io/template-chooser/)

#### 7.3 Handlebars基础
- 理解模板引擎的关键在于**context（上下文环境）**: 当渲染一个模板时，便会*传递给模板引擎一个对象，叫作上下文对象，它能让替换标识运行*。
- Handlebars中 {{{}}} 三个大括号能解析 html 标签;

![](http://images.cnitblog.com/blog/676883/201502/091316427927808.png)
- **注释**: 区分Handlebars注释和HTML注释很重要:

```HTML
{{! super-secret comment }}
<!-- not-so-secret comment -->
```
> - 假设这是一个服务器端模板，上面的super-secret comment将不会被传递到浏览器，然而如果用户查看HTML源文件，下面的not-so-secret comment就会被看到。

- 块级表达式
> - 上下文对象

```javascript
{
  currency: {
         name: 'United States dollars',
         abbrev: 'USD',
  },
  tours: [
          { name: 'Hood River', price: '$99.95' },
          { name: 'Oregon Coast', price: '$159.95' },
  ],
  specialsUrl: '/january-specials',
  currencies: [ 'USD', 'GBP', 'BTC' ],
}
```

传递到如下模板：
```html
<ul>
       {{#each tours}}
              {{! 注释: I'm in a new block...and the context has changed }}
              <li>
                         {{name}} - {{price}}
                         {{#if ../currencies}} {{! ../用于切换上下文环境}}
                                ({{../../currency.abbrev}})
                         {{/if}}
              </li>
       {{/each}}
</ul>
{{#unless currencies}}
       <p>All prices in {{currency.name}}.</p>
{{/unless}}
{{#if specialsUrl}}
       {{! I'm in a new block...but the context hasn't changed (sortof) }}
       <p>Check out our <a href="{{specialsUrl}}">specials!</p>
{{else}}
       <p>Please check back often for specials.</p>
{{/if}}
<p>
       {{#each currencies}}
             <a href="#" class="currency">{{.}}</a>
       {{else}}
             Unfortunately, we currently only accept {{currency.name}}.
       {{/each}}
</p>
```
> - **each辅助方法**: 这使我们能够遍历一个数组; 在下级块中，如果想访问currency对象，就得使用../来访问上一级上下文。
> - **if辅助方法**: 在Handlebars中，所有的块都会改变上下文，所以在if块中，会产生一个新的上下文......而这刚好是上一级上下文的副本。
换句话说，在if或else块中，上下文与上一级上下文是相同的。但是当在一个each循环中使用if块时就有必要细究一下了。在{{#each tours}}循环体中，
可以使用../.访问上级上下文。不过，在{{#if ../currencies}}块中，又进入了一个新的上下文......所以要获得currency对象，
就得使用../../.。第一个../获得产品的上下文，第二个获得最外层的上下文。这就会产生很多混乱，最简单的权宜之计就是在each块中避免使用if块。
> - unless辅助方法，它基本上和if辅助方法是相反的：只有在参数为false时，它才会执行。
> - 最后要注意的一点是在{{#each currencies}}块中使用{{.}}。{{.}}指向当前上下文，在这个例子中，当前上下文只是我们想打印出来的数组中的一个字符串。
> - 访问当前上下文还有另外一种独特的用法：它可以从当前上下文的属性中区分出辅助方法。
> 例如，如果有一个**辅助方法**叫作foo，在当前上下文中有一个**属性**也叫作foo，则**{{foo}}指向辅助方法，{{./foo}}指向属性**。

##### 7.4 服务器端模板
- 服务器端模板与客户端模板不同，客户端模板能够通过查看HTML源文看到，而不会看到服务器端模板，或是用于最终生成HTML的上下文对象。
- 服务器端模板除了隐藏实现细节，还支持模板缓存，这对性能很重要。模板引擎会缓存已编译的模板（只有在模板发生改变的时候才会重新编译和重新缓存），
这会改进模板视图的性能。
- 默认情况下，视图缓存会在开发模式下禁用，在生产模式下启用。如果想显式地启用视图缓存，可以这样做：`app.set('view cache', true)`;
- Express支持Jade、EJS和JSHTML。所以需要添加一个node包，让Express提供Handlebars支持。
```shell
npm install --save express3-handlebars
```

- 然后就可以在Express中引入：
```javascript
var handlebars = require('express3-handlebars').create({ defaultLayout: 'main' });
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
```
- express3-handlebars让Handlebars模板拥有了.handlebars扩展名。可以在创建express3-handlebats实例将扩展名改成同样常见的.hbs;默认模版还是main.hbs
```javascript
var exphbs = require('express3-handlebars');
app.engine('hbs', exphbs({extname: '.hbs'}));
app.set('view engine', 'hbs');
```

##### 7.5 视图和布局
**视图**: 表现为网站上的各个页面（它也可以表现为页面中AJAX局部加载的内容，或一封电子邮件，或页面上的任何东西）;
> 默认情况下，Express会在views子目录中查找视图。
**布局**: 是一种特殊的视图，事实上，它是一个用于模板的模板。
> 布局是必不可少的，因为站点的大部分页面都有几乎相同的布局。

- 基本布局文件:
```html
<!doctype>
<html>
<head>
        <title>Meadowlark Travel</title>
        <link rel="stylesheet" href="/css/main.css">
</head>
<body>
        {{{body}}}
</body>
</html>
```
> 请注意标记内的文本：{{{body}}}。这样视图引擎就知道在哪里渲染的内容了。
- 一定要用三重大括号而不是两个，因为**视图很可能包含HTML，我们并不想让Handlebars试图**去转义它。
- 。注意，在哪里放置{{{body}}}并没有限制。此外，常见的网页元素，如页眉和页脚，通常也在布局中，而不在视图中。举例如下：
```html
<!-- ... -->
<body>
  <div class="container">
    <header><h1>Meadowlark Travel</h1></header>
      {{{body}}}
    <footer>&copy;{{copyrightYear}} Meadowlark Travel</footer>
  </div>
</body>
```

![](http://images.cnitblog.com/blog/676883/201502/091446460269789.png)
- 由于执行的顺序，你可以向视图中传递一个叫作body的属性，而且它会在视图中正确渲染。然而，当布局被渲染时，body的值会被已渲染的视图覆盖。

##### 7.6 在Express中使用（或不使用）布局
- 当我们创建视图引擎时，会指定一个默认的布局：
```javascript
var handlebars = require('express3-handlebars').create({ defaultLayout: 'main' });
```
- 默认情况下，Express会**在views子目录中查找视图**，**在views/layouts下查找布局**。
> 所以如果有一个叫作views/foo.handlebars的视图，可以这样渲染它：
```javascript
app.get('/foo', function(req, res){
  res.render('foo');
});
```
> 它会使用views/layouts/main.handlebars作为布局。

- 如果你根本不想使用布局（这意味着在视图中你不得不拥有所有的样板文件），可以在上下文中指定layout: null：
```javascript
app.get('/foo', function(req, res){
    res.render('foo', { layout: null });
});
```
- 如果你想使用一个不同的模板，可以指定模板名称：
```javascript
app.get('/foo', function(req, res){
   res.render('foo', { layout: 'microsite' });
});
```
- 这样就会使用布局views/layouts/microsite.handlebars来渲染视图了。

##### 7.7 局部文件
> 很多时候，有些组成部分（在前端界通常称为“组件”）需要在不同的页面重复使用。使用模板来实现这一目标的唯一方法是使用局部文件（partial，
> 如此命名是因为它们并不渲染整个视图或整个网页）。
- 首先，创建一个局部文件，views/partials/weather.handlebars：
```javascript
<div class="weatherWidget">
       {{#each partials.weather.locations}}
               <div class="location">
                      <h3>{{name}}</h3>
                      <a href="{{forecastUrl}}">
                               <img src="{{iconUrl}}" alt="{{weather}}">
                               {{weather}}, {{temp}}
                      </a>
               </div>
        {{/each}}
        <small>Source: <a href="http://www.wunderground.com">Weather Underground</a></small>
</div>
```
> 请注意，我们使用partials.weather为开头来命名上下文。我们想在任何页面上使用局部文件，
> 但上述做法实际上并不会将上下文传递给每一个视图，因此可以**使用res.locals（对于任何视图可用）。
> 但是我们并不想让个别的视图干扰指定的上下文，于是将所有的局部文件上下文都放在partials对象中**。

- 创建一个方法来获取当前天气数据：
```javascript
function getWeatherData(){
    return {
       locations: [
          {
                name: 'Portland',
                forecastUrl: 'http://www.wunderground.com/US/OR/Portland.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/cloudy.gif',
                weather: 'Overcast',
                temp: '54.1 F (12.3 C)',
           },
           {
                name: 'Bend',
                forecastUrl: 'http://www.wunderground.com/US/OR/Bend.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/partlycloudy.gif',
                weather: 'Partly Cloudy',
                temp: '55.0 F (12.8 C)',
           },
           {
                name: 'Manzanita',
                forecastUrl: 'http://www.wunderground.com/US/OR/Manzanita.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/rain.gif',
                weather: 'Light Rain',
                temp: '55.0 F (12.8 C)',
           },
      ],
   };
}
```
- 创建一个中间件给res.locals.partials对象添加这些数据:

```javascript
app.use(function(req, res, next){
    if(!res.locals.partials) res.locals.partials = {};
    res.locals.partials.weather = getWeatherData();
    next();
});
```
- 在视图中使用这个局部文件。例如，为将我们的组件放在主页上，编辑views/home.handlebars：

```html
<h2>Welcome to Meadowlark Travel!</h2>
{{> weather}}
```
**说明:**
> 语法{{> partial_name}}可以让视图中包含一个局部文件。
> - `express3-handlebars`会在`views/partials`中寻找一个叫作partial_name.handle‐bars的视图（或是weather.handlebars)
> - express3-handlebars支持子目录，所以如果你有大量的局部文件，可以将它们组织在一起。例如，你有一些社交媒体局部文件，可以将它们放在
views/partials/social目录下面，然后使用{{> social/facebook}}、{{>social/twitter}}等来引入它们。



##### 7.8 段落
- 我从微软的优秀模板引擎Razor中借鉴了段落（section）的概念。
- 如果所有的视图在你的布局中都正好放在一个单独的元素里，布局会正常运转，但是当你的视图本身需要添加到布局的不同部分时会发生什么？
> 一个常见的例子是，视图需要向<head>元素中添加一些东西，或是插入一段使用jQuery的`<script>`脚本（这意味着必须引入jQuery，
由于性能原因，有时在布局中这是最后才做的事);

- `Handlebars`和`express3-handlebars`都没有针对于此的内置方法。幸运的是，Handlebars的辅助方法让整件事情变得简单起来。
当我们实例化`Handlebars`对象时，会添加一个叫作`section`的辅助方法

```JavaScript
var handlebars = require('express3-handlebars').create({
    defaultLayout:'main',
    helpers: { //添加辅助方法
       section: function(name, options){  //section 辅助方法
            if(!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
       }
    }
});
```

- 在视图中使用section辅助方法了。让我们创建一个视图（views/jquerytest. handlebars），
在<head>中添加一些东西，并添加一段使用jQuery的脚本：

```html
{{#section 'head'}}
         <!-- we want Google to ignore this page -->
         <meta name="robots" content="noindex">
{{/section}}

<h1>Test Page</h1>
<p>We're testing some jQuery stuff.</p>

{{#section 'jquery'}}
         <script>
                $('document').ready(function(){
                      $('h1').html('jQuery Works');
                 });
         </script>
{{/section}}
```

- 在布局文件中放置段落
```html
<!doctype html>
<html>
<head>
        <title>Meadowlark Travel</title>
        {{{_sections.head}}}
</head>
<body>
        {{{body}}}
        <script src="http://code.jquery.com/jquery-2.0.2.min.js"></script>
        {{{_sections.jquery}}}
</body>
</html>
```

#### 7.9 客户端handlebars

> AJAX调用可以返回HTML片段，并将其原样插入DOM中，但是客户端Handlebars允许我们使用JSON数据接收AJAX调用结果，并将其格式化以适应我们的网站。
因此，在与第三方API（返回JSON数据，而不是适应你网站的格式化HTML文本）通信时尤其有用。
- 在客户端使用Handlebars之前，我们需要加载Handlebars。我们既可以将Handlebars放在静态资源中引入，也可以使用一个CDN
```html
{{#section 'head'}}
        <script src="//cdnjs.cloudflare.com/ajax/libs/handlebars.js/1.3.0/
  handlebars.min.js"></script>
{{/section}}
```

- 现在需要找个地方放模板,一种方法是使用在HTML中已存在的元素，最好是一个隐藏的元素。你可以将它
放在`<head>`中的`<script>`元素里。这看起来有点奇怪，但是运行良好:

```javascript
{{#section 'head'}}
    <script src="//cdnjs.cloudflare.com/ajax/libs/handlebars.js/1.3.0/handlebars.min.js"></script>

    <script id="nurseryRhymeTemplate" type="text/x-handlebars-template">
       Marry had a little <b>\{{animal}}</b>, its <b>\{{bodyPart}}</b>
       was <b>\{{adjective}}</b> as <b>\{{noun}}</b>.
    </script>
{{/section}}
```
> 请注意，我们必须转义至少一个大括号，否则，服务器端视图会尝试对其进行替换。

- 在使用模板之前，我们需要编译它：
```javascript
{{#section 'jquery'}}
       $(document).ready(function(){
          var nurseryRhymeTemplate = Handlebars.compile(
              $('#nurseryRhymeTemplate').html()
          );
       });
{{/section}}
```
- 我们需要一个放置已渲染模板的地方。出于测试的目的，我们添加两个按钮，一个通过JavaScript来直接渲染，另一个通过AJAX调用来渲染：
```html
<div id="nurseryRhyme">Click a button....</div>
<hr>
<button id="btnNurseryRhyme">Generate nursery rhyme</button>
<button id="btnNurseryRhymeAjax">Generate nursery rhyme from AJAX</button>
```

- 最后是渲染模板的代码：
```javascript
{{#section 'jquery'}}
    <script>
            $(document).ready(function(){

                  var nurseryRhymeTemplate = Handlebars.compile(
                        $('#nurseryRhymeTemplate').html());

                  var $nurseryRhyme = $('#nurseryRhyme');

                  $('#btnNurseryRhyme').on('click', function(evt){
                        evt.preventDefault();
                        $nurseryRhyme.html(nurseryRhymeTemplate({
                                 animal: 'basilisk',
                                 bodyPart: 'tail',
                                 adjective: 'sharp',
                                 noun: 'a needle'
                        }));
                  });

                  $('#btnNurseryRhymeAjax').on('click', function(evt){
                        evt.preventDefault();
                        $.ajax('/data/nursery-rhyme', {
                                success: function(data){
                                     $nurseryRhyme.html(
                                             nurseryRhymeTemplate(data))
                                }
                        });
                  });
             });
     </script>
{{/section}}
```

- 针对nursery rhyme页和AJAX调用的路由处理程序：

```javascript
app.get('/nursery-rhyme', function(req, res){
           res.render('nursery-rhyme');
});
app.get('/data/nursery-rhyme', function(req, res){
        res.json({
                    animal: 'squirrel',
                    bodyPart: 'tail',
                    adjective: 'bushy',
                    noun: 'heck',
        });
});
```
**从本质上讲，Handlebars.compile接收一个模板，返回一个方法。这个方法接收一个上下文对象，返回一个已渲染字符串。
所以一旦我们编译了模板，就可以像调用方法函数一样重用模板渲染。**
