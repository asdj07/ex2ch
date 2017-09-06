const express = require('express');
var http = require('http');
var request = require('request');
const path = require('path');
var config = require('config');
var fs=require('fs');  
var buffer = require('buffer');
var iconv = require('iconv-lite');
const app = express();

const port = 8080;
const wordMap =  new Map();
app.use(express.static(path.join(__dirname, 'public')))
console.log(__dirname);


fs.readFile(__dirname + '/public/chmap.txt','utf-8',function(err,data){  
    if(err){  
        console.error("read file error " + err);  
    }  
    else{  
        var patt = new RegExp(/[\u4e00-\u9fa5]\([\u4e00-\u9fa5]\)/,"g");
        while(true)
        {
          var regResult = patt.exec(data);
          if(!regResult){
            break;
          }
          if(regResult[0].length == 4){
            wordMap.set(regResult[0][2],regResult[0][0]);
          }
        }
    }  
});  


function writeFile(path,strHtml){
    fs.writeFile(path, strHtml, function(err) {
        if(err) {
            return console.log(err);
        }
        //console.log("The file was saved!");
    });
}

function deleteFile(path){
    fs.unlink(path, function(err){
        if(err){
            console.log('文件:'+path+'删除失败！');
            throw err;
        }
    })
}
app.use('/htmlurl',  function(req, res) {
    res.writeHead(200, {"Content-Type": "text/plain; charset=UTF-8;","Access-Control-Allow-Origin":"*"});

    request(
        { 
            method: 'GET',
            url: req.query.url,
            encoding : null
        },
        function (error, response, body) {
            var contentType = response.headers['content-type'];
            //headers中判断编码类型
            if(contentType.toLowerCase().indexOf("charset")!=-1){
                if(contentType.toLowerCase().indexOf("gbk")!=-1){
                    body = iconv.decode(body,'gbk');
                }else if(contentType.toLowerCase().indexOf("gb2312")!=-1){
                    body = iconv.decode(body,'gb2312');
                }else{
                    body = iconv.decode(body,'utf8');    
                }
            }else{//content中判断编码类型
                if(iconv.decode(body,'utf8').toLowerCase().indexOf("charset=gbk")!=-1){
                    body = iconv.decode(body,'gbk');
                }else if(iconv.decode(body,'utf8').toLowerCase().indexOf("charset=gb2312")!=-1){
                    body = iconv.decode(body,'gb2312');
                }else{
                    body = iconv.decode(body,'utf8');    
                }
            }
            
            var result = "";
            body.split("").map((a)=>{
                if((/[\u4e00-\u9fa5]/).test(a)&&wordMap.get(a))
                    a = wordMap.get(a);
                result += a;
            })
            var timestamp=new Date().getTime().toString().substring(7);  //截取当前时间,作为文件名
            var filePath = __dirname + "/public/" + timestamp + ".html";
            writeFile(filePath,result);
            setTimeout(function(){
                deleteFile(filePath);
            },10000)
            res.end(timestamp + ".html");
        }
      )
}); 


app.listen(port, () => {
    console.log(`App listening at port ${port}`)
});
