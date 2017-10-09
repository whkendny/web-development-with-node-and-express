var Customer = require('../models/customer.js');

// convenience function for joining fields
// 联合各域的辅助函数
function smartJoin(arr, separator){
	if(!separator) separator = ' ';
	return arr.filter(function(elt) {
		return elt!==undefined &&
			elt!==null &&
			elt.toString().trim() !== '';
	}).join(separator);
}

var _ = require('underscore');

// get a customer view model
// NOTE: readers of the book will notice that this function differs from the version
// in the book.  Unfortunately, the version in the book is incorrect (Mongoose does not
// oofer an asynchronous version of .findById).  My apologies to my readers.
function getCustomerViewModel(customer, orders){
	// '_.omit': 过滤掉customer中包含'salesNotes'参数的属性
	var vm = _.omit(customer, 'salesNotes');

	// 复制后面的obj对象中所有属性覆盖到vm对象上, 并返回destination对象, 复制是按顺序的,所以后面的对象会把前面
	// 的对象属性覆盖掉(若重复);
	return _.extend(vm, {
		name: smartJoin([vm.firstName, vm.lastName]),
		fullAddress: smartJoin([
			customer.address1,
			customer.address2,
			customer.city + ', ' +
				customer.state + ' ' +
				customer.zip,
		], '<br>'),
		// 用了 JavaScript 的 .map 方法给客户视图模型设定订单列表。
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

module.exports = getCustomerViewModel;
