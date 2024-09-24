const mongoose = require("mongoose");


const statusSchema = new mongoose.Schema({
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
    // message:{
    //     type:String
    // },
    status:{
        type:String
    }
});


const  Status = new mongoose.model("status",statusSchema);
module.exports = Status;