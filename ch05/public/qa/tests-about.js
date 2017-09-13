// 针对 about 页面的测试
suite('"About" Page Tests', function(){
	test('page should contain link to contact page', function(){
		assert($('a[href="/contact"]').length);
	});
});
