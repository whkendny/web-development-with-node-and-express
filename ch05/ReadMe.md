### 第五章 质量保证（测试）
##### 一.Web开发中，质量的四个维度
a.**到达率**： 指产品的市场普及程度（及登录网站或使用服务的人数），从开发的角度看，搜索引擎优化(SEO)对到达率的影响最大。    
b.**功能**： 网站的功能质量是把用户留下决定因素，功能测试一般可以自动执行。（功能关注的是： 功能的正确性）     
c.**可用性**：可用性评估的是人机交互（HCI），可用性评估跟用户挂钩，所以一般无法自动完成。 （评估可用性，必须考虑目标受众）      
d.**审美**： 是四个维度中最主观的，与开发最不相关的一个维度。审美具有时间敏感性（审美标准会随时间而发生变化，且因人而异）；

##### 二. 网站的两个领域
a.**逻辑**： 逻辑域中的事情尽可能简单清晰；
b.**展示**： 表示域的复杂还是简单则视需求而定。

##### 三. 测试的类型
a.**单元测试**： 粒度非常细，是对单个组件进行测试以确保其功能正确；一般来说单元测试在测试逻辑时更实用，也更恰当。
b.**集成测试**： 对多个组件甚至整个系统之间的交互测试；集成测试则在两个领域中都有用；

##### 四. QA技术概览
**1. 页面测试**（Mocha进行测试）涉及单元测试及集成测试
- Mocha 要在浏览器中运行，所以要把Mocha资源放在public目录下， 以便让客户端访问到，将这些资源放在public/vendor中；
- 测试通常需要一个assert(或 expect)函数。Node框架中有这个函数，但浏览器中没有，所以需要Chai断言库；
```
 npm install --save-dev chai
 cp node_modules/chai/chai.js public/vendor
```
- 通过一些中间件来检测URL中的查询字符的test=1, 以确定其是用于测试的，从而与实际的页面分开；
```JavaScript
app.use(function(req, res, next) {
  res.locals.showTests = app.get('env') !== 'production' &&
    req.query.test === '1';
  next();
});
```
- 在模板“main”中引入测试框架，修改head部分如下：
```html
<head>
    <title>Meadowlark Travel</title>
    <!-- 引入测试模块的代码  -->
	{{#if showTests}}
		<link rel="stylesheet" href="/vendor/mocha.css">
	{{/if}}
</head>
```
- 然后再紧挨着的结束标签</body>之前（这是用于全局页面测试部分）：
```html
{{#if showTests}}
  <div id="mocha"></div>
  <script src="/vendor/mocha.js"></script>
  <script src="/vendor/chai.js"></script>
  <script>
    mocha.ui('tdd');
    var assert = chai.assert;
  </script>
  <script src="/qa/tests-global.js"></script>
  {{#if pageTestScript}}
    <script src="{{pageTestScript}}"></script>
  {{/if}}
  <script>mocha.run();</script>
{{/if}}
</body>
```
- 在public/qa中创建测试脚本`global-test.js`
```JavaScript
suite('Global Tests', function(){
	test('page has a valid title', function(){
		assert(document.title && document.title.match(/\S/) &&
			document.title.toUpperCase() !== 'TODO');
	});
});
```
- mocha支持多种“界面”来控制测试的风格。
> - 默认界面是**行为驱动开发（**BDD**），它让你以行为的方式思考。,在BDD中，你描述组件和它们的行为，然后用测试去验证这些行为。()

- 添加针对页面的测试     
eg: 创建一个 public/qa/tests-about.js 文件    

```JavaScript
suite('"About" Page Tests', function(){
  test('page should contain link to contact page', function(){
    assert($('a[href="/contact"]').length);
  });
});
```

**2. 跨页测试** （Zombie.js）主要是集成测试
详细见：P40, 5.7 跨页面测试      
`无头浏览器`： 不需要真的在屏幕上显示什么，但它必须表现得像个浏览器；    
目前有三个解决方案：1. Selenium;  2.PhantomJS; 3. Zombie

**3. 逻辑测试**
> 逻辑测试会对逻辑域进行单元和集成测试。只会测试JavaScript，跟所表示的功能分开；

