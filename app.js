//透過http模組啟動web server服務
const http = require('http');
const express = require('express');
const exphbs = require('express-handlebars');
const session = require('express-session');
const redis = require('redis');
const redisStore = require('connect-redis')(session);
const multer  = require('multer');

const userdb = require('./lib/userdb.js');
const mail = require('./lib/mail.js');

const port = 5000
const app = express();
const redisClient = redis.createClient();
let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname + '/public/img/user')      //you tell where to upload the files,
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})
let upload = multer({storage: storage});

/* setting hbs */
/* layoutsDir and partialsDir is default setting*/
app.engine('.hbs', exphbs({     
  defaultLayout:'main',
  extname:'.hbs',
  layoutsDir:__dirname+'/views/layouts/',
  partialsDir:__dirname+'/views/partials/'
}));

//set the view engine is .hbs
app.set('view engine', '.hbs');
// default ./view
//app.set('views',viewPath)

/* true: if cache exists, it won't recompile           
 * false: compiles everytime, and won't store in cache 
 *
 * for development, disenable is good, but for efficiency, you should enable cache
 */
app.set('view cache', true);


/* 
  cookie :{
    connect.sid : s:{sessionID}.{hmac-sha256(sessionID, secret)}
  }
  session middleware 
*/
app.use(session({
    secret: 'welcome suitme',
    store: new redisStore({
      client: redisClient,
      prefix: 'suitme',
      ttl: 60*60
    }),
    saveUninitialized: false,
    resave: false
}));
app.use((req, res, next) =>{
  if (!req.session) {
    return next(new Error('oh no')) // handle error
  }
  next() // otherwise continue
})
app.use(express.static(__dirname + '/public'));

//The express.json() and express.urlencoded() middleware have been added to provide request body parsing support.
/*
    When extended is set to false, it's parsed by query-string library. The object returned by querystring.parse() method does not 
    phototypically inherit from JavaScript Object. This means typicalObject methods will not work; that is, the object has null phototype.
    Use JSON.stringify() transforms any object into json string {" ": " "}, and use JSON.parse() transforms into javscript object.

    When extended is set to false, it's parsed by qs library.
    However, query-string.parse() can't resolve multiple levels, and qs.parse() only reslove at least five levels.Therefore, use JSON.stringify()
    and JSON.parse().

*/
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

function sessExist(req, res, next) {
  if(typeof req.session.user === 'undefined') {
    res.redirect(303, '/login');
  } else {
    next();
  }
};

//------------post--api---------------
//  such as restful api
app.post('/selectStore', (req, res)=> {
  const selectedstore = JSON.parse(JSON.stringify(req.body));

  if(typeof req.session.shop === 'undefined'){
    req.session.shop = selectedstore;
  }
  else if(selectedstore.ShopName !== req.session.shop.ShopName){
    delete req.session.shop;
    req.session.shop = selectedstore;
  }
  res.status(200).send({
    redirectUrl: '/venderHome'
  });
});

/* login restful api */
app.post('/login',(req, res)=>{
  let login = JSON.parse(JSON.stringify(req.body));
  console.log(login);
  /* if haven't loged in */
  if((typeof Object.keys(login)[0] === 'string')&&(Object.keys(login)[0] == 'Choice')) {
    //req.session.location = req.body.Choice;
    res.status(200).send({succLogin: false, redirectUrl: '/login'});
  }
  else {
    userdb.GetAccountCheck('account',{
      account: login.account,
      password: login.password
    }, (error, data)=>{
      console.log('login post api testing for myGetAccountCheck');
      console.log(data);
      if ( typeof data !== 'undefined' ) {
        req.session.user = data[0];
        if((typeof req.session.hour === 'string')&&(req.session.hour == 'beforelog')) {
          res.status(200).send({succLogin: true, redirectUrl: '/bookHome'});
        }
        else if((typeof req.session.hour === 'string')&&(req.session.hour == 'afterlog'))  {
          if((typeof req.session.location === 'string')&&( req.session.location == 'afterServiceSel')) {
            res.status(200).send({succLogin: true, redirectUrl: '/afterService'});
          }
          else{
            res.status(200).send({succLogin: true, redirectUrl: '/suitProcess'});
          }
        }
        else {
          res.status(200).send({succLogin: true, redirectUrl: '/bookHome'});
        }
      // else, login faill, redirect to /login_page
      } else {
        res.status(200).send({succLogin: false, redirectUrl: '/login'});
      }
    });
  }
});

