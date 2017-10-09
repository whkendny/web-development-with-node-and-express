### 第十五章. REST API 和 JSON
- **Web服务** 是一个通用术语， 指任何可以通过 HTTP 访问的应用程序编程界面（API）。
- **REST** 表示：“表述性状态传输”（Representational State Transfer），念起来有点麻烦的“REST风格” 作为一个形容词来形容满足 REST 原则的 Web 服务。
- REST 的正规描述很复杂， 需要计算机科学形式上的表述，但 REST基本上就是**客户端和服务器端的无状态连接**。  
- REST 的正式定义还指出服务可以被缓存，可以被分层（即当你使用一个 REST API
时，可能还有其他 REST API 在它下面）

##### 15.1 JSON 和 XML
- 尽管XML不是特别复杂， 但Douglas Crockford觉得还可以做得更轻量，因此 JavaScript对象标记（JSON）诞生了。 除了对JavaScript非常友善（但它绝不
是专有的，它是任何语言都可以解析的简单格式），它还有个优势, 即一般手写起来也比XML更容易.

##### 15.2 我们的API
在实现之前， 我们会先把 API 规划好。 我们想要下面这些功能:   
- `GET /api/attractions`: 获取景点。以lat、lng和radius为查询字符串参数， 返回一个景点列表。
- `GET /api/attraction/:id`: 根据 ID 返回一处景点。
- `POST /api/attraction`: 以lat、lng、name、description和email为请求体添加新的景点。新添加的景点会进入一个待审批队列。
- ` PUT /api/attraction/:id`: 更新一处已有的景点。参数为景点的ID、lat、lng、name、description和email。更新会进入待审批队列。
- `DEL /api/attraction/:id`: 删除景点。参数为景点 ID、email和reason。删除会进入待审批队列。
> - 为了避免出现超长的 URL，我建议用请求主体传递大块数据（比如景点的描述）
> - 将 POST用于创建而 PUT用于更新（或修改），这已经成为标准了。这些单词
的英文含义并不支持这种分别， 所以你可能要考虑用路径来区分这两种操作以避免混淆。

##### 15.3 API错误报告
- HTTP API 的错误报告一般是通过 HTTP 状态码实现的;
> - 响应码是 200（OK）: 客户端知道请求成功了;
> - 响应码是 500（服务器内部错误）: 则请求失败了。

- 错误的分类：
> - 灾难性错误;      
> 导致服务器的状态不稳定或不可知的错误。 这种错误一般是未处理异常导致的。 从灾难性错误中恢复的唯一办法是重启服务器。  
> - 可恢复的服务器错误;    
> 可恢复错误不需要服务器重启， 或其他任何壮烈的动作。 这种错误一般是服务器上未预料到的错误条件导致的（比如不可用的数据库连接）。 问题可能是暂时的或永久的。这种情况下应该返回响应码 500。
> - 客户端错误       
> 客户端错误是客户端犯了错误， 一般是参数漏掉了或参数无效。 这时不应该用响应码500， 毕竟服务器没有故障。一切都正常，只是客户端没有正确使用 API。此时你有两个选择：
>> - 可以用状态码 200， 并在响应体中描述错误
>> - 用恰当的HTTP 状态码描述错误。
>> 404（未找到）、400（错误的请求） 和 401（未授权）。 此外，响应体中应该有错误具体情况说明。

##### 15.4 跨域资源共享
- 如果你发布了一个 API， 应该很想让其他人能够访问这个 API。 这会导致跨站 HTTP 请求。
- 跨站 HTTP 请求一直是很多攻击的对象，因此受到了**同源策略**的限制，限制可以从哪里加载脚本。具体来说就是协议、域和端口必须匹配。这使得其他网站不可能使用你的 API，所以有了**跨域资源共享（CORS）** 。
- CORS 允许你针对个案解除这个限制，甚至允许你列出具体哪些域可以访问这个脚本。
-  CORS 是通过`Access-Control-Allow-Origin` 响应头实现的。 在Express程序中最容易的实现方式是用`cors`包（`npm install --save cors`）。 要在程序中启用 CORS： `app.use(require('cors')());`
- 基于同源API存在的原因（防止攻击），我建议只在必要时应用CORS。就我们的情况而言，想要输出整个API（但只有 API），所以要将CORS限制在以“/api” 开头的路径上：
```javascript
app.use('/api', require('cors')())
```

##### 15.5 我们的数据存储
- 再一次要用Mongoose给数据库中的景点模型创建模式。创建文件 `models/attraction.js`：

```javascript
var mongoose = require('mongoose');

var attractionSchema = mongoose.Schema({
    name: String,
    description: String,
    location: { lat: Number, lng: Number },
    history: {
        event: String,
        notes: String,
        email: String,
        date: Date,
    },
    updateId: String,  //指向原始记录的新记录, 用于确认更新后更新系统中的原始记录
    approved: Boolean,
});
var Attraction = mongoose.model('Attraction', attractionSchema);
module.exports = Attraction;
```
> - 因为更新需要审批， 所以不能让 API 直接更新原始记录。我们的办法是创建一个指向原始记录的新记录（在它的属性 updateId 中）。一旦这个记录得到批准，我们就可以用更新记录中的信息更新原始记录，并删除这条更新记录。

