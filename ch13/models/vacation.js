// 创建模式和模型
var mongoose = require('mongoose');

var vacationSchema = mongoose.Schema({
    name: String,
    slug: String,
    category: String,
    sku: String,         //(库存单位)
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
module.exports = Vacation;