app.post('/logout', (req, res) =>{
  if (req.session.user) {
    delete req.session.user;
    res.status(200).send({
        redirectUrl: '/login'
    });

  } else {
    res.status(200).send({
      redirectUrl: '/login'
    });
  }
});

app.post('/register', (req, res)=>{

  console.log('register post api req.body');
  console.log(req.body);
  var account_info = {account: req.body.account}

  /* call google sheet api for checking account exist in db or not*/
  userdb.GetRegisterCheck('account', account_info,(error,reply)=>{
    console.log('register check');

    if (error) {
      console.log('google sheet error');
      res.status(200).send({
        accountDup: true,
        redirectUrl: '/register'
      });
    }

    /* ****************************************
     * if new account doesn't exist in db
     * insert new account info to db
     ******************************************/
    if(typeof reply === 'undefined') {
      let userobj = Object.assign(req.body,{photo:"user.png"})
      userdb.AddSheetData('account', userobj);
      res.status(200).send({
        accountDup: false,
        redirectUrl: '/login'
      });

    /* *****************************************************
     * if account name has existed, return error for client
     * fail to insert new data
     * *****************************************************/
    } else {
      console.log(reply+' is used,please register again ');
      res.status(200).send({
        accountDup: true,
        redirectUrl: '/register'
      });
    }
  });
});
app.post('/forget', (req, res) =>{
  console.log(req.body);
  userdb.GetSheetData('account',JSON.parse(JSON.stringify(req.body)),['email','password'],
    (err,reply) => {
      console.log(reply);
      if(typeof reply !== 'undefined'){
        //send-email
        mail.SendMail(reply[0][0],reply[1][0]);
        res.status(200).send({
          redirectUrl:'/login'
        });
      }
      else{
        console.log('The account does not exist!.');
        res.status(200).send({
          redirectUrl:'/forget'
        });
      }
    }
  );
});
app.post('/bookHome', (req, res)=>{
  const _input = {
    account: req.session.user.account || 'error',
    ShopName: req.body.shop,
    SuitName: req.body.types,
    Style: req.body.cloth,
    Process: '-0-',
    Time: (new Date()).toString()
  };

  console.log(_input);
  userdb.AddSheetData('custom', _input);
  res.status(200).send({
    success: true,
    redirectUrl: '/bookHome'
  });
});
app.post('/afterService',function(req,res) {
  console.log('input feedback'); 
  
  var input = Object.keys(req.body);
  console.log(input);

  //comfirm the identity of the user
  var person ; 
  if(req.session.user) {
    person = req.session.user.nickname;
  }
  else {
    person = "unknown_people";
  }
  //comfirm the shop
  var store ;
  if(req.body.ShopName) {
    store = req.body.ShopName;
  }
  else {
    store = "大帥西服";
  }

  //add data into userdb.js
  if((typeof input[1] === 'string')&&(input[1] == 'Question')){
    const _input = {
      ShopName:store,
      Time:req.body.time,
      UserName:person,
      Question:req.body.Question
    };
    console.log(_input);
    userdb.AddSheetData('question', _input);
  } 
  if((typeof input[1] === 'string')&&(input[1] == 'Evaluation')){
    let str = "-";
    const star = str.concat(req.body.Evaluation,"-");
    const _input = {
      ShopName:store,
      Time:req.body.time,
      UserName:person,
      Evaluation:star,
      Message:req.body.Message
    };
    console.log(_input);
    userdb.AddSheetData('feedback', _input);
  }
  res.status(200).send({
    redirectUrl: '/afterService'
  });
});
app.put('/bookHome', upload.single('file'),  (req, res) => {
  console.log(req.file);
  let userobj = {
    account: req.session.user.account,
    nickname: req.session.user.nickname,
    password: req.session.user.password,
    cellphone: req.session.user.cellphone,
    email: req.session.user.email,
    photo: req.file.filename
  }
  userdb.UpdateSheetData('account', req.session.user, userobj); 
  delete req.session.user;
  res.status(200).send({
    redirectUrl: '/login'
  });
});
app.put('/regModify', (req, res) => {
  console.log(req.session.user);
  
  userdb.UpdateSheetData('account', req.session.user, JSON.parse(JSON.stringify(req.body))); 
  req.session.user = JSON.parse(JSON.stringify(req.body));
  res.status(200);
});
/* GET home page. */
app.get('/', (req, res)=>{
  console.log(req.session);
	res.render('home', {layout: 'main_non_nav'});
});
app.get('/selectStore',(req,res)=>{
  req.session.hour = 'beforelog';
  res.render('select_store', {
    venderSel: true,
    suitSel: false,
    bookSel: false,
    prev: {
      href: '/',
      title: '回上一頁'
    }
  });
});

