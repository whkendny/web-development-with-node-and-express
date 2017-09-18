#### 第八章 表单处理
> 无论是使用浏览器提交表单，还是使用AJAX提交，或是运用精巧的前端控件，底层机制通常仍旧是**HTML表单**。

###### 8.1 向服务器发送客户端数据
两种方式:
1. 查询字符串:  发起了一个GET请求;
2. 请求正文 : 发起了一个POST请求;

> - 使用HTTPS协议，两者都是安全的；如果不使用，则都不安全。
> - 如果不使用HTTPS协议，入侵者会像查看GET请求的查询字符串一样，轻松查看POST请求的报文数据。然而，如果你使用GET请求，用户会在查询字符串中看到所有的输入数据（包括隐藏域）。此外，浏览器会限制查询字符串的长度（对请求正文没有长度限制）。基于这些原因，一般推荐使用POST进行表单提交。

###### 8.2 HTML表单
```html
<form action="/process" method="POST">
   <input type="hidden" name="hush" val="hidden, but not secret!">
   <div>
      <label for="fieldColor">Your favorite color: </label>
      <input type="text" id="fieldColor" name="color">
   </div>
   <div>
      <button type="submit">Submit</button>
   </div>
</form>
```
说明:
1. 不指定method方法的话,默认进行GET提交;       
2. action的值被指定为用于接收表单数据的URL。如果你忽略这个值，表单会提交到它被加载进来时的同一URL。

- 最重要的属性是`<input>`域中的`name`属性，这样服务器才能识别字段。name属性与id属性是截然不同的，后者只适用于样式和前端功能（它不会发送到服务器端)。

###### 8.3 编码
- 当表单被提交（通过浏览器或AJAX）时，某种程度上它必须被编码, 不明确地指定编码，则默认为`application/x-wwwform-urlencoded`（这只是一个冗长的用于“URL编码”的媒体类型）。它是受Express支持的基本、易用的编码。
- 若需要上传文件，事情就开始变得复杂起来。使用URL编码很难发送文件，所以不得不使用multipart/form-data编码类型，这并不直接由Express处理（事实上，Express仍然支持这种编码，但是在Express的下一个版本它会被移除，并且它也并不被建议使用）。

###### 8.4 处理表单的不同方式
- AJAX提交表单
- 用浏览器提交表单(会重新加载页面)

处理表单时需要处理的两件事情:
  1. 用什么路径来处理表单;
  2. 决定如何响应浏览器;
> **直接响应HTML**      
> 处理表单之后，可以直接向浏览器返回HTML（例如，一个视图）。如果用户尝试重新加载页面，这种方法就会产生警告，并且会影响书签和后退按钮。基于这些原因，不推荐这种方法。

> **302重定向:**     
> 虽然这是一种常见的方法，但这是对响应代码302本义的滥用。HTTP 1.1增加了响应代码303，一种更合适的代码。除非你有理由让浏览器回到1996年，否则你应该改用303。

> **303重定向:**
> HTTP 1.1添加了响应代码303用来解决302重定向的滥用。HTTP规范明确地表明浏览器303重定向后，无论之前是什么方法，都应该使用`GET`请求。这是用于响应表单提交请求的推荐方法。

由于推荐通过303重定向来响应表单提交，接下来的问题是：“重定向指向哪里？”。下面是一些常用的方法。
- 重定向到专用的成功/失败页面;
- 运用flash消息重定向到原位置;
- 运用flash消息重定向到新位置;

