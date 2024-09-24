const mongoose=require("mongoose");

const bfschema = new mongoose.Schema({
    breakfast_name:{
        type:String
    },
    price:{
        type:Number
    },
    description:{
        type:String
    },
    breakfast_image:{
        type:String
    }
});

const breakfast = new mongoose.model("breakfast",bfschema);
module.exports = breakfast;