### 第十七章 在Express中实现MVC
- 在 MVC 中，模型是“纯粹”的数据和逻辑。它根本不关心自己跟用户之间的交互。视图
将模型传递给用户，而控制器则接受用户输入，处理模型，选择要显示哪个（些）视图。

##### 17.1 模型(Model)
- 模型是项目的基石。
- 一个更复杂也更有争议的问题是模型和持久层之间的关系。
- 非常普遍的情况是，模型中的逻辑严重依赖于持久性，把这两层分开可能得不偿失。
- 本书是用Mongoose(针对MongoDB的)来定义模型. 可以考虑使用原生的 MongoDB 驱动
（不需要任何方案或对象映射），并把你的模型跟持久层分开。
- eg把客户数据和逻辑放在文件 models/customer.js 中:

```javascript
var mongoose = require('mongoose');
var Order = require('./order.js');
var customerSchema = mongoose.Schema({
	firstName: String,
	lastName: String,
	email: String,
	address1: String,
	address2: String,
	city: String,
	state: String,
	zip: String,
	phone: String,
	salesNotes: [{
		date: Date,
		salespersonId: Number,
		notes: String,
	}],
});
customerSchema.methods.getOrders = function(cb){
	return Order.find({ customerId: this._id }, cb);
};
var Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;
```

##### 17.2 视图模型(View)
- 视图模型是保持模型抽象性的办法，同时还能为视图提供有意义的数据。

> eg:我们有个 Customer 模型。现在要创建一个视图显示客户信息，还有一串订单。然而我们的 Customer 模型不太好用。里面有我们不想显示的数据（销售记录），并且我们要格式化不同的数据（比如正确格式化邮件地址和电话号码）。更进一步说，我们想要显示不在 Customer 模型中的数据，比如客户订单列表。这时用视图模型就会很方便。接下来我们在 viewModels/customer.js 中创建一个视图模型：

```javascript
var Customer = require('../model/customer.js');
// 联合各域的辅助函数
function smartJoin(arr, separator){
  if(!separator) separator = ' ';
  return arr.filter(function(elt){
    return elt!==undefined &&
    elt!==null &&
    elt.toString().trim() !== '';
  }).join(separator);
}

module.exports = function(customerId){
  var customer = Customer.findById(customerId);
  if(!customer) return { error: 'Unknown customer ID: ' +
  req.params.customerId };
  var orders = customer.getOrders().map(function(order){
    return {
      orderNumber: order.orderNumber,
      date: order.date,
      status: order.status,
      url: '/orders/' + order.orderNumber,
    }
  });

  return {
    firstName: customer.firstName,
    lastName: customer.lastName,
    name: smartJoin([customer.firstName, customer.lastName]),
    email: customer.email,
    address1: customer.address1,
    address2: customer.address2,
    city: customer.city,
    state: customer.state,
    zip: customer.zip,
    fullAddress: smartJoin([
      customer.address1,
      customer.address2,
      customer.city + ', ' +
      customer.state + ' ' +
      customer.zip,
    ], '<br>'),
    phone: customer.phone,
    orders: customer.getOrders().map(function(order){
      return {
        orderNumber: order.orderNumber,
        date: order.date,
        status: order.status,
        url: '/orders/' + order.orderNumber,
      }
    }),
  }
}
```
- 在这个代码示例中，你能看到我们如何丢掉不需要的信息，如何重新格式化一些信息（比如fullAddress），甚至如何构造额外的信息（比如用来获取订单详情的 URL）。

- 视图模型的概念对于保护模型的完整性和范围是必不可少的。

