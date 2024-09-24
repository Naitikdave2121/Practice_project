const mongoose=require("mongoose");

const lunchSchema = new mongoose.Schema({
    lunch_name:{
        type:String
    },
    price:{
        type:Number
    },
    description:{
        type:String
    },
    lunch_image:{
        type:String
    }
});

const lunch = new mongoose.model("lunch",lunchSchema);
module.exports = lunch;