##### 15.6 我们的测试
- 如果用了 GET 之外的 HTTP 动词， 那 API 的测试可能是个麻烦， 因为浏览器只知道如何发起 GET 请求（以及从表单发起 POST 请求）。
- 这有解决办法， 比如优秀的“Postman - REST Client” Chrome 插件。
- 然而，不管你是否使用这样的工具，有自动化测试总是好的。在给API写测试之前，我们需要一种实际调用 REST API 的办法。为此要用到 Node 包 restler：
`npm install --save-dev restler`

- 在 qa/tests-api.js 中实现对 API 的测试：

```javascript
var assert = require('chai').assert;
var http = require('http');
var rest = require('restler');

suite('API tests', function(){
    var attraction = {
        lat: 45.516011,
        lng: -122.682062,
        name: 'Portland Art Museum',
        description: 'Founded in 1892, the Portland Art Museum\'s colleciton ' +
            'of native art is not to be missed.  If modern art is more to your ' +
            'liking, there are six stories of modern art for your enjoyment.',
        email: 'test@meadowlarktravel.com',
    };
    var base = 'http://api.meadowlark:3000';

    test('should be able to add an attraction', function(done){
      // 添加一个景点
        rest.post(base+'/attraction', {data:attraction})
			.on('success', function(data){
				assert.match(data.id, /\w/, 'id must be set');
				done();
			})
			.on('error', function() {
				assert(false, 'Did you remember to alias api.meadowlark to 127.0.0.1 in your /etc/hosts file?');
			});
    });

    test('should be able to retrieve an attraction', function(done){
        rest.post(base+'/attraction', {data:attraction}).on('success', function(data){
            rest.get(base+'/attraction/'+data.id)  //把 URL 传给它， 以及一个有data 属性的对象， 用来做请求体
				.on('success', function(data){
					assert(data.name===attraction.name);
					assert(data.description===attraction.description);
					done();
				})
				.on('error', function() {
					assert(false, 'Did you remember to alias api.meadowlark to 127.0.0.1 in your /etc/hosts file?');
				});
        });
    });
});
```
- 注意， 对获取景点的测试中， 我们先添加了一个景点。
>  但这样做有两个原因。 :
> - 第一个原因是实战性的：即便测试在文件中的出现顺序是那样的， 但因为 JavaScript 的异步性， 我们不能保证 API 的调用也按那个顺序执行。
> - 第二个原因是原则性的： 所有测试都应该完全独立， 不能相互依赖。

- 调用 rest.get 或 rest.put， 把 URL 传给它， 以及一个有data 属性的对象， 用来做请求体。
- 这个方法返回一个发起事件的 promise。
- 当你在应用程序中使用 restler 时， 可能也想监听其他事件， 比如 fail（服务器给出的响应状态码是 4xx） 或 error（连接或解析错误）。

##### 15.7 用Express提供API
- Express十分擅长提供 API。本章后面还会介绍如何用Node模块提供额外的功能， 但现在先从纯粹的 Express 实现开始：

```JavaScript
var Attraction = require('./models/attraction.js');

app.get('/api/attractions', function(req, res){
  Attraction.find({ approved: true }, function(err, attractions){
    if(err) return res.send(500, 'Error occurred: database error.');
    res.json(attractions.map(function(a){
      return {
        name: a.name,
        id: a._id,
        description: a.description,
        location: a.location,
      }
    }));
  });
});

app.post('/api/attraction', function(req, res){
    var a = new Attraction({
        name: req.body.name,
        description: req.body.description,
        location: { lat: req.body.lat, lng: req.body.lng },
        history: {
            event: 'created',
            email: req.body.email,
            date: new Date(),
        },
        approved: false,
});
a.save(function(err, a){
    if(err) return res.send(500, 'Error occurred: database error.');
      res.json({ id: a._id });
    });
});

app.get('/api/attraction/:id', function(req,res){
  Attraction.findById(req.params.id, function(err, a){
  if(err) return res.send(500, 'Error occurred: database error.');
    res.json({
      name: a.name,
      id: a._id,
      description: a.description,
      location: a.location,
    });
  });
});

```
- 注意，在返回景点时，我们不是直接返回从数据库中返回来的模型。那样会暴露内部实现细节。相反，我们选出所需信息构造了一个新的对象返回
- 如果现在运行测试（用 Grunt 或 mocha -u tdd -R spec qa/tests-api.js），应该能看到测试通过了(需要全局安装mocha).

