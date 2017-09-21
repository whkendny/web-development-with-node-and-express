### 第十一章 发送邮件
##### 11.1 SMTP, MSA和MTA
- SMTP（Simple Mail Transfer Protocol）
> 制定：
      First：RFC 788 in 1981
      Last：RFC 5321 in 2008
>端口：
      TCP 25(SMTP),
      TCP 465/587(SMTP_SSL)
> 功能：
>>用户客户端：
          发送消息：SMTP
          接收和管理消息：POP3、IMAP
>>邮件服务器：
          发送和接收消息：SMTP

>说明： SMTP**仅定义了消息传输格式（如消息发送者参数）** ，而非消息内容（如消息头和消息体）。

- SMTP协议（SMTP由3部分构成）：
> - MAIL：建立发送者地址。
> - RCPT：建立接收者地址。
> - DATA：标志邮件内容的开始。邮件内容由两部分构成：**邮件头** 和以空行分割的**邮件体**。DATA是一组命令，服务器需要做`两次回复`：第一次回复`表明其准备好接收邮件`，第二次回复`表明其接收/拒绝整个邮件`。

- 邮件发送模型
![](http://images2015.cnblogs.com/blog/759985/201605/759985-20160521132804576-1874172453.png)

> 流程描述：     
1. 使用SMTP协议，通过MUA（Mail User Agent）提交邮件到MSA（Mail Submission Agent），然后MSA递送邮件到MTA（Mail Transfer Agent）[通常而言，MSA和MTA是同一邮件服务器上的两个不同例程，其也被称为SMTP服务器]。
2. MTA通过DNS在MX（Mail Exchanger Record）上查询接收者的邮件服务器。
3. MTA发送邮件到目标邮件服务器MTA，其间可能是两个MTA直接通信，或者经过多个SMTP服务器，最终到达MDA（Mail Delivery Agent）。
4. MDA直接递送或者通过SMTP协议，将邮件递送到本地MTA。
5. 终端应用程序通过IMAP/POP3协议接收和管理邮件。

[邮件系统中的各个单元](http://zoomq.qiniudn.com/ZQScrapBook/ZqFLOSS/data/20110506155833/)

##### 11.2 接收邮件
[详见](https://www.liaoxuefeng.com/wiki/001374738125095c955c1e6d8bb493182103fac9270762a000/001408244819215430d726128bf4fa78afe2890bec57736000)

##### 11.3 邮件头
- 邮件由两部分组成： **头部** 和 **主体**
> **头部**(包含与邮件有关的信息)： 谁发的、发给谁、接收日期、主题等。
>> - 头信息给了所有关于邮件如何到达你这里的信息，邮件经过的所有服务器和 MTA 都会在头部里列出来。
>> - 发送的邮件必须有“from”地址(这个地址可以由发送方任意设定);

##### 11.4 邮件格式
- 互联网刚刚出现时，邮件都是简单的 ASCII 文本；
- 几乎所有现代的邮件程序都支持 HTML 邮件，所以用 HTML 作为邮件格式一般相当安全。

##### 11.5 HTML邮件
- MailChimp
- HTML Email Boilerplate

##### 11.6 Nodemailer
1. 安装 `Nodemailer`包
```shell
npm install --save nodemailer
```
2. 引入 nodemailer 包并创建一个 Nodemailer 实例（按 Nodemailer 的说法是一个“传输”）
```javascript
var nodemailer = require('nodemailer');
var mailTransport = nodemailer.createTransport('SMTP',{
  service: 'Gmail',
  auth: {
    user: credentials.gmail.user,
    pass: credentials.gmail.password,
  }
});
```
3. 需要对你的 credentials.js 做出相应
的修改：
```javascript
module.exports = {
  cookieSecret: 'your cookie secret goes here',
  gmail: {
    user: 'your gmail username',
    password: 'your gmail password',
  }
};
```
> Nodemailer 为大多数流行的邮件服务提供了快捷方式：Gmail、Hotmail、iCloud、Yahoo!，除此之外还有很多。如果你的 MSA 没有出现在这个列表上，或者你需要直接连接一个SMTP 服务器，它也支持：
```javascript
var mailTransport = nodemailer.createTransport('SMTP',{
  host: 'smtp.meadowlarktravel.com',
  secureConnection: true, // 用 SSL 端口 : 465
    auth: {
      user: credentials.meadowlarkSmtp.user,
      pass: credentials.meadowlarkSmtp.password,
  }
});
```

###### 16.6.1 发送邮件
- 向一个接收者发送文本邮件：
```javascript
mailTransport.sendMail({
    from: '"Meadowlark Travel" <info@meadowlarktravel.com>',
    to: 'joecustomer@gmail.com',
    subject: 'Your Meadowlark Travel Tour',
    text: 'Thank you for booking your trip with Meadowlark Travel.'+
    'We look forward to your visit!',
  }, function(err){
    if(err) {
      console.error( 'Unable to send email: ' + error );
  }
});
```
> - 没有错误不一定表示邮件成功发给了接收者：只有在跟 MSA 通信出现问题时才会设置回调函数的 err 参数（比如网络或授权错误）。如果 MSA 不能投递邮件（比如因为无效的邮件地址或者未知的用户），你会收到一封投递给 MSA 账号的失败邮件（比如你用自己的个人 Gmail 作为 MSA，你的 Gmail收件箱中就会收到一封失败消息）。
> - 如果你需要系统自动判断邮件是否投递成功，有两个选择。
>> - 使用支持错误报告的MSA。亚马逊的简单邮件服务（SES）就是这样的服务，并且邮件退信通知是通过他们的简单通知服务（SNS）发送的，你可以配置其调用运行在你网站上的 Web 服务。
>> - 另一个选择是使用直接投递，跳过 MSA。我不推荐使用直接投递，因为它是一个复杂的方案，并且你的邮件很可能会被标记为垃圾邮件。这些选择都不简单，并且都超出了本书的范围。

###### 11.6.2 将邮件发送给多个接收者
Nodemail 支持发送邮件给多个接收者，只要把他们用逗号分开：
```javascript
mailTransport.sendMail({
    from: '"Meadowlark Travel" <info@meadowlarktravel.com>',
    to: 'joe@gmail.com, "Jane Customer" <jane@yahoo.com>, ' +
    'fred@hotmail.com',
    subject: 'Your Meadowlark Travel Tour',
    text: 'Thank you for booking your trip with Meadowlark Travel. ' +
    'We look forward to your visit!',
  }, function(err){
    if(err){
       console.error( 'Unable to send email: ' + error );
    }
});
```
- 注意，在这个例子中，我们把普通邮件地址（joe@gmail.com）和指定了接收者姓名的地址（“Jane Customer” jane@yahoo.com）混在了一起。这种语法是可以的。
- 在向多个接收者发送邮件时，你必须注意观察 MSA 的限制。
> 比如 Gmail，每封邮件的接收者上限是 100 个。即便更强壮的服务，比如 SendGrid，也会限制接收者的数量（SendGrid建议每封邮件的接收者不超过 1000 个）。

- 如果你发送批量邮件，可能要发送多条消息，每条消息有多个接收者:
```javascript
// largeRecipientList 是一个邮件地址数组
var recipientLimit = 100;
for(var i=0; i<largeRecipientList.length/recipientLimit; i++){
  mailTransport.sendMail({
  from: '"Meadowlark Travel" <info@meadowlarktravel.com>',
  to: largeRecipientList.slice(i*recipientLimit, i*(recipientLimit+1)).join(','),
        subject: 'Special price on Hood River travel package!',
        text: 'Book your trip to scenic Hood River now!',
      }, function(err){
        if(err) console.error( 'Unable to send email: ' + error );
      });
}
```

##### 11.7 发送批量邮件的更佳选择
- 一个负责任的邮件营销必须提供一种退订营销邮件的办法，并且这不是个轻而易举的任务。还要乘以你维护的每个订阅列表（比如，你可能有一个周简讯和一个特殊的公告营销）。这是一个最好不要白费力气做重复工作的领域。
- 像 MailChimp（http://mailchimp.com/）和 Campaign Monitor（http://www.campaignmonitor.com/）之类的服务提供了你需要的一切，包括监测邮件营销成功情况的优秀工具。你完全负担得起，我强烈推荐使用它们做营销邮件、简讯等。

##### 11.8 发送HTML 邮件
Nodemailer 允许你在同一封邮件里发送 HTML 和普通文本两种版本，让邮件客户端选择显示哪个版本（一般是 HTML）：
```javascript
mailTransport.sendMail({
  from: '"Meadowlark Travel" <info@meadowlarktravel.com>',
  to: 'joecustomer@gmail.com, "Jane Customer" ' + '<janecustomer@gyahoo.com>, frecsutomer@hotmail.com',
  subject: 'Your Meadowlark Travel Tour',
  html: '<h1>Meadowlark Travel</h1>\n<p>Thanks for book your trip with ' + 'Meadowlark Travel. <b>We look forward to your visit!</b>',
  text: 'Thank you for booking your trip with Meadowlark Travel. ' + 'We look forward to your visit!',
}, function(err){
  if(err) console.error( 'Unable to send email: ' + error );
});
```
这个工作量很大，所以我不推荐这种方式。幸好 Nodemailer 会自动将 HTML 翻译成普通文本:
```javascript
mailTransport.sendMail({
  from: '"Meadowlark Travel" <info@meadowlarktravel.com>',
  to: 'joecustomer@gmail.com, "Jane Customer" ' + '<janecustomer@gyahoo.com>, frecsutomer@hotmail.com',
  subject: 'Your Meadowlark Travel Tour',
  html: '<h1>Meadowlark Travel</h1>\n<p>Thanks for book your trip with ' + 'Meadowlark Travel. <b>We look forward to your visit!</b>',
  generateTextFromHtml: true,
}, function(err){
  if(err) console.error( 'Unable to send email: ' + error );
});
```

####### 11.8.1 HTML邮件中的图片
- 将图片放在云服务器上,通过将图片的链接引入;

####### 11.8.2 用视图发送HTML邮件
> 假设我们有一个购物车对象， 它包含了我们的订单信息。 这个购物车对象会存在于会话中。 订单流程中的最后一步是由 `/cart/chckout` 处理的表单， 它会发送一封确认邮件。

1. 先从创建“感谢” 页面的视图开始， `views/cart-thankyou.handlebars`：
```html
<p>Thank you for booking your tirp with Meadowlark Travel, {{cart.billing.name}}!</p>
<p>Your reservation number is {{cart.number}}, and an email has been
sent to {{cart.billing.email}} for your records.</p>
```
2. 创建一个邮件模板。 下载 HTML Email Boilerplate， 把它放到 `views/email/cart-thank-you.handlebars` 中。 编辑这个文件， 修改主体部分:
```html
<body>
<!-- Wrapper/Container Table: Use a wrapper table to control the width and the background color consistently of your email. Use this approach instead of setting attributes on the body tag. -->
<table cellpadding="0" cellspacing="0" border="0" id="backgroundTable">
    <tr>
        <td valign="top">
            <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                    <td width="200" valign="top"><img class="image_fix" src="http://meadowlarktravel.com/email/logo.png" alt="Meadowlark Travel" title="Meadowlark Travel" width="180" height="220" /></td>
                </tr>
                <tr>
                    <td width="200" valign="top"><p>Thank you for booking your trip with Meadowlark Travel, {{cart.billing.name}}.</p><p>Your reservation number is {{cart.number}}.</p></td>
                </tr>
                <tr>
                    <td width="200" valign="top">Problems with your reservation?  Contact Meadowlark Travel at <span class="mobile_link">555-555-0123</span>.</td>
                </tr>
            </table>
        </td>
    </tr>
</table>
<!-- End of wrapper table -->
</body>
```

3. 为购物车“感谢”页面创建路由：
```javascript
// 购物车"感谢"页面创建路由
app.post('/cart/checkout', function(req, res){
	// 获取cart
	var cart = req.session.cart;
	if(!cart) next(new Error('Cart does not exist.'));
	var name = req.body.name || '', email = req.body.email || '';
	// input validation
	if(!email.match(VALID_EMAIL_REGEX)) return res.next(new Error('Invalid email address.'));
	// assign a random cart ID; normally we would use a database ID here
	cart.number = Math.random().toString().replace(/^0\.0*/, '');
	cart.billing = {
		name: name,
		email: email,
	};
	/*
	1. 第一次调用render调用避开了正常的渲染过程（提供一个回调函数，可以防止视图结果渲染到浏览器中）
	2. 回调函数在参数 html 中接收到渲染好的视图， 我们只需要接受渲染好的 HTML 并发送邮件。
  3. 指定了 layout: null以防止使用我们的布局文件， 因为它全在邮件模板中（另一种方式是为邮件单独创建一个
模板）
	*/
    res.render('email/cart-thank-you',
    	{ layout: null, cart: cart }, function(err,html){
	        if( err ){
						 console.log('error in email template');
					}
					// send email
	        emailService.send(cart.billing.email,
	        	'Thank you for booking your trip with Meadowlark Travel!',
	        	html);
	    }
    );
		// 再次调用了 res.render。 这次结果会像往常一样将 HTML 响应发给浏览器。
    res.render('cart-thank-you', { cart: cart });
});
```

###### 11.8.3 封装邮件功能
- 创建模块 lib/email.js
```javascript
var nodemailer = require('nodemailer');

module.exports = function(credentials){
	//创建一个nodemailer实例
	var mailTransport = nodemailer.createTransport('SMTP',{
		service: 'Gmail',
		auth: {
			user: credentials.gmail.user,
			pass: credentials.gmail.password,
		}
	});

	var from = '"Meadowlark Travel" <info@meadowlarktravel.com>';
	var errorRecipient = 'youremail@gmail.com';

	return {
		send: function(to, subj, body){
		    mailTransport.sendMail({
		        from: from,
		        to: to,
		        subject: subj,
		        html: body,
		        generateTextFromHtml: true
		    }, function(err){
		        if(err) console.error('Unable to send email: ' + err);
		    });
		},

		emailError: function(message, filename, exception){
			var body = '<h1>Meadowlark Travel Site Error</h1>' +
				'message:<br><pre>' + message + '</pre><br>';
			if(exception) body += 'exception:<br><pre>' + exception + '</pre><br>';
			if(filename) body += 'filename:<br><pre>' + filename + '</pre><br>';
		    mailTransport.sendMail({
		        from: from,
		        to: errorRecipient,
		        subject: 'Meadowlark Travel Site Error',
		        html: body,
		        generateTextFromHtml: true
		    }, function(err){
		        if(err) console.error('Unable to send email: ' + err);
		    });
		},
	};
};

```
- 现在要发送邮件， 我们只需要
```javascript
var emailService = require('./lib/email.js')(credentials);
emailService.send('joecustomer@gmail.com', 'Hood River tours on sale today!',
'Get \'em while they\'re hot!');
```

##### 11.9 将邮件作为网站监测工具
```javascript
if(err){
  email.sendError('the widget broke down!', __filename);
  // ……给用户显示错误消息
} /
/ 或者
try {
  // 在这里做些不确定的事情……
} catch(ex) {
  email.sendError('the widget broke down!', __filename, ex);
  // ……给用户显示错误消息
}
```