##### 8.5 Express表单处理
- 如果使用GET进行表单处理，表单域在`req.query`对象中。
- 如果使用POST（推荐使用的），需要**引入中间件来解析URL编码体**。
> 1. 安装body-parser中间件（`npm install --save body-parser`），然后引入
```javascript
var bodyParser = require('body-parser');
app.use(bodyParser());
```
> 2.创建`/views/newsletter.handlebars`：
```HTML
<h2>Sign up for our newsletter to receive news and specials!</h2>
<form class="form-horizontal" role="form"
action="/process?form=newsletter" method="POST">
    <input type="hidden" name="_csrf" value="{{csrf}}">
    <div class="form-group">
         <label for="fieldName" class="col-sm-2 control-label">Name</label>
         <div class="col-sm-4">
             <input type="text" class="form-control"
              id="fieldName" name="name">
         </div>
    </div>
    <div class="form-group">
         <label for="fieldEmail" class="col-sm-2 control-label">Email</label>
         <div class="col-sm-4">
              <input type="email" class="form-control" required
              id="fieldName" name="email">
         </div>
    </div>
    <div class="form-group">
         <div class="col-sm-offset-2 col-sm-4">
              <button type="submit" class="btn btn-default">Register</button>
         </div>
    </div>
</form>
```
> 3. 应用文件;   

```javascript     
app.get('/newsletter', function(req, res){
    //我们会在后面学到CSRF……目前, 只提供一个虚拟值
    res.render('newsletter', { csrf: 'CSRF token goes here' });
});

app.post('/process', function(req, res){
    console.log('Form (from querystring): ' + req.query.form);
    console.log('CSRF token (from hidden form field): ' + req.body._csrf);
    console.log('Name (from visible form field): ' + req.body.name);
    console.log('Email (from visible form field): ' + req.body.email);
    res.redirect(303, '/thank-you');
});
```

> - 在处理程序中，我们将重定向到“thank you”视图。我们可以在此渲染视图，但是如果这样做，访问者的浏览器地址栏仍旧是/process，这可能会令人困惑。发起一个重定向可以解决这个问题。
> - 在这种情况下使用303（或302）重定向，而不是301重定向，这一点非常重要。**301重定向是“永久”的**，意味着浏览器会缓存重定向目标。**如果使用301重定向并且试图第二次提交表单，浏览器会绕过整个/process处理程序直接进入/thank you页面**，因为它正确地认为重定向是永久性的。另一方面，303重定向告诉浏览器“是的，你的请求有效，可以在这里找到响应”，并且不会缓存重定向目标。

###### 8.6 处理AJAX表单
- 用Express处理AJAX表单非常简单；甚至可以使用相同的处理程序来处理AJAX请求和常规的浏览器回退。
1. HTML文件 （`/views/newsletter.handlebars`）
```javascript
<div class="formContainer">
   <form class="form-horizontal newsletterForm" role="form"
           action="/process?form=newsletter" method="POST">
         <input type="hidden" name="_csrf" value="{{csrf}}">
         <div class="form-group">
               <label for="fieldName" class="col-sm-2 control-label">Name</label>
               <div class="col-sm-4">
                   <input type="text" class="form-control" id="fieldName" name="name">
                </div>
         </div>
         <div class="form-group">
               <label for="fieldEmail" class="col-sm-2 control-label">Email</label>
               <div class="col-sm-4">
                   <input type="email" class="form-control" required id="fieldName" name="email">
               </div>
         </div>
         <div class="form-group">
               <div class="col-sm-offset-2 col-sm-4">
                   <button type="submit" class="btn btn-default">Register</button>
               </div>
         </div>
    </form>
</div>
{{#section 'jquery'}}
    <script>
        $(document).ready(function(){
              $('.newsletterForm').on('submit', function(evt){
                   evt.preventDefault();
                   var action = $(this).attr('action');
                   var $container = $(this).closest('.formContainer');
                   $.ajax({
                       url: action,
                       type: 'POST',
                       success: function(data){
                           if(data.success){
                                $container.html('<h2>Thank you!</h2>');
                           } else {
                                $container.html('There was a problem.');
                           }
                       },
                       error: function(){
                                $container.html('There was a problem.');
                       }
                    });
                 });
              });
     </script>
{{/section}}
```
2. 应用程序文件
```javascript
app.post('/process', function(req, res){
     if(req.xhr || req.accepts('json,html')==='json'){
         // 如果发生错误，应该发送 { error: 'error description' }
         res.send({ success: true });
      } else {
         // 如果发生错误，应该重定向到错误页面
         res.redirect(303, '/thank-you');
      }
});
```
- Express提供了两个方便的属性：`req.xhr`和`req.accepts`。
- 如果是AJAX请求（XHR是XML HTTP请求的简称，AJAX依赖于XHR），**req.xhr值为true**。**req.accepts试图确定返回的最合适的响应类型**。
- `req.accepts('json,html')`询问最佳返回格式**是JSON还是HTML**：这可以根据Accepts HTTP头信息推断出来，它是浏览器提供的可读的、有序的响应类型列表。
- 如果是一个AJAX请求，或者User-Agent明确要求JSON优先于HTML，那么就会返回合适的JSON数据；否则，返回一个重定向。
- 在这个函数里可以做任何处理：通常会**将数据保存到数据库**。如果出现问题，则返回一个err属性（而不是success）的JSON对象，或者重定向到一个错误页面（如果不是AJAX请求）。
- 如果想让AJAX处理程序通用，或者知道AJAX请求使用JSON之外的东西，你应该根据Accepts头信息（可以根据`req.accepts`辅助方法轻松访问）返回一个适当的响应。
- 如果响应完全基于Accepts头信息，你或许想看看c，这是一个可以根据客户端预期轻松做出适当响应的简便方法。如果这样做，必须保证用jQuery发起AJAX请求时设置dataType和accepts属性。