```javascript
app.post('/api/attraction', function(req, res){
  var a = new Attraction({
    name: req.body.name,
    description: req.body.description,
    location: { lat: req.body.lat, lng: req.body.lng },
    history: {
      event: 'created',
      email: req.body.email,
      date: new Date(),
    },
    approved: false,
  });
  a.save(function(err, a){
    if(err) return res.send(500, 'Error occurred: database error.');
      res.json({ id: a._id });
  });
});

app.get('/api/attraction/:id', function(req,res){
  Attraction.findById(req.params.id, function(err, a){
    if(err) return res.send(500, 'Error occurred: database error.');
    res.json({
      name: a.name,
      id: a._id,
      description: a.description,
      location: a.location,
    });
  });
});
```
- 注意，在返回景点时，我们不是直接返回从数据库中返回来的模型。那样会暴露内部实现
细节。相反，我们**选出所需信息构造了一个新的对象返回**。
- 注意在运行测试的时候需要全局安装 mocha (`npm install --global mocha`)
##### 15.8 使用REST插件
- 只用 Express 写 API 很容易。 然而用 REST 插件有些优势。 接下来我们用健壮
的 connect-rest 让 API 可以面向未来。 先装上它：
`npm install --save connect-rest`;
- 然后在 meadowlark.js 中引入它：`var rest = require('connect-rest');`
- 建议把API路由放在网站路由后面：connect-rest模块会检查每一个请求，向请求对象中添加属性，还会做额外的日志记录。因此把它放在网站路由后面更好，但要在404 处理器之前。

```javascript
// 网站路由在这里
// 在这里用 rest.VERB 定义 API 路由……
// API 配置
var apiOptions = {
context: '/api',
domain: require('domain').create(),
};
// 将 API 连入管道
app.use(rest.rester(apiOptions));
// 404 处理器在这里
```
- connect-rest 已经提高了一点效率： 我们可以自动给所有 API 调用加上前缀“/api”。 这减少了手误的几率， 并且可以在需要时轻松修改根 URL。
现在看一下如何添加 API 方法:

```javascript
var Attraction = require('./models/attraction.js');

var rest = require('connect-rest');

rest.get('/attractions', function(req, content, cb){
    Attraction.find({ approved: true }, function(err, attractions){
        if(err) return cb({ error: 'Internal error.' });
        cb(null, attractions.map(function(a){
            return {
                name: a.name,
                description: a.description,
                location: a.location,
            };
        }));
    });
});

rest.post('/attraction', function(req, content, cb){
    var a = new Attraction({
        name: req.body.name,
        description: req.body.description,
        location: { lat: req.body.lat, lng: req.body.lng },
        history: {
            event: 'created',
            email: req.body.email,
            date: new Date(),
        },
        approved: false,
    });
    a.save(function(err, a){
        if(err) return cb({ error: 'Unable to add attraction.' });
        cb(null, { id: a._id });
    });
});

rest.get('/attraction/:id', function(req, content, cb){
    Attraction.findById(req.params.id, function(err, a){
        if(err) return cb({ error: 'Unable to retrieve attraction.' });
        cb(null, {
            name: a.name,
            description: a.description,
            location: a.location,
        });
    });
});
```
- REST 函数不是只有常见的请求 / 响应两个参数， 而是有三个：
> - 一个请求（跟平常一样） ；
> - 一个内容对象， 是请求被解析的主体；
> - 一个回调函数， 可以用于异步 API 的调用。
>> 因为我们用了数据库，这是异步的，所以必须用回调将响应发给客户端（也有同步 API，你可以在 connect-rest 文档中看到： https://github.com/imrefazekas/connect-rest）。

- 注意，我们在创建 API 时还指定了一个域（见第 12 章）。这样我们可以孤立 API错误并采取相应的行动。 当在那个域中检测到错误时， connect-rest 会自动发送一个响应码 500，你所要做的只是记录日志并关闭服务器。 比如:
```javascript
apiOptions.domain.on('error', function(err){
    console.log('API domain error.\n', err.stack);
    setTimeout(function(){
        console.log('Server shutting down after API domain error.');
        process.exit(1);
    }, 5000);
    server.close();
    var worker = require('cluster').worker;
    if(worker) worker.disconnect();
});
```
##### 15.9 使用子域名
- 因为 API 实质上是不同于网站的， 所以很多人都会选择用子域将API跟网站其余部分分开。这十分容易，我们重构这个例子， 将 meadowlarktravel.com/api 改 成 用 api.meadowlarktravel.com。
- 先确保vhost中间件已经装好了（`npm install --save vhost`）
-  在开发环境中， 你可能没有自己的域名服务器（DNS），所以我们需要用一种手段让Express相信你连接了一个子域。 为此需要向 hosts 文件中添加一条记录。
`127.0.0.1 api.localhost`

- 现在我们直接连入新的 vhost 创建子域：
`app.use(vhost('api.*', rest.rester(apiOptions));`
- 还需要修改上下文：
```javascript
var apiOptions = {
  context: '/',
  domain: require('domain').create(),
};
```
- 现在所有通过 rest.VERB 定义的 API 路由都可以在 api 子域上调用了。