- 如果你需要所有的副本（比
如 firstname: customer.firstName），你可能想要看看 [Underscore](http://underscorejs.org/)，用它可以做更多精心的对象组成。比如说，你可以克隆一个对象，只挑选你想要的属性，或者相反，克隆对象时忽略特定的属性。
下面用Underscore 重写了上一个例子（install with `npm install --save underscore`）：

```javascript
var _ = require('underscore');

// get a customer view model
// NOTE: readers of the book will notice that this function differs from the version
// in the book.  Unfortunately, the version in the book is incorrect (Mongoose does not
// oofer an asynchronous version of .findById).  My apologies to my readers.
function getCustomerViewModel(customer, orders){
	var vm = _.omit(customer, 'salesNotes');
	return _.extend(vm, {
		name: smartJoin([vm.firstName, vm.lastName]),
		fullAddress: smartJoin([
			customer.address1,
			customer.address2,
			customer.city + ', ' +
				customer.state + ' ' +
				customer.zip,
		], '<br>'),
		orders: orders.map(function(order){
			return {
				orderNumber: order.orderNumber,
				date: order.date,
				status: order.status,
				url: '/orders/' + order.orderNumber,
			};
		}),
	});
}
```

##### 17.3 控制器(Controller)
- 控制器负责处理用户交互，并根据用户交互选择恰当的视图来显示。听起来很像请求路由？
> 控制器和路由器之间唯一的区别是**控制器一般会把相关功能归组**。

```javascript
var Customer = require('../models/customer.js');
var customerViewModel = require('../viewModels/customer.js');

module.exports = {
	registerRoutes: function(app) {
		app.get('/customer/register', this.register);
		app.post('/customer/register', this.processRegister);
		app.get('/customer/:id', this.home);
		app.get('/customer/:id/preferences', this.preferences);
		app.get('/orders/:id', this.orders);
		app.post('/customer/:id/update', this.ajaxUpdate);
	},

	register: function(req, res, next) {
		res.render('customer/register');
	},

	processRegister: function(req, res, next) {
		// TODO: back-end validation (safety)
		var c = new Customer({
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			email: req.body.email,
			address1: req.body.address1,
			address2: req.body.address2,
			city: req.body.city,
			state: req.body.state,
			zip: req.body.zip,
			phone: req.body.phone,
		});
		c.save(function(err) {
			if(err) return next(err);
			res.redirect(303, '/customer/' + c._id);
		});
	},

	home: function(req, res, next) {
		Customer.findById(req.params.id, function(err, customer) {
			if(err) return next(err);
			if(!customer) return next(); 	// pass this on to 404 handler
			customer.getOrders(function(err, orders) {
				if(err) return next(err);
				res.render('customer/home', customerViewModel(customer, orders));
			});
		});
	},

	preferences: function(req, res, next) {
		Customer.findById(req.params.id, function(err, customer) {
			if(err) return next(err);
			if(!customer) return next(); 	// pass this on to 404 handler
			customer.getOrders(function(err, orders) {
				if(err) return next(err);
				res.render('customer/preferences', customerViewModel(customer, orders));
			});
		});
	},

	orders: function(req, res, next) {
		Customer.findById(req.params.id, function(err, customer) {
			if(err) return next(err);
			if(!customer) return next(); 	// pass this on to 404 handler
			customer.getOrders(function(err, orders) {
				if(err) return next(err);
				res.render('customer/preferences', customerViewModel(customer, orders));
			});
		});
	},

	ajaxUpdate: function(req, res) {
		Customer.findById(req.params.id, function(err, customer) {
			if(err) return next(err);
			if(!customer) return next(); 	// pass this on to 404 handler
			if(req.body.firstName){
				if(typeof req.body.firstName !== 'string' ||
					req.body.firstName.trim() === '')
					return res.json({ error: 'Invalid name.'});
				customer.firstName = req.body.firstName;
			}
			// and so on....
			customer.save(function(err) {
				return err ? res.json({ error: 'Unable to update customer.' }) : res.json({ success: true });
			});
		});
	},
};
```

- 在这个控制器中，我们将路由管理跟真正的功能分开了。
- 在这个例子里， home 、preferences 和 orders 方法除了所选的视图不同，其他都是一样的。
- 这个控制器中最复杂的方法是 ajaxUpdate 。从名字就能看出来，我们会在前端用 AJAX 做更新。要注意的是，我们没有盲目地根据请求体中传来的参数更新客户对象，那样我们可能会遭受攻击。单个处理各域要做更多工作，但更安全。还有，我们要进行校验，即便我们在前端也做了。记住，攻击者可能会检查你的 JavaScript，并构造一个 AJAX 查询绕过你的前端校验，试图欺骗你的程序，所以即便是冗余的，也一定要在服务器端做校验。

##### 17.4  结论
