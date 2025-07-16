const mongoose = require("mongoose")
const HelpSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    contact:{
        type:String,
        required:true
    },
    type:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    locations:{
        type:String,
        required:true
    },
     userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    // ref: "Sign", // optional but good if referencing the User model
  },
})

const Help = mongoose.model("Help",HelpSchema);
module.exports=Help;