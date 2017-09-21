var nodemailer = require('nodemailer');

module.exports = function(credentials){
	var mailTransport = nodemailer.createTransport('SMTP',{
		service: '163',
		host: 'smtp.163.com',
		post: '25',
		auth: {
			user: credentials.gmail.user,
			pass: credentials.gmail.password,
		}
	});

	var from = '"wh_kendny" <wh_kendny@163.com>';
	var errorRecipient = 'wh_kendny@163.com';

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
