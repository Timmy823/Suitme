var fs = require('fs');
var nodemailer = require('nodemailer');
var sender = JSON.parse(fs.readFileSync(__dirname+'/sender.json')); 

module.exports.SendMail = SendMail;

function SendMail(address,passwd){
  var text = 'Your password is '+passwd;
  // 宣告發信物件
  var transport = nodemailer.createTransport({
    service:'Gmail',
    auth:sender
  });
  console.log('address:'+address);
  console.log('password: '+passwd);
  //信件內容
  var mail_options = {
    from:sender.user,
    to:address,
    subject:'西裝訂製忘記密碼',
    text:text
  }
  //發送信件
  transport.sendMail(mail_options,function(error,info){
    if(error) return console.log(error);
    console.log('Email is sent:'+ info.response);
  });
}