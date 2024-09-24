const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({
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
        type:String,
    },
    time:{
        type:String
    }
    // message:{
    //     type:String
    // }
});

const Reservation = new mongoose.model("reservation",reservationSchema);
module.exports = Reservation;