const mongoose=require("mongoose")
const FeedbackSchema= new mongoose.Schema({
    name:{
        type:String,
         required:true
    },
    email:{
        type:String,
         required:true
    },
    rating:{
        type:String,
        required:true
    },
    feedbackType:{
        type:String,
        required:true,
    },
    message:{
        type:String,
     
    }
})

const Feedback = mongoose.model("Feedback",FeedbackSchema);
module.exports = Feedback;