- 添加单元测试      
> 创建 文件  qa/tests-unit.js

```JavaScript
var fortune = require('../lib/fortune.js');
var expect = require('chai').expect;

suite('Fortune cookie tests', function(){

    test('getFortune() should return a fortune', function(){
        expect(typeof fortune.getFortune() === 'string');
    });

});
```
运行mocha（需要全局安装mocha:`npm install --global mocha`）:          
```
mocha -u tdd -R spec qa/tests-unit.js
```
[mocha测试](http://blog.csdn.net/chenjh213/article/details/49025673)

**4. 去毛** （JSHint）
> 去毛不是找错误，而是要找潜在的错误;

- 常见的去毛机：
> - JSLint
> - JSHint (推荐，可定制)

1. 获取JSHint `npm install -g jshint`       
2. 运行并检查对应的脚本 `jshint meadowlark.js`    

**5.连接检查** （linkchecker） 属于单元测试
- 检查死链接对搜索引擎对网站的评级有重要的影响
- 使用linkchecker可以对网站进行连接检查(网站首页URL)    
`linkchecker http://localhost:3000`

五. 使用Grunt实现自动化【Glup】
- 安装Grunt命令行以及Grunt本身：        
`npm install -g grunt-cli`
`npm install --save-dev grunt`
- 在项目目录下创建一个Gruntfile.js文件
```
module.exports = function(grunt){

	// load plugins
	[
		'grunt-cafe-mocha',
		'grunt-contrib-jshint',
		'grunt-exec',
	].forEach(function(task){
		grunt.loadNpmTasks(task);
	});

	// configure plugins
	grunt.initConfig({
		cafemocha: {
			all: { src: 'qa/tests-*.js', options: { ui: 'tdd' }, }
		},
		jshint: {
			app: ['meadowlark.js', 'public/js/**/*.js', 'lib/**/*.js'],
			qa: ['Gruntfile.js', 'public/qa/**/*.js', 'qa/**/*.js'],
		},
		exec: {
			linkchecker: { cmd: 'linkchecker http://localhost:3000' }
		},
	});

	// register tasks
	grunt.registerTask('default', ['cafemocha','jshint','exec']);
};

```

##### 六 持续集成（CI）
- node最流行的CI服务器是Travis CI
[前端持续集成化](https://segmentfault.com/a/1190000007221668)
[前端开源项目持续集成三剑客](http://efe.baidu.com/blog/front-end-continuous-integration-tools/)

##### 安装中遇到的错误：
```
E:\study\nodeAndExpress\ch05\node_modules\contextify>if not defined npm_config_node_gyp (node "D:\Program Files\nodejs\node_modules\npm\bin\node-gyp-bin\\..\..\node_modules\node-gyp\bin\node-gyp.js" rebuild )  else (node "" rebuild )
gyp ERR! configure error
gyp ERR! stack Error: Can't find Python executable "python", you can set the PYTHON env variable.
gyp ERR! stack     at failNoPython (D:\Program Files\nodejs\node_modules\npm\node_modules\node-gyp\lib\configure.js:449:14)
gyp ERR! stack     at D:\Program Files\nodejs\node_modules\npm\node_modules\node-gyp\lib\configure.js:404:11
gyp ERR! stack     at D:\Program Files\nodejs\node_modules\npm\node_modules\graceful-fs\polyfills.js:264:29
gyp ERR! stack     at FSReqWrap.oncomplete (fs.js:123:15)
gyp ERR! System Windows_NT 10.0.10240
gyp ERR! command "D:\\Program Files\\nodejs\\node.exe" "D:\\Program Files\\nodejs\\node_modules\\npm\\node_modules\\node-gyp\\bin\\node-gyp.js" "rebuild"
gyp ERR! cwd E:\study\nodeAndExpress\ch05\node_modules\contextify
gyp ERR! node -v v6.11.3
gyp ERR! node-gyp -v v3.4.0
gyp ERR! not ok
```
#### 解决方案：
[参考node -gyp](https://github.com/nodejs/node-gyp)
`npm install --global --production windows-build-tools`
