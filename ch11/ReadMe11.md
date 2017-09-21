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
##### 11.7 发送批量邮件的更佳选择


##### 11.8 HTML 邮件中的图片


##### 11.9 将邮件作为网站监测工具
