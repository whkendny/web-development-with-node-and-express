### 第十三章 持久化
所有网站和 Web 应用程序（除了最简单的）都需要某种持久化方式，即某种`比易失性内存更持久的数据存储方式， 这样当遇到服务器宕机、 断电、 升级和迁移等情况时数据才能保存下来`。

#### 13.1 文件系统持久化
- 实现持久化的一种方式是**将数据存到扁平文件中**（“扁平” 的意思是文件没有内在结构，只是一串字节）。 Node 通过 **fs（文件系统）模块** 实现文件系统持久化。
- 文件系统持久化有一些不足之处，特别是它的扩展性不好。当你需要不止一台服务器以满足流量的需求时，除非所有服务器都能访问一个共享的文件系统，否则就会遇到文件系统持久化的问题。
- 此外， 因为扁平文件没有内在结构， 定位、 排序和过滤数据就变成了应用
程序的负担。
-  出于这些原因， 你应该用数据库而不是文件系统来做数据排序。 排序二进制
文件是个例外， 比如图片、 音频文件或视频。 尽管很多数据库可以处理这类数据， 但极少
能达到文件系统那种效率（尽管关于二进制文件的信息一般会存在数据库里， 以便搜索、
排序和过滤）
- 如果你确实需要存储二进制数据， 记得文件系统依然有扩展性不好的问题。 如果你的主
机不能访问共享的文件系统（一般是这样）， 你应该考虑将二进制文件存在数据库中（一
般要做些配置， 以免数据库被拖垮）， 或者基于云的存储服务， 比如亚马逊 S3 或者微软
Azure 存储。

- 第 8 章假期摄影大赛那个例子。 在程序主文件中填上处理那个表单的处理器：

```javascript
// make sure data directory exists (确保存在目录 data)
var dataDir = __dirname + '/data';
var vacationPhotoDir = dataDir + '/vacation-photo';
if(!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if(!fs.existsSync(vacationPhotoDir)) fs.mkdirSync(vacationPhotoDir);

function saveContestEntry(contestName, email, year, month, photoPath){
    // TODO...this will come later
}

app.post('/contest/vacation-photo/:year/:month', function(req, res){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files){
      // 回调函数提供了所有的表单域和上传的文件
        if(err) {
            req.session.flash = {
                type: 'danger',
                intro: 'Oops!',
                message: 'There was an error processing your submission. ' +
                    'Pelase try again.',
            };
            return res.redirect(303, '/contest/vacation-photo');
        }
        var photo = files.photo;
        var dir = vacationPhotoDir + '/' + Date.now();
        var path = dir + '/' + photo.name;
        fs.mkdirSync(dir);
        fs.renameSync(photo.path, dir + '/' + photo.name);
        saveContestEntry('vacation-photo', fields.email,
            req.params.year, req.params.month, path);
        req.session.flash = {
            type: 'success',
            intro: 'Good luck!',
            message: 'You have been entered into the contest.',
        };
        return res.redirect(303, '/contest/vacation-photo/entries');
    });
});
```
- formidable 模块， 解析表单数据，特别是文件上传            
说明：
>- 首先，我们`创建了一个目录来存放上传的文件`（如果它还不存在的话）。
>-　然后创建了一个 Formidable 的 IncomingForm 实例， 并调用它的 parse方法， 传入 req 对象。 回调函数提供了所有的表单域和上传的文件。
>-　因为我们称上传域为photo， 所以会有个 files.photo 对象包含上传文件的信息。
>- 因为要防止冲突，所以我们不能用原来的文件名（比如两个用户都上传了 portland.jpg）。要避免这个问题，我们根据时间戳创建一个唯一目录，因为不太可能有两个用户在同一毫秒内都上传名为 portland.jpg 的文件。
- 然后我们重命名（移动） 上传的文件（Formidable 会给它一个临时文件名，可以从path 属性中得到） 为我们指定的文件名。
- 最后， 我们需要某种方式将用户上传的文件跟他们的邮件地址（以及提交的年和月） 关联起来。


