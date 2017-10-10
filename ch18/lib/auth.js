// 认证模块
var User = require('../models/user.js'),
	passport = require('passport'),
	FacebookStrategy = require('passport-facebook').Strategy,
	GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

// Passport 用 serializeUser 和 deserializeUser 将请求映射到认证用户上，允许你使用任何
// 存储方法。
passport.serializeUser(function(user, done){ //序列化
	done(null, user._id);
});

passport.deserializeUser(function(id, done){ //反序列化
	User.findById(id, function(err, user){
		if(err || !user) return done(err, null);
		done(null, user);
	});
});

/*
实现了这两个方法后，只要有活跃的会话，并且用户成功通过认证，  req.session.
passport.user 就会对应上 User 模型的实例。
接下来坐的两件事情:
	1. 初始化Passport 并注册处理认证
	2. 从第三方认证服务重定向的回调的路由。

*/

module.exports = function(app, options){

	// if success and failure redirects aren't specified,
	// set some reasonable defaults
	if(!options.successRedirect)
		options.successRedirect = '/account';
	if(!options.failureRedirect)
		options.failureRedirect = '/login';

	return {

		init: function() {
			var env = app.get('env');
			var config = options.providers;

			// configure Facebook strategy
			passport.use(new FacebookStrategy({
				clientID: config.facebook[env].appId,
				clientSecret: config.facebook[env].appSecret,
				callbackURL: (options.baseUrl || '') + '/auth/facebook/callback',
			}, function(accessToken, refreshToken, profile, done){
				// 参数 profile 中有 Facebook 用户的信息。最重要的是它包含 Facebook ID。
				var authId = 'facebook:' + profile.id;
				User.findOne({ authId: authId }, function(err, user){
					if(err) return done(err, null);
					if(user) return done(null, user);
					user = new User({
						authId: authId,
						name: profile.displayName,
						created: Date.now(),
						role: 'customer',
					});
					user.save(function(err){
						if(err) return done(err, null);
						done(null, user);
					});
				});
			}));

			// configure Google strategy
			passport.use(new GoogleStrategy({
				clientID: config.google[env].clientID,
				clientSecret: config.google[env].clientSecret,
				callbackURL: (options.baseUrl || '') + '/auth/google/callback',
			}, function(token, tokenSecret, profile, done){
				var authId = 'google:' + profile.id;
				User.findOne({ authId: authId }, function(err, user){
					if(err) return done(err, null);
					if(user) return done(null, user);
					user = new User({
						authId: authId,
						name: profile.displayName,
						created: Date.now(),
						role: 'customer',
					});
					user.save(function(err){
						if(err) return done(err, null);
						done(null, user);
					});
				});
			}));

			app.use(passport.initialize());
			app.use(passport.session());
		},

		// 注册路由
		registerRoutes: function(){
			// register Facebook routes
			// 访问这个路径的用户会被自动重定向到 Facebook 的认证界面上（这是由 passport.authenticate('facebook') 完成的）
			app.get('/auth/facebook', function(req, res, next){
				if(req.query.redirect) req.session.authRedirect = req.query.redirect;
				passport.authenticate('facebook')(req, res, next);
			});
			// facebook 授权后的回调
			// 在查询字符串上还有将要由 Passport 证实的认证令牌。如果 Passport 未能证实，浏览器会被重定向到 options.
			// failureRedirect 。
			app.get('/auth/facebook/callback', passport.authenticate('facebook',
				{ failureRedirect: options.failureRedirect }),
				function(req, res){
					// 只有认证成功才能到这里
					// we only get here on successful authentication
					var redirect = req.session.authRedirect;
					if(redirect) delete req.session.authRedirect;
					// 重定向
					res.redirect(303, redirect || options.successRedirect);
				}
			);

			// register Google routes
			app.get('/auth/google', function(req, res, next){
				if(req.query.redirect) req.session.authRedirect = req.query.redirect;
				passport.authenticate('google', { scope: 'profile' })(req, res, next);
			});
			app.get('/auth/google/callback', passport.authenticate('google',
				{ failureRedirect: options.failureRedirect }),
				function(req, res){
					// we only get here on successful authentication
					var redirect = req.session.authRedirect;
					if(redirect) delete req.session.authRedirect;
					// 重定向
					res.redirect(303, req.query.redirect || options.successRedirect);
				}
			);
		},

	};
};