##### 8.6 文件上传
对于复合表单处理，目前有两种流行而健壮的选择：`Busboy`和`Formidable`。
- Formidable要稍微简单一些，因为它有一个方便的回调方法，能够提供包含字段和文件信息的对象。
- 对于Busboy而言，必须对每一个字段和文件事件进行监听。
eg:
- （`views/contest/vacation-photo.handlebars`）
```html
<form class="form-horizontal" role="form"
          enctype="multipart/form-data" method="POST"
          action="/contest/vacation-photo/{year}/{month}">
        <div class="form-group">
             <label for="fieldName" class="col-sm-2 control-label">Name</label>
             <div class="col-sm-4">
                  <input type="text" class="form-control"
                   id="fieldName" name="name">
             </div>
        </div>
        <div class="form-group">
            <label for="fieldEmail" class="col-sm-2 control-label">Email</label>
            <div class="col-sm-4">
                  <input type="email" class="form-control" required
                      id="fieldName" name="email">
            </div>
        </div>
        <div class="form-group">
             <label for="fieldPhoto" class="col-sm-2 control-label">Vacation photo
             </label>
             <div class="col-sm-4">
                  <input type="file" class="form-control" required accept="image/*" id="fieldPhoto" name="photo">
             </div>
        </div>
        <div class="form-group">
             <div class="col-sm-offset-2 col-sm-4">
                  <button type="submit" class="btn btn-primary">Submit</button>
             </div>
        </div>
</form>
```
- 注意，我们必须指定enctype="multipart/form-data"来启用文件上传。我们也可以通过accept属性来限制上传文件的类型（这是可选的）。
- 安装Formidable（`npm install --save formidable`）并创建一下路由处理程序：

