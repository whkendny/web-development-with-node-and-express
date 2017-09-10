/*
针对全局的测试
*/
suite('Global Tests', function(){
	test('page has a valid title', function(){
		assert(document.title && document.title.match(/\S/) &&
			document.title.toUpperCase() !== 'TODO');
	});
});