//first page
app.get('/venderHome', (req, res)=>{
  console.log('venderhome');
  req.session.hour = 'beforelog';
  if(typeof req.session.shop === 'undefined'){
    res.redirect(303, '/selectStore');
  }

  const shop = req.session.shop || {ShopName:'大帥西服'};
  if(typeof req.session.shop.themeImg !== 'undefined' && req.session.shop.themeImg instanceof Array){
    res.render('vender_home', {
      venderSel: true,
      suitSel: false,
      bookSel: false,
      themeImg: {
        left_up: req.session.shop.themeImg[0],
        right_up: req.session.shop.themeImg[1],
        right_mid: req.session.shop.themeImg[2],
        bottom: req.session.shop.themeImg[3]
      },
      prev: {
        href: '/selectStore',
        title: '回上一頁'
      }
    });
  }
  else{
    userdb.GetSheetData(
      'shop_info',
      {ShopName: shop.ShopName},
      ['themeImg'],
      (error, data) =>{
        if (typeof data !== 'undefined' && data[0] instanceof Array) {
          console.log(data[0]);
          req.session.shop.themeImg = data[0];
          res.render('vender_home', {
            venderSel: true,
            suitSel: false,
            bookSel: false,
            themeImg: {
              left_up: data[0][0],
              right_up: data[0][1],
              right_mid: data[0][2],
              bottom: data[0][3]
            },
            prev: {
              href: '/selectStore',
              title: '回上一頁'
            }
          });
        }
      });
  }
});
app.get('/venderHistory', (req, res)=>{
  let result = new Array();
  req.session.hour = 'beforelog';
  const shop = req.session.shop || {ShopName:'大帥西服'};

  if(typeof req.session.shop.history !== 'undefined' && req.session.shop.history instanceof Array){
    for(let i = 0; i < req.session.shop.history.length; i++)
        result.push({paragraph:req.session.shop.history[i]});
    res.render('vender_history', {
      venderSel: true,
      suitSel: false,
      bookSel: false,
      shop_name: shop.ShopName,
      story: result,
      prev: {
        href: '/venderHome',
        title: '回上一頁'
      }
    });
  }
  else{
    userdb.GetSheetData('shop_info', {ShopName: shop.ShopName},
    ['History'], (error,data)=>{
        if(typeof data !== 'undefined'){
          req.session.shop.history = data[0];
          for(i = 0; i < data[0].length; i++)
              result.push({paragraph:data[0][i]});
          res.render('vender_history', {
            venderSel: true,
            suitSel: false,
            bookSel: false,
            shop_name: shop.ShopName,
            story: result,
            prev: {
              href: '/venderHome',
              title: '回上一頁'
            }
          });
        }
        else
          console.log('error!!!');
    });
  }
});
app.get('/shopContact', (req, res)=>{
  let info = new Array();
  req.session.hour = 'beforelog';
  const shop = req.session.shop || {ShopName:'大帥西服'};
  if(typeof req.session.shop.contact !== 'undefined' && req.session.shop.contact instanceof Array){
    res.render('shop_contact', {
      venderSel: true,
      suitSel: false,
      bookSel: false,
      name:req.session.shop.contact[0],
      time:req.session.shop.contact[1],
      telphone:req.session.shop.contact[2],
      address:req.session.shop.contact[3],
      prev: {
        href: '/venderHome',
        title: '回上一頁'
      }
    });
  }
  else{
    userdb.GetSheetData('shop_info', {ShopName: shop.ShopName},
    ['ShopName','OpenTime','Telphone','Address'],(error,data)=>{
        if(typeof data != 'undefined'){
          for(let i = 0; i < 4; i++){
            info.push(data[i][0]);
          }
          req.session.shop.contact = info;
          res.render('shop_contact', {
            venderSel: true,
            suitSel: false,
            bookSel: false,
            name:data[0][0],
            time:data[1][0],
            telphone:data[2][0],
            address:data[3][0],
            prev: {
              href: '/venderHome',
              title: '回上一頁'
            }
          });
        }
        else
          console.log('error!!!');
    });
  }

});
app.get('/cloth', (req, res)=>{
  let result = new Array();
  req.session.hour = 'beforelog';
  const shop = req.session.shop || {ShopName:'大帥西服'};
  if(typeof req.session.shop.cloth !== 'undefined' && req.session.shop.cloth instanceof Array){
    for(let i = 0; i < req.session.shop.cloth.length; i++) {
      result.push({imagine:req.session.shop.cloth[i],index:(i+1).toString()});
    }
    res.render('cloth', {
      venderSel: true,
      suitSel: false,
      bookSel: false,
      clothList: result,
      prev: {
        href: '/venderHome',
        title: '回上一頁'
      }
    });
  }
  else{
    userdb.GetSheetData('shop_info', {ShopName: shop.ShopName},
    ['cloth'],(error,data)=>{
        if(typeof data !== 'undefined'){
          req.session.shop.cloth = data[0];
          for(let i = 0; i < data[0].length; i++) {
            result.push({imagine:data[0][i],index:(i+1).toString()});
          }
          res.render('cloth', {
              venderSel: true,
              suitSel: false,
              bookSel: false,
              clothList: result,
              prev: {
                href: '/venderHome',
                title: '回上一頁'
              }
          });
        }
        else
          console.log('error!!!');
    });
  }

});
app.get('/feedback', (req, res)=>{
  let result = new Array();
  req.session.hour = 'beforelog';
  const shop = req.session.shop || {ShopName:'大帥西服'};

  userdb.GetSheetData('feedback', {ShopName: shop.ShopName},
  ['UserName','Time','Message','Evaluation'],(error,data) => {
      if(typeof data !== 'undefined')  {
        for(let i = 0; i < data[0].length; i++){
          //console.log('feedback: '+data);
          result.push({
            author:data[0][i],
            time:data[1][i],
            message:data[2][i],
            star:data[3][i][1]
          });
        }
        res.render('feedback', {
          venderSel: true,
          suitSel: false,
          bookSel: false,
          comment: result,
          prev: {
            href: '/venderHome',
            title: '回上一頁'
          }
        });
      }
      else
        console.log('error!!!');
    }
  );
});
// second page
app.get('/suitHome', (req, res)=>{
  req.session.hour = 'beforelog';
    res.render('suit_home', {
      venderSel: false,
      suitSel: true,
      bookSel: false,
      prev: {
        href: '/',
        title: '回上一頁'
      }
    });
});
app.get('/suitCategory', (req, res)=>{
  req.session.hour = 'beforelog';
  res.render('suit_category', {
    venderSel: false,
    suitSel: true,
    bookSel: false,
    prev: {
      href: '/suitHome',
      title: '回上一頁'
    }
  });
});
app.get('/suitInfo', (req, res)=>{
  req.session.hour = 'beforelog';
  res.render('suit_info', {
    venderSel: false,
    suitSel: true,
    bookSel: false,
    prev: {
      href: '/suitHome',
      title: '回上一頁'
    }
  });
});

