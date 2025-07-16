const mongoose = require("mongoose")
const SignSchema =new mongoose.Schema({
    name:{
        type:String,
        require:true,
    },
    email:{
        type:String,
        require:true
    },
    password:{
        type:String,
        require:true
    },
    address:{
        type:String,
        require:true
    },
    pin:{
        type:Number,
        require:true
    }

})

const Sign = mongoose.model("Sign",SignSchema)
module.exports=Sign