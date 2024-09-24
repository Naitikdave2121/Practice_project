const mongoose=require("mongoose");

const dinnerSchema = new mongoose.Schema({
    dinner_name:{
        type:String
    },
    price:{
        type:Number
    },
    description:{
        type:String
    },
    dinner_image:{
        type:String
    }
});

const dinner = new mongoose.model("dinner",dinnerSchema);
module.exports = dinner;