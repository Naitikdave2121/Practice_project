const mongoose = require("mongoose");


const rejectSchema = new mongoose.Schema({
    name:{
        type:String
    },
    email:{
        type:String
    },
    phone:{
        type:Number
    },
    guests:{
        type:String
    },
    date:{
        type:String
    },
    time:{
        type:String
    },
    status:{
        type:String
    }
});


const  Reject = new mongoose.model("rejectReqest",rejectSchema);
module.exports = Reject;