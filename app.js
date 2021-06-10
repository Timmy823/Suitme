//透過http模組啟動web server服務
const http = require('http');
var express = require('express');
var exphbs = require('express-handlebars');
var session = require('express-session');
var redis = require('redis');
var redisStore = require('connect-redis')(session);

var userdb = require('./lib/userdb.js');
var mail = require('./lib/mail.js');

const port = 5000
var app = express();
var redisClient = redis.createClient();

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


app.use(session({
    secret: 'helloworld something terrible and oh no',
    store: new redisStore({
      client: redisClient,
      ttl: 30*24*60*60
    }),
    saveUninitialized: false,
    resave: false
}));
// app.use(function (req, res, next) {
//   if (!req.session) {
//     return next(new Error('oh no')) // handle error
//   }
//   next() // otherwise continue
// })
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
//The choice of before_reservation and after_reservation
app.post('/beforeAfter',(req, res) =>{
  req.session.hour = req.body.Moment; //record the choose of that
  if((typeof req.session.hour === 'string')&&(req.session.hour == 'beforelog'))  {
    res.status(200).send({
      redirectUrl: '/selectStore'
    });
  }
  else if((typeof req.session.hour === 'string')&&(req.session.hour == 'afterlog')) {
    res.status(200).send({
      redirectUrl: '/suitProcess'
    });
  }
  else{ 
    res.status(200).send({
      redirectUrl: '/selectStore'
    });
  }
});
//  such as restful api
app.post('/selectStore', (req, res)=> {
  req.session.shop = JSON.parse(JSON.stringify(req.body));
  console.log(req.session);
  res.status(200).send({
    redirectUrl: '/venderHome'
  });
});

