const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const {ObjectId} = require('mongodb');
app.use(bodyParser.urlencoded({extended : true}));
const MongoClient = require('mongodb').MongoClient;
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
app.set('view engine','ejs');
app.use('/public', express.static('public'));
require('dotenv').config()



var db;
  MongoClient.connect(process.env.DB_URL, function(err, client){
  if (err) return console.log(err)
  db = client.db('dj');
  app.listen(process.env.PORT, function() {
    console.log('listening on 8080')
  })
}) 


app.get('/', function( req, res) { 
  res.render('index.ejs')
});

app.get('/list',function (req,res){
  db.collection('post').find().toArray(function(error, result){
    //console.log(result);

    res.render('list.ejs',{ posts : result});
  });
});

app.get('/search',(req,res) => {
  // new Date(); date data;
  var searchCondition = [
    {
      $search : {
        index: 'titleSearch',
        text: {
          query: req.query.value,
          path: 'title'  // 찾고 싶은 path ['제목','날짜'] 둘다 가능.
        }
      }
    }
    // { $project : {제목: 1, _id: 0, score: { $meta: "searchScore"}}}
  ]
    db.collection('post').aggregate(searchCondition)
    .toArray((error,result) => {
      console.log(result);
      res.render('search.ejs',{ posts : result})
    })
});


app.get('/detail/:id', function (req,res){
  db.collection('post').findOne({_id : parseInt(req.params.id)},function (error,result){
    console.log(result);
    res.render('detail.ejs',{ data : result });
  })
});

app.get('/edit/:id',function (req, res){
  db.collection('post').findOne({_id : parseInt(req.params.id)},function(error, result){
    console.log(result);
    res.render('edit.ejs', { post : result})
  })
});

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/login', function (req,res){
  res.render('login.ejs')
});

app.post('/login', passport.authenticate('local', {
  failureRedirect : '/fail'
}), function (req,res){
  res.redirect('/')
});

app.get('/mypage', login, function (req, res){
  console.log(req.user);
  res.render('mypage.ejs', {사용자 : req.user})
});

function login(req, res, next){
  if (req.user){
    next()
  } else {
    res.send('you didnt log on this page')
  }
};


passport.use(new LocalStrategy({
  usernameField: 'id',
  passwordField: 'pw',
  session: true,
  passReqToCallback: false,
}, function (입력한아이디, 입력한비번, done) {
  //console.log(입력한아이디, 입력한비번);
  db.collection('login').findOne({ id: 입력한아이디 }, function (error, result) {
    if (error) return done(error)
    
    if (!result) return done(null, false, { message: '존재하지않는 아이디요' })
    if (입력한비번 == result.pw) {
      return done(null, result)
    } else {
      return done(null, false, { message: '비번틀렸어요' })
    }
  })
}));

passport.serializeUser(function (user, done) {
  done(null, user.id)
});
passport.deserializeUser(function (아이디, done) {
  db.collection('login').findOne({id : 아이디}, function (error, result){
    done(null, result)
  })
});


app.post('/register', (req,res) => {
  db.collection('login').insertOne({ id : req.body.id, pw : req.body.pw }, (error, result) => {
    res.redirect('/')
  })
});

app.get('/write', function(req, res) { 
  res.render('write.ejs')
});

app.post('/add', function(req,res){
res.send('complete');
db.collection('counter').findOne({name : '게시물갯수'},function (error, result ){
  console.log(result.totalPost);
  var 총게시물갯수 = result.totalPost;

  var save ={_id : 총게시물갯수 + 1, title : req.body.title, date : req.body.date, writer: req.user._id}
  db.collection('post').insertOne(save, function (error,result){
    console.log('complete');
    db.collection('counter').updateOne({name:'게시물갯수'},{ $inc : {totalPost:1} },function(error, result){
      if(error){return console.log(error)}
    });
  });
});
});

app.delete('/delete',function(req,res){
  console.log('delete requested')
  console.log(req.body);
  req.body._id = parseInt(req.body._id);

  var deleteData = {_id: req.body._id, writer: req.user._id}

  db.collection('post').deleteOne(deleteData,function(error,result){
    console.log('delete complete');
    if (error) {console.log(error)};
    res.status(200).send({message : 'complete'});
  });
});

app.use('/shop', require('./routes/shop.js'));

app.use('/board/sub', require('./routes/board.js'));

var path = require('path');

let multer = require('multer');
var storage = multer.diskStorage({
  destination:function(req, file, cb){
    cb(null, './public/img')
  },
  filename:function(req,file,cb){
    cb(null, file.originalname + '날짜:'+ new Date())
  }
  
});




app.post('/chatroom',login,(req,res)=>{

  var 저장할거 = {
    title:'무슨무슨채팅방',
    member: [ObjectId(req.body.당한사람id),req.user._id],
    date: new Date()
  }
  db.collection('chatroom').insertOne(저장할거).then((result)=>{
    res.send('complete');
  })
})

app.get('/chat', login, (req,res)=>{

  db.collection('chatroom').find({member : req.user._id}).toArray().then((result)=>{

    res.render('chat.ejs', {data : result})
  })
});

app.post('/message', login, function(req,res){

  var 저장할거 = {
    parent : req.body.parent,
    content : req.body.content,
    userid : req.user._id,
    date : new Date() 
  }
  db.collection('message').insertOne(저장할거).then(()=>{
    console.log('db저장 성공');
    res.send('db저장성공');
  }).catch(()=>{
    console.log('실패');
  })
})

var upload = multer({
  storage: storage,
  fileFilter: function (req, file, callback) {
      var ext = path.extname(file.originalname);
      if(ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
          return callback(new Error('PNG, JPG만 업로드하세요'))
      }
      callback(null, true)
  }, 
  limits:{
      fileSize: 1024 * 1024
  }
});

app.get('/upload', (req,res)=>{
  res.render('upload.ejs')
})

app.post('/upload', upload.single('profile') ,function(req, res){
  res.send('uploaded') 
});

app.get('/img/:imageName', (req,res)=>{
  req.sendFile( __dirname + '/public/img/' + req.params.imageName)
});

app.get('/message/:id', login, function(req,res) {

  res.writeHead(200, {
    "Connection": "keep-alive",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache", 
  });

  db.collection('message').find({ parent : req.params.id}).toArray()
  .then((result)=>{
    res.write('event: test\n');
    res.write('data: ' + JSON.stringify(result) + '\n\n');
  })

  const pipeline = [
    { $match: { 'fullDocument.parent' : req.params.id } }
  ];

  const collection = db.collection('message');
  const changeStream = collection.watch(pipeline);
  changeStream.on('change', (result)=>{
    res.write('event: test\n');
    res.write('data: ' + JSON.stringify([result.fullDocument]) + '\n\n');
  });
  
});

// app.post('/upload', upload.single('profile') ,function(req, res){
//   res.send('uploaded') 사진 하나만 받고 싶을 때 여러개는 array('이름', 개수)
// });


// app.get('/shop/shirts',(req,res) => {
//   res.send('shirts page');
// });
// app.get('/shop/pants',(req,res) => {
//   res.send('pants page');
// });