app.get('/suitHistory', (req, res)=>{
  req.session.hour = 'beforelog';
  res.render('suit_history', {
    venderSel: false,
    suitSel: true,
    bookSel: false,
    prev: {
      href: '/suitHome',
      title: '回上一頁'
    }
  });
});
app.get('/bookHome', sessExist, (req, res)=>{
  req.session.hour = 'beforelog';
  if(Object.keys(req.query).length === 0){
    if(typeof req.session.shopList !== 'undefined'){
      res.render('book_home', {
        venderSel: false,
        suitSel: false,
        bookSel: true,
        shopList: req.session.shopList,
        user: {
          name: req.session.user.nickname,
          phone: req.session.user.cellphone,
          photo: req.session.user.photo
        },
        prev: {
          href: '/suitProcess',
          title: '查看訂單'
        }
      });
    }
    else{
      userdb.GetSheetData('shop_info','ALL',['ShopName'],(error, data)=>{
        console.log(data);
        res.render('book_home', {
          venderSel: false,
          suitSel: false,
          bookSel: true,
          shopList: data[0],
          user: {
            name: req.session.user.nickname,
            phone: req.session.user.cellphone,
            photo: req.session.user.photo
          },
          prev: {
            href: '/suitProcess',
            title: '查看訂單'
          }
        });
      });
    }
  }
  else{
    userdb.GetSheetData('shop_info',{ShopName: req.query.shop_id},['suittype','cloth'],(error, data)=>{
      console.log(data);
      res.status(200).send({
        reply: data
      });
    });
  }
});
app.get('/login', (req, res)=>{
  console.log(req.session.hour);
  if (typeof req.session.user !== 'undefined') {
    res.redirect(303,'/bookHome');
  } else{
    if((typeof req.session.hour === 'string') && (req.session.hour === 'beforelog')){
      res.render('login_page', {
        venderSel: false,
        suitSel: false,
        bookSel: true,
        prev: {
          href: '/',
          title: '回上一頁'
        }
      });
    }
    else{
      if((typeof req.session.location === 'string') && (req.session.location === 'processSel')){
        res.render('login_page', {
          layout: 'main_after',
          processSel: true,
          afterServiceSel: false,
          prev: {
            href: '/',
            title: '回上一頁'
          }
        });
      }
      else{
        res.render('login_page', {
          layout: 'main_after',
          processSel: false,
          afterServiceSel: true,
          prev: {
            href: '/',
            title: '回上一頁'
          }
        });
      }
    }
  }
});
app.get('/register', (req, res)=>{
  if (typeof req.session.user !== 'undefined') {
    res.redirect(303,'/bookHome');
  } else {
    res.render('register',{
      venderSel: false,
      suitSel: false,
      bookSel: true,
      prev: {
        href: '/login',
        title: '回上一頁'
      }
    });
  }
});
app.get('/forget', (req, res)=>{
  res.render('forget', {
    venderSel: false,
    suitSel: false,
    bookSel: true,
    prev: {
      href: '/login',
      title: '回上一頁'
    }
  });
});
app.get('/regModify', sessExist, (req, res)=> {
  if (typeof req.session.user === 'undefined') {
    res.redirect(303,'/login');
  }
  else{
    res.render('regModify', {
      venderSel: false,
      suitSel: false,
      bookSel: true,
      userInfo: {
        account: req.session.user.account,
        nickname: req.session.user.nickname,
        password: req.session.user.password,
        cellphone: req.session.user.cellphone,
        email: req.session.user.email
      },
      prev: {
        href: '/bookHome',
        title: '回上一頁'
      }
    });
  }
    
});
app.get('/suitProcess', (req, res)=>{
  console.log('suitprocess');
  req.session.hour = 'afterlog';
  req.session.location = 'processSel';
  //if people have yet logined in, ask to login. 
  if (typeof req.session.user !== 'undefined') {
    userdb.GetSheetData('custom',
      {account: req.session.user.account},
      ['ShopName','SuitName', 'Process'],
      (error, data)=>{
        var optionList = [],
          processList = "";

        if(typeof data === 'object') {
          var _processArray = [];
          for (i in data[0]) {
            var tmpt = new Array(7)
              .fill(0)
              .fill(1,0, parseInt(data[2][i].substring(1,2)));

            optionList.push({
              index:i,
              item:data[0][i]+' '+data[1][i]
            });
            _processArray.push(tmpt);
          }
          processList = JSON.stringify(_processArray);
        } else {
          optionList = [];
          processList = "null";
        }
        res.render('suit_process', {
          layout: 'main_after',
          processSel: true,
          afterServiceSel: false,
          prev:{
            href: '/',
            title: '回上一頁'
          },
          optionList: optionList,
          processList: processList
        });
      }
    );
  }
  else  {
    res.redirect(303,'/login');
  }
});
app.get('/afterService', (req, res)=>{
  console.log('afterservice');
  req.session.hour = 'afterlog';
  req.session.location = 'afterServiceSel';
  //if people have yet logined in, ask to login.
  if (typeof req.session.user !== 'undefined')  {
    if(typeof req.session.shopList !== 'undefined'){
      res.render('after_service', {
        layout: 'main_after',
        processSel: false,
        afterServiceSel: true,
        shopList:req.session.shopList,
        prev: {
          href: '/',
          title: '回上一頁'
        }
      });
    }
    else{
      userdb.GetSheetData('shop_info', "ALL",
      ['ShopName'],(error, data)=>{
        req.session.shopList = data[0];
        res.render('after_service', {
          layout: 'main_after',
          processSel: false,
          afterServiceSel: true,
          shopList: data[0],
          prev: {
            href: '/',
            title: '回上一頁'
          }
        });
      });
    }
    
  }
  else {
    res.redirect(303,'/login');
  }
});

app.use((req, res, next) => {
    res.status(404);
    res.render('404',{
      layout: 'main_non_nav'
    });
})
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500);
	res.render('500',{
    layout: 'main_non_nav'
  });
})
// 在port聆聽request
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

// const server = http.createServer(function (req, res) {
//   //設定回應為text文件，並回應 Hello World!
//   res.writeHead(200,{'Content-Type':'text/plain'})
//   res.end('Hello World!')
// })

// //設定服務監聽localhost:3000(127.0.0.1/:3000)
// server.listen('3000', function () {  
//   console.log('server start on 3000 port')
// })