/* login restful api */
app.post('/login',(req, res)=>{
  var login = JSON.parse(JSON.stringify(req.body));
  console.log(login);
  /* if haven't loged in */
  if((typeof Object.keys(login)[0] === 'string')&&(Object.keys(login)[0] == 'Choice')) {
    req.session.afterMenu = req.body.Choice;
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
        req.session.user = data;
        if((typeof req.session.hour === 'string')&&(req.session.hour == 'beforelog')) {
          res.status(200).send({succLogin: true, redirectUrl: '/bookhome'});
        }
        else if((typeof req.session.hour === 'string')&&(req.session.hour == 'afterlog'))  {
          if((typeof req.session.afterMenu === 'string')&&( req.session.afterMenu == 'service')) {
            res.status(200).send({succLogin: true, redirectUrl: '/afterService'});
          }
          else{
            res.status(200).send({succLogin: true, redirectUrl: '/suitProcess'});
          }
        }
        else {
          res.status(200).send({succLogin: true, redirectUrl: '/bookhome'});
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
    req.session.destroy(()=>{
      res.status(200).send({
        redirectUrl: '/login'
      });

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
      userdb.AddSheetData('account', req.body);
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
  userdb.GetSheetData('account',JSON.parse(req.body),['email','password'],
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
app.post('/regModify', (req, res) => {
  console.log(req.session.user);
  
  userdb.UpdateSheetData('account', req.session.user, JSON.parse(JSON.stringify(req.body)), (err)=>{
    req.session.user = JSON.parse(JSON.stringify(req.body));
    res.status(200).send({
      successUpdate: true,
    });
  });

});
/* GET home page. */
app.get('/', (req, res)=>{
	res.render('home', {layout: 'main_non_nav'});
});
app.get('/selectStore',(req,res)=>{
  res.render('select_store', { 
    venderSel: true,
    suitSel: false,
    bookSel: false,
    prev: {
      href: '/',
      title: 'beforeAfter'
    }
  });
});

//first page
app.get('/venderHome', (req, res)=>{

  console.log('venderhome');
  console.log(req.session);
  var shop = req.session.shop || {ShopName:'大帥西服'};

  userdb.GetSheetData(
    'shop_info',
    shop,
    ['themeImg'],
    (error, data) =>{
      if (typeof data !== 'undefined' && data[0] instanceof Array) {
        console.log(data[0]);

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
            href: '/',
            title: 'beforeAfter'
          }
        });
      }
    }
  );

});
app.get('/venderHistory', (req, res)=>{
  var result = [];
  console.log(req.session.shop)
  var shop = req.session.shop || {ShopName:'大帥西服'};
  userdb.GetSheetData('shop_info', shop,
    ['History'], (error,data)=>{
        if(typeof data !== 'undefined'){
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
              title: 'venderHome'
            }
          });
        }
        else
          console.log('error!!!');
      }
  );
});
app.get('/shopContact', (req, res)=>{
var shop = req.session.shop || {ShopName:'大帥西服'};
userdb.GetSheetData('shop_info', shop,
  ['ShopName','OpenTime','Telphone','Address'],(error,data)=>{
      if(typeof data != 'undefined'){
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
            title: 'venderHome'
          }
        });
      }
      else
        console.log('error!!!');
    }
);
});
app.get('/cloth', (req, res)=>{
  var result = [];
  var shop = req.session.shop || {ShopName:'大帥西服'};
  console.log(shop);
  userdb.GetSheetData('shop_info', shop,
    ['cloth'],(error,data)=>{
        if(typeof data !== 'undefined'){
          for(i = 0; i < data[0].length; i++) {
            result.push({imagine:data[0][i],index:(i+1).toString()});
          }
          res.render('cloth', {
              venderSel: true,
              suitSel: false,
              bookSel: false,
              clothList: result,
              prev: {
                href: '/venderHome',
                title: 'venderHome'
              }
          });
        }
        else
          console.log('error!!!');
    }
  );
});
app.get('/feedback', (req, res)=>{
  var result = [];
  var shop = req.session.shop || {ShopName:'大帥西服'};

  userdb.GetSheetData('feedback', shop,
  ['UserName','Time','Message','Evaluation'],(error,data) => {
      if(typeof data !== 'undefined')  {
        for(i = 0; i < data[0].length; i++){
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
            title: 'venderHome'
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
    res.render('suit_home', {
      venderSel: false,
      suitSel: true,
      bookSel: false,
      prev: {
        href: '/',
        title: 'beforeAfter'
      }
    });
});
app.get('/suitCategory', (req, res)=>{
  res.render('suit_category', {
    venderSel: false,
    suitSel: true,
    bookSel: false,
    prev: {
      href: '/suitHome',
      title: 'suitHome'
    }
  });
});
app.get('/suitInfo', (req, res)=>{
  res.render('suit_info', {
    venderSel: false,
    suitSel: true,
    bookSel: false,
    prev: {
      href: '/suitHome',
      title: 'suitHome'
    }
  });
});

app.get('/suitHistory', (req, res)=>{
  res.render('suit_history', {
    venderSel: false,
    suitSel: true,
    bookSel: false,
    prev: {
      href: '/suitHome',
      title: 'suitHome'
    }
  });
});
app.get('/bookHome', sessExist, (req, res)=>{
  userdb.GetSheetData('shop_info','ALL',
    ['ShopName'],
    function(error, data){
      console.log('data');
      console.log(data[0]);
      res.render('book_home', {
        venderSel: false,
        suitSel: false,
        bookSel: true,
        shopList: data[0],
        user: {
          name: req.session.user.nickname,
          phone: req.session.user.cellphone
        }
      });
    }
  );
});
app.get('/login', (req, res)=>{
  if (typeof req.session.user !== 'undefined') {
    res.redirect(303,'/bookHome');
  } else{
    res.render('login_page', {
      venderSel: false,
      suitSel: false,
      bookSel: true,
      prev: {
        href: '/',
        title: 'beforeAfter'
      }
    });
  }
});
app.get('/register', function(req, res) {
  if (typeof req.session.user !== 'undefined') {
    res.redirect(303,'/bookhome');
  } else {
    res.render('register',{
      venderSel: false,
      suitSel: false,
      bookSel: true,
      prev: {
        href: '/login',
        title: 'login'
      }
    });
  }
});
app.get('/forget', function(req, res) {
  res.render('forget', {
    venderSel: false,
    suitSel: false,
    bookSel: true,
    prev: {
      href: '/login',
      title: 'login'
    }
  });
});
app.get('/regModify', sessExist, (req, res)=> {
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
          href: '/bookhome',
          title: 'bookhome'
        }
      });
});
app.get('/suitProcess', (req, res)=>{
  console.log('suitprocess');
  //if people have yet logined in, ask to login. 
  if (typeof req.session.user !== 'undefined') {
    userdb.GetSheetData('custom',
      {account: req.session.user.account},
      ['ShopName','SuitName', 'Process'],
      function(error, data) {
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
            href: '/beforeAfter',
            title: 'beforeAfter'
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
  //if people have yet logined in, ask to login.
  if (typeof req.session.user !== 'undefined')  {
    userdb.GetSheetData('shop_info', "ALL",
      ['ShopName'],
      function(error, data){
        res.render('after_service', {
          layout: 'main_after',
          processSel: false,
          afterServiceSel: true,
          shopList: data[0],
          prev: {
            href: '/beforeAfter',
            title: 'beforeAfter'
          }
        });
      }
    );
  }
  else {
    res.redirect(303,'/login');
  }
});

app.use((req, res, next) => {
    res.status(404);
    res.render('404');
})
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500);
	res.render('500');
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