```javascript
var formidable = require('formidable');

app.get('/contest/vacation-photo',function(req,res){
    var now = new Date();
    res.render('contest/vacation-photo',{
        year: now.getFullYear(),month: now.getMont()
    });
});

app.post('/contest/vacation-photo/:year/:month', function(req, res){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files){
        if(err) return res.redirect(303, '/error');
        console.log('received fields:');
        console.log(fields);
        console.log('received files:');
        console.log(files);
        res.redirect(303, '/thank-you');
    });
});
```
> - （year和month被指定为路由参数）。继续运行，检查控制台日志。你会发现表单字段如你预期的那样：是一个有字段名称属性的对象。文件对象包含更多的数据，但这是相对简单的。对于每一个上传的文件，你会看到属性有文件大小、上传路径（通常是在临时目录中的一个随机名字），还有用户上传此文件的原始名字（文件名，而不是整个路径，出于安全隐私考虑）。
- 处理这个文件：可以将它保存到数据库，将其复制到更持久的位置，或者上传到云端文件存储系统。记住，如果你基于本地存储保存文件，应用程序不能很好地扩展，基于云端存储是一个更好的选择。



#####8.7 jQuery文件上传
- 文件上传插件 `jQuery File Upload`;
- 要显示文件缩略图，`jquery-file-upload-middleware`使用[ImageMagick](http://www.imagemagick.org)

 1. 首先，安装`jquery-file-upload-middleware`包（`npm install --save jquery-file-upload-middleware`），然后在你的应用文件中添加以下代码：

 ```javascript
 var jqupload = require('jquery-file-upload-middleware');  //引入上传的插件

 app.use('/upload', function(req, res, next){
     var now = Date.now();
     jqupload.fileHandler({
          uploadDir: function(){ //上传的目录
              return __dirname + '/public/uploads/' + now;
          },
          uploadUrl: function(){
              return '/uploads/' + now;
          },
      })(req, res, next);
 });
 ```
> 为所有访问者提供一个共用的文件上传区域，否则可能要将上传文件区分开来。简单的方法是创建一个时间戳目录来存储文件。更实际的做法是使用用户ID或其他唯一ID来创建子目录。
> 请注意，我们将jQuery File Upload中间件挂载在/upload前缀上。你可以在这里使用任何前缀，但是确保该前缀不用于其他路由或中间件，不然会干扰文件上传操作。

2. 接下来是文件上传的视图，你可以直接复制演示上传代码：你可以在project's GitHub页面上传最新项目包。
如果你只想要一个可构建的最小示例，需要如下脚本：      
`js/vendor/jquery.ui.widget.js`、`js/jquery.iframe-transport.js`和`js/jquery.fileupload.js`。

在这个最小实现中，我们将`<input type="file">`元素放在`<span>`中，还有一个`<div>`用来列出所有已上传文
```html
<span class="btn btn-default btn-file">
     Upload
     <input type="file" class="form-control" required accept="image/*"
         id="fieldPhoto" data-url="/upload" multiple name="photo">
</span>
<div id="uploads"></div>
```

3. 然后我们加上jQuery File Upload：
```javascript
{{#section 'jquery'}}
     <script src="/vendor/jqfu/js/vendor/jquery.ui.widget.js"></script>
     <script src="/vendor/jqfu/js/jquery.iframe-transport.js"></script>
     <script src="/vendor/jqfu/js/jquery.fileupload.js"></script>
     <script>
         $(document).ready(function(){

              $('#fieldPhoto').fileupload({
                     dataType: 'json',
                     done: function(e, data){
                         $.each(data.result.files, function(index, file){
                             $('#fileUploads').append($('<div class="upload">' +
                                   '<span class="glyphicon glyphicon-ok"></span>' +
                                   '&nbsp;' + file.originalName + '</div>'));
                         });
                     }
              });
         });
     </script>
{{/section}}
```

4. 为上传按钮添加CSS动态样式：
```css
.btn-file {
    position: relative;
    overflow: hidden;
}
.btn-file input[type=file] {
    position: absolute;
    top: 0;
    right: 0;
    min-width: 100%;
    min-height: 100%;
    font-size: 999px;
    text-align: right;
    filter: alpha(opacity=0);
    opacity: 0;
    outline: none;
    background: white;
    cursor: inherit;
    display: block;
}
```
注意，<input>标签里的data-url属性必须和用于中间件的路由前缀相匹配。
