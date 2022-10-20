require("dotenv").config()
const express=require("express")
const md5=require("md5")
const bp=require("body-parser")
const ejs=require("ejs")
const mongoose=require("mongoose")
const encrypt=require("mongoose-encryption")
mongoose.connect("mongodb://localhost:27017/userDB")
const mySchema=new mongoose.Schema({
    Username:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    }
})


// mySchema.plugin(encrypt,{secret:process.env.NAME,encryptedFields: ['password']})
const user=mongoose.model("user",mySchema)

const app=express()

app.use(bp.urlencoded({
    extended:true
}))
app.use(express.static("public"))
app.set('view engine','ejs')

app.get("/",function(req,res){
    res.render("home")
})
app.get("/register",function(req,res){
    res.render("register")
})

app.post("/register",function(req,res){
    const newUser=new user({
        Username:req.body.username,
        password:md5(req.body.password)
    })
    newUser.save(function(err){
        if(err){
            console.log(err)
        }else{
            res.render("secrets")
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

    user.findOne({Username:req.body.username},function(err,result){
        // console.log(result.password)
        if(result){
            if(result.password === md5(req.body.password)){
                res.render("secrets")
            }
            else{
                res.send("You Entered Wrong Password")
            }
        }
        else{
            res.send("Register First")
        }
    })
})

app.listen(3000,function(){
    console.log("Server started at port 3000")
})