//Level 1 Storing direct Password

require("dotenv").config() ///Level 3
const express=require("express")
const md5=require("md5")
const bp=require("body-parser")
const ejs=require("ejs")
const mongoose=require("mongoose")
// const bcrypt=require("bcrypt") ///level 4
const session=require("express-session")
const passport=require("passport")
const passportMongoose=require("passport-local-mongoose")
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')
// const saltRounds=10
// const encrypt=require("mongoose-encryption") ///Level 2
const app=express()
app.use(session({
    secret:process.env.NAME,
    resave:false,
    saveUninitialized:false
}))

app.use(passport.initialize())
app.use(passport.session())

mongoose.connect("mongodb://localhost:27017/userDB")
const mySchema=new mongoose.Schema({
    Username:{
        type:String,
    },
    password:{
        type:String,
    },
    googleId:String
})

mySchema.plugin(passportMongoose);
mySchema.plugin(findOrCreate);
// mySchema.plugin(encrypt,{secret:process.env.NAME,encryptedFields: ['password']})
const user=mongoose.model("user",mySchema)

passport.use(user.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(function(user, done) {
done(null, user);
});

passport.deserializeUser(function(user, done) {
done(null, user);
});
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile)
    user.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.use(bp.urlencoded({
    extended:true
}))
app.use(express.static("public"))
app.set('view engine','ejs')

app.get("/",function(req,res){
    res.render("home")
})

app.get('/auth/google', 
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

app.get("/register",function(req,res){
    res.render("register")
})

app.get("/secrets",function(req,res){
    if(req.isAuthenticated()){
        res.render("secrets")
    }else{
        res.redirect("/login")
    }
    
})
app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.post("/register",function(req,res){
    // bcrypt.hash(req.body.password,saltRounds,function(err,hash){
    //     let shash=hash
    //     const newUser=new user({
    //         Username:req.body.username,
    //         password:hash
    //     })
    //     newUser.save(function(err){
    //         if(err){
    //             console.log(err)
    //         }else{
    //             res.render("secrets")
    //         }
    //     })
    // })
    user.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err)
            res.redirect("/register")
        }else{
            passport.authenticate('local')(req,res,function(){
                res.redirect('/secrets');
            })
        }
    })
})

app.get("/login",function(req,res){
    res.render("login")
})
app.post("/login",function(req,res){
    //////////////////////One way/////////////////
    // user.findOne({$and:[{Username:req.body.username},{password:req.body.password}]},function(err,result){
    //     if(result){
    //         res.render("secrets")
    //     }
    //     else{
    //         res.send("Register First")
    //     }
    // })

    /////////////////Second Way////////////////////

    // user.findOne({Username:req.body.username},function(err,result){
    //     // console.log(result.password)
    //     if(result){
    //         bcrypt.compare(req.body.password,result.password,function(err,result){
    //             if(result === true){
    //                 res.render("secrets")
    //             }
    //             else{
    //                 res.send("You Entered Wrong Password")
    //             }
    //         })
    //     }
    //     else{
    //         res.send("Register First")
    //     }
    // })


    const User=new user({
        Username:req.body.username,
        password:req.body.password
    })

    req.logIn(User,function(err){
        if(err){
            console.log(err)
            res.redirect("/login")
        }else{
            passport.authenticate('local')(req,res,function(){
                res.redirect('/secrets');
            })
        }
    })
})

app.get("/logout",function(req,res){
    req.logOut(function(err){
        if(err){
            console.log(err)
        }else{
            res.redirect("/")
        }
    })
})

app.listen(3000,function(){
    console.log("Server started at port 3000")
})