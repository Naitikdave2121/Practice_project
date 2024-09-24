require('dotenv').config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


const employeeSchema = new mongoose.Schema({
    name:{
        type:String,
        // required:true
    },
    email:{
        type:String,
    },
    password:{
        type:String,
        // required:true
    },
    phone:{
        type:Number,
        // required:true
    },
    // number_people:{
    //     type:String,
    //     // required:true
    // },
    image:{
        type:String
    },
    otp:{
        type:Number,
    },
    tokens:[{
        token:{
            type:String
        }
    }]
});


employeeSchema.methods.generateAuthToken = async function(){
   try {
        console.log(this._id);
        const token = jwt.sign({_id:this._id.toString()},process.env.SECRET_KEY);
        this.tokens = this.tokens.concat({token:token});
        await this.save();
        console.log("schema token"+ token);
        return token;

   } catch (error) {
     console.log(error);
   }
}


employeeSchema.pre("save",async function(next){
    if(this.isModified("password"))
    {
        console.log(`the current password is ${this.password}`);
        this.password = await bcrypt.hash(this.password, 10);
        console.log(`the current password is ${this.password}`);
     }
        next();
})

const  Register = new mongoose.model("Data",employeeSchema);
module.exports = Register;