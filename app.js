var express = require("express"),
    mongoose = require("mongoose"),
    bodyParser = require("body-parser"),
    User = require("./models/user"),
    passport = require("passport"),
    MongoClient = require("mongodb").MongoClient;
    LocalStrategy = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose");

const { userInfo } = require("os");
var path = require('path');
    
mongoose.connect("mongodb://localhost:27017/auth_demo_app", { useNewUrlParser: true });    
var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use('/styles', express.static('styles'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(require("express-session")({
    secret:"War Machine is the best",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/login_page', function(req, res){
  res.render('login_page');
});

app.get('/', function(req, res){
  res.render('login_page'); 
});

app.post("/login_page", passport.authenticate("local",{
    successRedirect: "/home_page",
    failureRedirect: "/login_page"
}), function(req, res){ 
});

app.get('/home_page', function(req, res, next){
    MongoClient.connect('mongodb://localhost:27017',{
		useUnifiedTopology:true
	}, function(err,client){
        if(err) throw err;
        var quantity = parseInt(req.body.no);
        const db = client.db('auth_demo_app');
        db.collection('buyers').find({Username: req.user.username}).toArray(function(err,objs){ 
            var total = 0;
            for(var i = 0; i < objs.length; ++i){
                total = total + (objs[i].Quantity * objs[i].Price);
            }
            Number(total.toFixed(2));
			res.render('home_page', {objs: objs, total: total});
		});
	});
});

app.get('/quote', function(req, res){
    res.render('quote');
});

app.post("/quote", function(req,res){
	MongoClient.connect('mongodb://localhost:27017',{
		useUnifiedTopology:true
	}, function(err,client){
		if(err) throw err;
		const db = client.db('auth_demo_app');
		db.collection('stocks').findOne({Symbol: req.body.sym},function(err,obj){
            res.render('quote', {obj: obj});
		});
	});
});

app.get('/buy', function(req, res){
    res.render('buy');
});

app.post('/buy', function(req, res){
    console.log(req.user.username);
    MongoClient.connect('mongodb://localhost:27017',{
		useUnifiedTopology:true
	}, function(err,client){
        if(err) throw err;
        var quantity = parseInt(req.body.no);
        const db = client.db('auth_demo_app');
        db.collection('stocks').findOne({Symbol: req.body.sym},function(err,obj){
			db.collection('buyers').insertOne({Username: req.user.username, Quantity: quantity, Symbols: obj.Symbol, Name: obj.Name, Sector: obj.Sector, Price: obj.Price},function(err,obj){
                res.render('buy', {msg: "Bought!!"});
            });
		});
	});
});

app.get('/create_new_acc', function(req, res){
    res.render('create_new_acc');
});

app.post("/create_new_acc", function(req, res){
    console.log(req.body.username);
    console.log(req.body.password);
    User.register(new User({username: req.body.username, question: req.body.question}), req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("create_new_acc");
        }
        passport.authenticate("local")(req, res, function(){
            res.redirect("/home_page");
        });
    });
});

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login_page");
}

app.listen(3000, function(){
    console.log('Server started listening at port number 3000');
});