#### 13.2 云持久化
云存储越来越流行了， 我强烈建议你利用这些便宜又好用的服务。
- 将文件保存到亚马逊 S3 账号中的例子:
```javascript
var filename = 'customerUpload.jpg';
aws.putObject({
    ACL: 'private',
    Bucket: 'uploads',
    Key: filename,
    Body: fs.readFileSync(__dirname + '/tmp/' + filename)
  })
```
[AWS SDK 文档](http://aws.amazon.com/sdkfornodejs)

- 用微软 Azure 完成相同任务的例子：
```javascript
var filename = 'customerUpload.jpg';
var blobService = azure.createBlobService();
blobService.putBlockBlobFromFile('uploads', filename, __dirname + '/tmp/' + filename);
```
[微软 Azure 文档](http://azure.microsoft.com/zh-cn/develop/nodejs/)


#### 13.3 数据库持久化
- 所有网站和 Web 应用程序（除了最简单的） 都需要数据库。
- 数据库分类： **关系型数据库（RDBMS）** 和 **非关系型数据库(NoSQL)**；
- 关系型数据库， 比如 `Oracle`、 `MySQL`、 `PostgreSQL`或 `SQL Server`，基于几十年的研究和正规的数据库原理。
- 两种最流行的 NoSQL 数据库是： **文档数据库** 和 **键-值数据库**;
> - `文档数据库`善于存储对象，这使得它们非常适合 Node 和 JavaScript。
> - `键-值数据库`如其名所示，极其简单，对于数据模式可以轻松映射到键- 值对的程序来说是很好的选择。
> - `MongoDB`是文档数据库中的佼佼者，现在也非常健壮和成熟。
> - NoSQL数据库像 Node 一样，接受了互联网分布式的本性，专注于**用并发来扩展性能**（关系型数据库也支持并发， 但一般只用于最有需要的应用程序）。
##### 13.3.1 关于性能
- 认真规划的好处是数据库能提供卓越的性能;
- **关系型数据库** 传统上依赖于它们严格的数据结构和几十年的优化研究而取得高性能。

##### 13.3.2 设置MongoDB
- 选择免费的 MongoDB 托管服务 `MongoLab`。

##### 13.3.3 Mongoose
- JavaScript 的优势之一是它的对象模型极其灵活。如果你想给一个对象添加属性或方法，尽管去做，并且不用担心要修改类。
- 可惜，那种随心所欲的灵活性可能会对数据库产生负面影响，因为它们会变得零碎和难以调优。
- Mongoose 试图确立平衡，它引入了模式和模型（联合的， 模式和模型类似于传统面向对象编程中的类）。模式很灵活，但仍为数据库提供了一些必要的结构
- 先把 Mongoose 模块装上：
`npm install --save mongoose`
- 将数据库凭证添加到 credentials.js 文件里:
```JavaScript
mongo: {
  development: {
      connectionString: 'mongodb://localhost:27017/studyExpress',
  },
  production: {
    connectionString: 'mongodb://localhost:27017/studyExpress',
  },
}
```
##### 13.3.4 使用Mongoose连接数据库
- 先从创建数据库的连接开始:
```javascript
var mongoose = require('mongoose');
var options = {
    server: {
       socketOptions: { keepAlive: 1 }
    }
};
switch(app.get('env')){
    case 'development':
        mongoose.connect(credentials.mongo.development.connectionString, options);
        break;
    case 'production':
        mongoose.connect(credentials.mongo.production.connectionString, options);
        break;
    default:
        throw new Error('Unknown execution environment: ' + app.get('env'));
}
```
> `options` 对象是可选的，但我们想指定 keepAlive 选项，以防止长期运行的应用程序（比如网站） 出现数据库连接错误。
##### 13.3.5 创建模式和模型
- 接下来我们为草地鹨旅行社创建一个度假包数据库。先从定义模式和模型开始。创建文件`models/vacation.js`：

```javascript
// 创建模式和模型
var mongoose = require('mongoose');

//声明了 vacation 模型的属性， 以及各个属性的类型
var vacationSchema = mongoose.Schema({
    name: String,
    slug: String,
    category: String,
    sku: String,    //(库存单位)
    description: String,
    priceInCents: Number,
    tags: [String],
    inSeason: Boolean,
    available: Boolean,
    requiresWaiver: Boolean,
    maximumGuests: Number,
    notes: String,
    packagesSold: Number,
});
//定义模式的方法
vacationSchema.methods.getDisplayPrice = function(){
    return '$' + (this.priceInCents / 100).toFixed(2);
};
// 将Schema发布为model  (创建模型)
var Vacation = mongoose.model('Vacation', vacationSchema);
// 输出了 Mongoose 创建的 Vacation 模型对象
module.exports = Vacation;
```
- 注意， 在创建模型之前必须先定义方法。

##### 13.3.6 添加初始数据
- 准备添加一些初始数据。
```javascript
// initialize vacations （添加初始数据）
Vacation.find(function(err, vacations){
    if(vacations.length) return; //如果数据库中已经有度假包了，结束添加

    new Vacation({
        name: 'Hood River Day Trip',
        slug: 'hood-river-day-trip',
        category: 'Day Trip',
        sku: 'HR199',
        description: 'Spend a day sailing on the Columbia and ' +
            'enjoying craft beers in Hood River!',
        priceInCents: 9995,
        tags: ['day trip', 'hood river', 'sailing', 'windsurfing', 'breweries'],
        inSeason: true,
        maximumGuests: 16,
        available: true,
        packagesSold: 0,
    }).save();

    new Vacation({
        name: 'Oregon Coast Getaway',
        slug: 'oregon-coast-getaway',
        category: 'Weekend Getaway',
        sku: 'OC39',
        description: 'Enjoy the ocean air and quaint coastal towns!',
        priceInCents: 269995,
        tags: ['weekend getaway', 'oregon coast', 'beachcombing'],
        inSeason: false,
        maximumGuests: 8,
        available: true,
        packagesSold: 0,
    }).save();

    new Vacation({
        name: 'Rock Climbing in Bend',
        slug: 'rock-climbing-in-bend',
        category: 'Adventure',
        sku: 'B99',
        description: 'Experience the thrill of rock climbing in the high desert.',
        priceInCents: 289995,
        tags: ['weekend getaway', 'bend', 'high desert', 'rock climbing', 'hiking', 'skiing'],
        inSeason: true,
        requiresWaiver: true,
        maximumGuests: 4,
        available: false,
        packagesSold: 0,
        notes: 'The tour guide is currently recovering from a skiing accident.',
    }).save();
});
```
到了两个 Mongoose 方法:
- find: 查找数据库中的所有 Vacation 实例, 并将返回结果列表传给回调函数并调用。之所以这样做，是为了避免重复添加初始数据。
- save 方法： 将这些新对象保存到数据库中。

##### 13.3.7 获取数据
- 我们已经见过 find 方法了， 我们将会用它显示一个度假列表。 然而这次我们准备传给 find一个选项来过滤数据。 具体来说， 我们只想显示目前能够提供的度假产品。
- 给产品页创建个视图， views/vacations.handlebars：
```html
{{! 给产品创建视图}}
<h1>Vacations</h1>
{{#each vacations}}
    <div class="vacation">
        <h3>{{name}}</h3>
        <p>{{description}}</p>
        {{#if inSeason}}
            <span class="price">{{price}}</span>
            <a href="/cart/add?sku={{sku}}" class="btn btn-default">Buy Now!</a>
        {{else}}
            <span class="outOfSeason">We're sorry, this vacation is currently
            not in season.
            {{! The "notify me when this vacation is in season"
                page will be our next task. }}
            <a href="/notify-me-when-in-season?sku={{sku}}">Notify me when
            this vacation is in season.</a>
        {{/if}}
    </div>
{{/each}}
```
- 可以创建路由处理器把它全串起来：
```javascript

// 给产品视图创建路由
app.get('/vacations', function(req, res){
    Vacation.find({ available: true }, function(err, vacations){
    	var currency = req.session.currency || 'USD';
        var context = {
            vacations: vacations.map(function(vacation){
                return {
                    sku: vacation.sku,
                    name: vacation.name,
                    description: vacation.description,
                    inSeason: vacation.inSeason,
                    price: vacation.getDisplayPrice(),
                    qty: vacation.qty,
                };
            })
        };
        res.render('vacations', context);
    });
});
```
- 什么要将从数据库里返回来的产品映射为几乎一样的对象？ 其中一个原因是 **Handlebars 视图无法在表达式中使用函数的输出**。所以为了以一个整齐的格式化方式显示价格， 我们必须将其转为简单的字符串属性。
> - 不要将未映射的数据库对象直接传给视图。 视图会得到一堆它可能不需要的属性， 并且可能是以它不能兼容的格式。

##### 13.3.8 添加数据
- 在添加度假集合时添加了数据
- 也知道如何更新数据（当预定度假时我们更新了已销售包的数量）， 但接下来我们要看一个稍微有点复杂的场景， 该场景凸显了文档数据库的灵活性.
- 当度假过季时， 我们要显示一个链接， 邀请客户在度假重新变得应季时接收通知。 我们要实现这个功能， 首先要创建模式和模型（`models/vacationInSeasonListener.js`） ：
```javascript
var mongoose = require('mongoose');
var vacationInSeasonListenerSchema = mongoose.Schema({
  email: String,
  skus: [String],
});
var VacationInSeasonListener = mongoose.model('VacationInSeasonListener',
vacationInSeasonListenerSchema);
module.exports = VacationInSeasonListener;
```
然后创建视图， `views/notify-me-when-in-season.handlebars`：
```html
{{!创建度假过季的 视图}}
<div class="formContainer">
    <form class="form-horizontal newsletterForm" role="form" action="/notify-me-when-in-season" method="POST">
	    <input type="hidden" name="sku" value="{{sku}}">
        <div class="form-group">
            <label for="fieldEmail" class="col-sm-2 control-label">Email</label>
            <div class="col-sm-4">
                <input type="email" class="form-control" required
                    id="fieldEmail" name="email">
            </div>
        </div>
        <div class="form-group">
            <div class="col-sm-offset-2 col-sm-4">
                <button type="submit" class="btn btn-default">Submit</button>
            </div>
        </div>
    </form>
</div>
```
- 最后是路由处理器:
```javascript
VacationInSeasonListener = require('./models/vacationInSeasonListener.js');

// 创建过季的提醒视图的路由
app.get('/notify-me-when-in-season', function(req, res){
    res.render('notify-me-when-in-season', { sku: req.query.sku });
});

app.post('/notify-me-when-in-season', function(req, res){
    VacationInSeasonListener.update(
        { email: req.body.email },
        { $push: { skus: req.body.sku } },  //$push 魔法变量表明我们要添加的一个值到数组中。
        { upsert: true },
	    function(err){
	        if(err) {
	        	console.error(err.stack);
	            req.session.flash = {
	                type: 'danger',
	                intro: 'Ooops!',
	                message: 'There was an error processing your request.',
	            };
	            return res.redirect(303, '/vacations');
	        }
	        req.session.flash = {
	            type: 'success',
	            intro: 'Thank you!',
	            message: 'You will be notified when this vacation is in season.',
	        };
	        return res.redirect(303, '/vacations');
	    }
	);
});
```
- 这是什么魔法？ 我们怎么能在 VacationInSeasonListener 还不存在的时候更新其中的记录呢？
> - 答案在于 Mongoose 方便的 upsert（“更新” 和“插入” 的混成词）。 基本上就相当于，如果给定邮件地址的记录不存在，就会创建它。如果记录存在，就更新它。 然后我们用魔法变量 `$push` 表明我们想添加一个值到数组中。
- 希望你能体会到 Mongoose 给你提供了什么， 以及你为什么要用它而不是底层的 MongoDB 驱动。
- 如果用户多次填写表单， 这段代码不能防止添加多个 SKU。 当度假变得应季时， 我们找出所有想要收到通知的客户， 必须注意不要多次通知他们。

##### 13.3.9  用MongoDB存储会话数据
- 用内存存储会话数据不适用于生产环境。好在设置 MongoDB 用来
存储会话非常容易。
- 用**session-mongoose包提供 MongoDB会话存储**。 只要装上它（`npm install --save ession-mongoose`）， 我们就可以在主程序文件中设置它：
```javascript
var MongoSessionStore = require('session-mongoose')(require('connect'));
var sessionStore = new MongoSessionStore({ url:
credentials.mongo.connectionString });
app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')({ store: sessionStore }));
```
- 接下来我们要用新创建的会话存储做些有意义的事情。 比如我们想要用不同的币种显示度假产品的价格。 此外， 我们还希望网站记住用户偏好的币种。
- 先要在度假产品页面底部添加一个币种选择器：
```javascript
<hr>
<p>Currency:
<a href="/set-currency/USD" class="currency {{currencyUSD}}">USD</a> |
<a href="/set-currency/GBP" class="currency {{currencyGBP}}">GBP</a> |
<a href="/set-currency/BTC" class="currency {{currencyBTC}}">BTC</a>
</p>
```
- 最后我们会添加路由处理器来设定币种， 并修改 /vacations 的路由处理器来用当前币种显示价格：
```javascript
app.get('/set-currency/:currency', function(req,res){
    req.session.currency = req.params.currency;
    return res.redirect(303, '/vacations');
});

//  价值转化
function convertFromUSD(value, currency){
    switch(currency){
    	  case 'USD': return value * 1;
        case 'GBP': return value * 0.6;
        case 'BTC': return value * 0.0023707918444761;
        default: return NaN;
    }
}

// 给产品视图创建路由
app.get('/vacations', function(req, res){
    Vacation.find({ available: true }, function(err, vacations){
    	var currency = req.session.currency || 'USD';
        var context = {
            currency: currency,
            vacations: vacations.map(function(vacation){
                return {
                    sku: vacation.sku,
                    name: vacation.name,
                    description: vacation.description,
                    inSeason: vacation.inSeason,
                    price: convertFromUSD(vacation.priceInCents/100, currency),
                    qty: vacation.qty,
                };
            })
        };
        switch(currency){
	    	  case 'USD': context.currencyUSD = 'selected'; break;
	        case 'GBP': context.currencyGBP = 'selected'; break;
	        case 'BTC': context.currencyBTC = 'selected'; break;
	    }
        res.render('vacations', context);
    });
});
```
> - 这不是执行汇率换算的好办法， 我们应该利用第三方汇率换算 API， 以便确保汇率是最新的。
- MongoDB 不一定是会话存储的最佳选择， 它有点杀鸡用牛刀的意味。另
外一个流行又易用的会话持久化方案是用 [Redis](http://redis.io/)。请参阅[connect-redis](https://www.npmjs.org/package/connect-redis)包


###### 有问题
```
Provisional headers are shown


RangeError: Maximum call stack size exceeded
    at RegExp.exec (native)
    at RegExp.test (native)
    at clone (E:\study\nodeAndExpress\ch13\node_modules\mongoose\node_modules\mquery\lib\utils.js:26:24)
    at Object.cloneArray (E:\study\nodeAndExpress\ch13\node_modules\mongoose\node_modules\mquery\lib\utils.js:109:14)
    at clone (E:\study\nodeAndExpress\ch13\node_modules\mongoose\node_modules\mquery\lib\utils.js:23:20)
    at Object.cloneObject (E:\study\nodeAndExpress\ch13\node_modules\mongoose\node_modules\mquery\lib\utils.js:77:13)
    at clone (E:\study\nodeAndExpress\ch13\node_modules\mongoose\node_modules\mquery\lib\utils.js:55:20)
    at Object.cloneObject (E:\study\nodeAndExpress\ch13\node_modules\mongoose\node_modules\mquery\lib\utils.js:77:13)
    at clone (E:\study\nodeAndExpress\ch13\node_modules\mongoose\node_modules\mquery\lib\utils.js:55:20)
    at Object.cloneArray (E:\study\nodeAndExpress\ch13\node_modules\mongoose\node_modules\mquery\lib\utils.js:109:14)
    at clone (E:\study\nodeAndExpress\ch13\node_modules\mongoose\node_modules\mquery\lib\utils.js:23:20)
    at Object.cloneObject (E:\study\nodeAndExpress\ch13\node_modules\mongoose\node_modules\mquery\lib\utils.js:77:13)
    at clone (E:\study\nodeAndExpress\ch13\node_modules\mongoose\node_modules\mquery\lib\utils.js:55:20)
    at Object.cloneObject (E:\study\nodeAndExpress\ch13\node_modules\mongoose\node_modules\mquery\lib\utils.js:77:13)
    at clone (E:\study\nodeAndExpress\ch13\node_modules\mongoose\node_modules\mquery\lib\utils.js:55:20)
    at Object.cloneArray (E:\study\nodeAndExpress\ch13\node_modules\mongoose\node_modules\mquery\lib\utils.js:109:14)
_http_outgoing.js:356
    throw new Error('Can\'t set headers after they are sent.');

```

mongodb://<dbuser>:<dbpassword>@ds040167.mlab.com:40167/kendny
