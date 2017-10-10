// 谷歌的地理编码
var http = require('http');

// 连接谷歌 API 对地址做地理编码的函数
module.exports = function(query, cb){

//sensor(必填域):  有位置传感器的设备应该设为 true
    var options = {
        hostname: 'maps.googleapis.com',
        path: '/maps/api/geocode/json?address=' +
            encodeURIComponent(query) + '&sensor=false',
    };

    http.request(options, function(res){
        var data = '';
        res.on('data', function(chunk){
            data += chunk;
        });
        res.on('end', function(){
            data = JSON.parse(data);
            if(data.results.length){
                cb(null, data.results[0].geometry.location);
            } else {
                cb("No results found.", null);
            }
        });
    }).end();
};
