const mongoose=require("mongoose");

const chefSchema = new mongoose.Schema({
    chef_name:{
        type:String
    },
    chef_role:{
        type:String
    },
    chef_image:{
        type:String
    }
});

const chef = new mongoose.model("chef",chefSchema);
module.exports = chef;