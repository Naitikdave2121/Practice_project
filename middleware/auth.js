const jwt = require("jsonwebtoken");
const Register = require("../models/register");


const auth = async (req, res, next )=>{
    try {
        const token = req.cookies.jwt;
        const verifyUser= jwt.verify(token, process.env.SECRET_KEY);
        console.log("verifying user token "+verifyUser);

        const user = await Register.findOne({_id:verifyUser._id});
        console.log("verified user "+user.name);
        // res.render("admin",{username:user});
        req.token = token;
        req.user = user;

        next();

    } catch (error) {
        res.status(401).send(error)
    }
}
// const auth = async (req, res, next)=>{
//     try {
//         const token = req.cookies.jwt;
//         const verifyUser = jwt.verify.apply(token, process.env.SECRET_KEY);
//         console.log(verifyUser);

//         const user = await Register.findOne({_id:verifyUser._id});
//         console.log(user.name);
//         // req.token = token;
//         // req.user = user;
        
//         next();

//     } catch (error) {
//         res.status(401).send(error);
//     }
// }

module.exports = auth;