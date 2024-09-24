require('dotenv').config();
const exp = require("constants");
const express = require("express");
const app = express();
const path = require("path");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");
var nodemailer = require("nodemailer");
const puppeteer =require("puppeteer");
const port = process.env.PORT || 3000;
require("./db/conn");
const GenOtp = require("./otp/otp");
const Register = require("./models/register");
const Reservation = require("./models/reservation");
const Status = require("./models/status");
const Reject = require("./models/reject");
const Chef = require("./models/chef");
const Breakfast = require("./models/breakfast");
const Lunch = require("./models/lunch");
const Dinner = require("./models/dinner");
const auth = require('./middleware/auth');
const { findById, findByIdAndDelete } = require("./models/chef");

app.use(session({
    secret:'secret',
    cookie:{maxAvg : 60000},
    resave: false,
    saveUninitialized:false
}));
app.use(flash());
app.use(express.json());
app.use(express.urlencoded({extended:false}));
// console.log(process.env.SCRETE_KEY);

var storage=multer.diskStorage({
    destination:'views/image/',
    filename:(req,file,cb)=>{
        cb(null,file.originalname);
    }
})
var upload=multer({
    storage:storage
})

app.set('view engine', 'ejs');
app.use(express.static(__dirname+"/views/"));
app.use(express.static(__dirname+"/views/pdf"));
app.use(cookieParser());
const static_path = path.join(__dirname, "public");
app.use(express.static(static_path));


app.get("/", async (req, res) => {
    try {
        const schef = await Chef.find({});
        const sbk = await Breakfast.find({});
        const slunch = await Lunch.find({});
        const sdinner = await Dinner.find({});
        res.render("index",{chef:schef,bk:sbk,lunch:slunch,dinner:sdinner,reserve:req.flash('reserve')});
    } catch (error) {
        console.log("can not show index..")
    }
});
app.get("/register", (req, res) => {
    res.render("register",{register:req.flash('register')});
});
app.get("/login", (req, res) => {
    res.render("login",{message: req.flash('message'),password: req.flash('password')});
});
app.get("/screte", auth ,(req, res) => {
    //console.log(`screte page cookie ${req.cookies.jwt}`);
    res.render("screte");
});
app.get("/deshboard", auth ,async(req,res)=>{
    const chefNo = await Chef.find().countDocuments();
    const resNo = await Reservation.find().countDocuments();
    const appNo = await Status.find().countDocuments();
    const rejNo = await Reject.find().countDocuments();
    res.render("deshboard",{chef:chefNo,reserve:resNo,approve:appNo,reject:rejNo});

});

app.get("/logout", auth , async(req, res) => {
   try {
        console.log(req.user);

        req.user.tokens = req.user.tokens.filter((currElement)=>{
                return currElement.token !==req.token
        })
        res.clearCookie("jwt");

        //this for logout all devices
        // req.user.tokens = []
        console.log("logout successfull..");
        await req.user.save();
        res.redirect("/login");
       
   } catch (error) {
    res.status(500).send(error)
   }
});
app.get("/profile", auth ,async(req,res)=>{
    try {
        const data = await Register.find({});
        res.render("profile",{data:data});
    } catch (error) {
        console.log(error)
    }
})
app.get("/admin", auth , async(req, res) => {
    res.render("admin");
});
app.get("/approvePdf", async(req,res)=>{
    const data = await Status.find({});
    const date = Date();
    res.render("approvePdf",{pdf:data,dt:date});
})
app.get("/show" , async (req,res)=>{
    try {
        const allData = await Register.find({});
        //res.send({status:"ok", data:allData});
        res.render("show",{data:allData})
    } catch (error) {
        console.log(error);
    }
    
});
app.get("/showReservation", auth,async(req,res)=>{
    try {
        var search = "";
        if(req.query.search)
        {
            search = req.query.search;
        }
        const { page = 1, limit = 4} = req.query;
        const request = await Reservation.find({
            $or:[
                {name:{$regex:'.*'+search+'.*',$options:'i'}},
                {email:{$regex:'.*'+search+'.*',$options:'i'}},
                {guests:{$regex:'.*'+search+'.*',$options:'i'}},
                {date:{$regex:'.*'+search+'.*',$options:'i'}},
                {time:{$regex:'.*'+search+'.*',$options:'i'}}
            ]
        })
        .limit(limit - 0)
        .skip((page - 1) * limit);

        const count = await Reservation.find({
            $or:[
                {name:{$regex:'.*'+search+'.*',$options:'i'}},
                {email:{$regex:'.*'+search+'.*',$options:'i'}},
                {guests:{$regex:'.*'+search+'.*',$options:'i'}},
                {date:{$regex:'.*'+search+'.*',$options:'i'}},
                {time:{$regex:'.*'+search+'.*',$options:'i'}}
            ]
        }).countDocuments();

        res.render("reserveReq",{req:request, totalPages: Math.ceil(count/limit),currentPage: page, approve:req.flash('approve'),reject:req.flash('reject')});
    } catch (error) {
        console.log(error);
    }
})
app.get("/showApproval", auth ,async(req,res)=>{
    try {
        var search = "";
    if(req.query.search)
    {
        search = req.query.search;
    }
    const {page=1 , limit=5} = req.query;
    const approved = await Status.find({
        $or: [
            { name: { $regex: '.*' + search + '.*', $options: 'i' } },
            { email: { $regex: '.*' + search + '.*', $options: 'i' } },
            { date: { $regex: '.*' + search + '.*', $options: 'i' } },
            { time: { $regex: '.*' + search + '.*', $options: 'i' } },
            { status: { $regex: '.*' + search + '.*', $options: 'i' } }
        ]
    })
    .limit(limit - 0)
    .skip((page - 1) * limit);

    const count = await Status.find({
        $or: [
            { name: { $regex: '.*' + search + '.*', $options: 'i' } },
            { email: { $regex: '.*' + search + '.*', $options: 'i' } },
            { date: { $regex: '.*' + search + '.*', $options: 'i' } },
            { time: { $regex: '.*' + search + '.*', $options: 'i' } },
            { status: { $regex: '.*' + search + '.*', $options: 'i' } }
        ]
    }).countDocuments();

    res.render("approval",{approved:approved, totalPages:Math.ceil(count/limit), currentPage:page});
    } catch (error) {
        console.log(error);
    }
    
});
app.get("/pdf", auth , async(req,res)=>{
    try {
        const browser = await puppeteer.launch({headless:false});
        const page = await browser.newPage();
        await page.goto(`${req.protocol}://${req.get('host')}`+"/approvePdf",{
            waitUntil:"networkidle2"
        });

        await page.setViewport({width:1680,height:1050});
        const todayDate = new Date();
        const pdf = await page.pdf({
            path:`${path.join(__dirname,'/views/pdf',todayDate.getTime()+".pdf")}`,
            printBackground:true,
            format:"A4"
        });

        await browser.close();
        const pdfUrl = path.join(__dirname,'/views/pdf',todayDate.getTime()+".pdf");
        //make pdf
        // res.set({
        //     "Content-Type":"application/pdf",
        //     "Content-length":pdf.length
        // });
        // res.sendFile(pdfUrl);

        //download
        res.download(pdfUrl,function(error){
            if(error){
                console.log(error)
            }
            else{

            }
        })

    } catch (error) {
        console.log(error);
    }
})
app.get("/showReject", auth , async(req,res)=>{
    try {
        var search = "";
    if(req.query.search)
    {
        search = req.query.search;
    }
    const {page=1 , limit=5} = req.query;
    const reject = await Reject.find({
        $or: [
            { name: { $regex: '.*' + search + '.*', $options: 'i' } },
            { email: { $regex: '.*' + search + '.*', $options: 'i' } },
            { date: { $regex: '.*' + search + '.*', $options: 'i' } },
            { time: { $regex: '.*' + search + '.*', $options: 'i' } },
            { status: { $regex: '.*' + search + '.*', $options: 'i' } }
        ]
    })
    .limit(limit - 0)
    .skip((page - 1) * limit);

    const count = await Reject.find({
        $or: [
            { name: { $regex: '.*' + search + '.*', $options: 'i' } },
            { email: { $regex: '.*' + search + '.*', $options: 'i' } },
            { date: { $regex: '.*' + search + '.*', $options: 'i' } },
            { time: { $regex: '.*' + search + '.*', $options: 'i' } },
            { status: { $regex: '.*' + search + '.*', $options: 'i' } }
        ]
    }).countDocuments();

    res.render("reject",{reject:reject, totalPages:Math.ceil(count/limit), currentPage:page});
    } catch (error) {
        console.log(error);
    }
    
})
app.get("/showChef", auth , async (req,res)=>{
    try {
        var search = "";
        if(req.query.search)
        {
            search = req.query.search;
        }
        const {page=1 , limit=5} = req.query;
        const allChef = await Chef.find({
            $or:[
                {chef_name:{$regex:'.*'+search+'.*',$options:'i'}},
                {chef_role:{$regex:'.*'+search+'.*',$options:'i'}}
            ]
        })
        .limit(limit - 0)
        .skip((page - 1) * limit);
        const count = await Chef.find({
            $or:[
                {chef_name:{$regex:'.*'+search+'.*',$options:'i'}},
                {chef_role:{$regex:'.*'+search+'.*',$options:'i'}}
            ]
        }).countDocuments();
        res.render("chefData",{chef:allChef, totalPages:Math.ceil(count/limit), currentPage:page,chefDelete:req.flash('chefDelete')});
        
    } catch (error) {
        console.log(error);
    }
});
app.get("/showBreakfast", auth , async (req,res)=>{
    try {
        var search = "";
        if(req.query.search)
        {
            search = req.query.search;
        }
        const {page=1 , limit=3} = req.query;

        const allbf = await Breakfast.find({
            $or:[
                {breakfast_name:{$regex:".*"+search+".*",$options:'i'}}
            ]
        })
        .limit(limit - 0)
        .skip((page - 1) * limit);

        const count = await Breakfast.find({
            $or:[
                {breakfast_name:{$regex:".*"+search+".*",$options:'i'}}
            ]
        }).countDocuments();

        res.render("breakfastData",{breakfast:allbf,totalPages:Math.ceil(count/limit), currentPage:page});
    } catch (error) {
        console.log(error);
    }
});
app.get("/showLunch", auth , async (req,res)=>{
    try {
        var search = "";
        if(req.query.search)
        {
            search = req.query.search;
        }

        const {page=1 , limit=3} = req.query;

        const lunch = await Lunch.find({
            $or:[
                {lunch_name:{$regex:".*"+search+".*",$options:'i'}}
                ]
        })
        .limit(limit - 0)
        .skip((page - 1) * limit);
        //console.log(lunch);
        const count = await Lunch.find({
            $or:[
                {lunch_name:{$regex:".*"+search+".*",$options:'i'}}
                ]
        }).countDocuments();

        res.render("lunchData",{lunch:lunch,totalPages:Math.ceil(count/limit), currentPage:page});
    } catch (error) {
        console.log(error);
    }
});
app.get("/showDinner", auth , async (req,res)=>{
    try {
        var search = "";
        if(req.query.search)
        {
            search = req.query.search;
        }

        const {page=1 , limit=3} = req.query;
        
        const dinner = await Dinner.find({
            $or:[
                {dinner_name:{$regex:".*"+search+".*",$options:'i'}}
                ]
        })
        .limit(limit - 0)
        .skip((page - 1) * limit);
        //console.log(dinner);
        const count = await Dinner.find({
            $or:[
                {dinner_name:{$regex:".*"+search+".*",$options:'i'}}
                ]
        }).countDocuments();

        res.render("dinnerData",{dinner:dinner,totalPages:Math.ceil(count/limit), currentPage:page});
    } catch (error) {
        console.log(error);
    }
});

app.get("/chef", auth ,async (req, res)=>{
    try {
        res.render("chef",{chef:req.flash('chef')});
    } catch (error) {
        console.log(`cannot open chef`+error)
    }
});
app.get("/breakfast", auth ,async (req, res)=>{
    try {
        res.render("breakfast",{breakfast:req.flash('breakfast')});
    } catch (error) {
        console.log(`breakfast not open`+error)
    }
});
app.get("/lunch", auth ,async (req,res)=>{
    try {
        res.render("lunch",{lunch:req.flash('lunch')});
    } catch (error) {
        console.log(error);
    }

});
app.get("/dinner", auth , async (req,res)=>{
    try {
        res.render("dinner",{dinner:req.flash('dinner')});
    } catch (error) {
        console.log(error);
    }
})
app.get("/otp", auth ,async(req,res)=>{
    try {
        res.render("otp",{otp:req.flash('otp')});
    } catch (error) {
        console.log(error);
    }
});


app.get('/deleteChef/:id', auth ,async(req,res)=>{
    try {
        await Chef.findByIdAndDelete(req.params.id);
        req.flash('chefDelete','Chef Has been Deleted Successfully...');
        res.redirect("/showChef");
    } catch (error) {
        res.send("cannot delete chef...")
    }
 
});
app.get('/deleteBf/:id', auth ,async(req,res)=>{
    try {
        await Breakfast.findByIdAndDelete(req.params.id);
        res.redirect("/showBreakfast");
    } catch (error) {
        res.send("cannot delete breakfast...")
    }
 
});
app.get('/deleteLunch/:id', auth ,async(req,res)=>{
    try {
        await Lunch.findByIdAndDelete(req.params.id);
         res.redirect("/showLunch");
    } catch (error) {
        res.send("cannot delete breakfast...")
    }
 
});
app.get('/deleteDinner/:id', auth ,async(req,res)=>{
    try {
        await Dinner.findByIdAndDelete(req.params.id);
         res.redirect("/showDinner");
    } catch (error) {
        res.send("cannot delete breakfast...")
    }
 
});

app.get("/approval/:id", auth , async (req, res) => {
    try {
        //console.log(req.params.id);
        const id = req.params.id;
        const data = await Reservation.findOne({ _id: id });
        if (data) {
            const html = `
            <table border="2px solid black" align="center">
    <tr>
        <th><h1>Hello ${data.name}  From Klassy Resturtant !!</h1></th>
    </tr>
    <tr>
        <td align="center">
            <img src="cid:arzala@gmail.com" alt="image loading :)" width="400px">
            <p><b>Thank You For Choose Our Resturtant :)</b></p>
            <p>We Glad To Serve Food That Make Your Day Great </p>
        </td>
    </tr>
    <tr>
        <td align="center">
           <h1>Your Reservation approved</h1>
           <p>Total Guest No is ${data.guests} And Booked On ${data.date} & CheckIn Time Is ${data.time} Onward</p>
        </td>
    </tr>
    <tr>
        <td align="center">
        <a href="https://www.instagram.com/ajayrajsinh_2414" target="_blank"><i class="fa fa-instagram"></i>Klassy Resturtant</a><br>
        <a href="https://wa.me/919510464748" target="_blank"><i class="fa fa-whatsapp"></i>For More info Connect on Whatsapp !</a><br>   
        <p>Connect With Us On Instagram And Write Reviews !!!</p>
        </td>
    </tr>
</table>`

            var transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                requireTLS: true,
                auth: {
                    user: 'gamingfact03@gmail.com',
                    pass: "sexpvcicomzyiyyh"
                }
            });
            var mailOption = {
                from: 'gamingfact03@gmail.com',
                to: data.email,
                subject: "Booking confirmation mail",
                html: html,
                attachments: [{
                    filename: 'klassy.png',
                    path: './views/image/klassy.png',
                    cid: 'arzala@gmail.com'
                }
                ]
            }

            transporter.sendMail(mailOption, function (error, info) {
                if (error) {
                    console.log(error);
                }
                else {
                    console.log("mail send successfuly", info.response);
                }
            })
            console.log("request has been approval by admin");
            const status = new Status({
                name:data.name,
                email:data.email,
                phone:data.phone,
                guests:data.guests,
                date:data.date,  
                time:data.time,  
                // message:data.message,  
                status:"approved"
            })
            const appr = status.save();
            req.flash('approve',`Request Approved of ${data.name} & Mail Send`);
            await Reservation.findByIdAndDelete(req.params.id);
            res.redirect('/showReservation');
        }

    } catch (error) {
        console.log(error);
    }
});
app.get("/reject/:id", auth, async(req,res)=>{
    try {
        const id = req.params.id;
        const data = await Reservation.findOne({_id:id});
        if (data) {
            const html = `
            <table border="2px solid black" align="center">
    <tr>
        <th><h1>Hello ${data.name}  From Klassy Resturtant !!</h1></th>
    </tr>
    <tr>
        <td align="center">
            <img src="cid:arzala@gmail.com" alt="image loading :)" width="400px">
            <p><b>Thank You For Choose Our Resturtant :)</b></p>
            <p>We Glad To Serve Food That Make Your Day Great </p>
        </td>
    </tr>
    <tr>
        <td align="center">
           <h1>Your Reservation Reject Due To Seating Arrange </h1>
           <h2>If you Dont Any Issue To Waiting Please Connect And We'll Arrange :)</h2>
           <p>Total Guest No is ${data.guests} And Booked On ${data.date} & CheckIn Time Is ${data.time} Onward</p>
        </td>
    </tr>
    <tr>
        <td align="center">
        <a href="https://www.instagram.com/ajayrajsinh_2414" target="_blank"><i class="fa fa-instagram"></i>Klassy Resturtant</a><br>
        <a href="https://wa.me/919510464748" target="_blank"><i class="fa fa-whatsapp"></i>For More info Connect on Whatsapp !</a><br>   
        <p>Connect With Us On Instagram And Write Reviews !!!</p>
        </td>
    </tr>
</table>`

            var transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                requireTLS: true,
                auth: {
                    user: 'gamingfact03@gmail.com',
                    pass: "sexpvcicomzyiyyh"
                }
            });
            var mailOption = {
                from: 'gamingfact03@gmail.com',
                to: data.email,
                subject: "Booking confirmation mail",
                html: html,
                attachments: [{
                    filename: 'klassy.png',
                    path: './views/image/klassy.png',
                    cid: 'arzala@gmail.com'
                }
                ]
            }

            transporter.sendMail(mailOption, function (error, info) {
                if (error) {
                    console.log(error);
                }
                else {
                    console.log("mail send successfuly", info.response);
                }
            })
            console.log("request has been reject by admin");
            const reject = new Reject({
                name:data.name,
                email:data.email,
                phone:data.phone,
                guests:data.guests,
                date:data.date,  
                time:data.time,  
                status:"rejected"
            })
            const rej = reject.save();
            req.flash('reject',`Request Rejected of ${data.name} & Mail Send`);
            await Reservation.findByIdAndDelete(req.params.id);
            res.redirect('/showReservation');
        }
    } catch (error) {
        console.log(error);
    }
});
app.post("/chef", auth , upload.single('chef_image'), async(req, res)=>{
    try {
        // console.log("data coming");
        const chef = new Chef({
            chef_name:req.body.chef_name,
            chef_role:req.body.chef_role,
            chef_image:req.file.filename
        })
        // console.log(chef);
        const add_chef = await chef.save();
        req.flash('chef','Chef Added Successfully...');
        res.redirect('/chef');
        //res.status(201).send("chef added successfully...");
    } catch (error) {
        console.log(error);
    }
});
app.post("/Addbreakfast", auth , upload.single('breakfast_image'), async(req, res)=>{
    try {
        // console.log("data coming");
        const breakfast = new Breakfast({
            breakfast_name:req.body.breakfast_name,
            price:req.body.price,
            description:req.body.description,
            breakfast_image:req.file.filename
        })
        // console.log(chef);
        const add_bf = await breakfast.save();
        req.flash('breakfast','BreakFast Added Successfully...');
        res.status(201).redirect('/breakfast');
        //res.status(201).send("breakfast added successfully...");
    } catch (error) {
        console.log(error);
    }
});
app.post("/Addlunch", auth , upload.single('lunch_image'), async(req, res)=>{
    try {
        // console.log("data coming");
            const lunch = new Lunch({
            lunch_name:req.body.lunch_name,
            price:req.body.price,
            description:req.body.description,
            lunch_image:req.file.filename
        })
        // console.log(chef);
        const add_lunch = await lunch.save();
        req.flash('lunch','Lunch Added Successfully...');
        res.status(201).redirect('/lunch');
        //res.status(201).send("lunch added successfully...");
    } catch (error) {
        console.log(error);
    }
});
app.post("/Adddinner", auth , upload.single('dinner_image'), async(req, res)=>{
    try {
        // console.log("data coming");
        const dinner = new Dinner({
            dinner_name:req.body.dinner_name,
            price:req.body.price,
            description:req.body.description,
            dinner_image:req.file.filename
        })
        // console.log(chef);
        const add_dinner = await dinner.save();
        req.flash('dinner','Dinner Added Successfully...');
        res.status(201).redirect('/dinner');
        //res.status(201).send("dinner added successfully...");
    } catch (error) {
        console.log(error);
    }
});
app.post("/reservation", async (req,res)=>{
    try {
        const reserve = new Reservation({
            name:req.body.name,
            email:req.body.email,
            phone:req.body.phone,
            guests:req.body.guests,
            date:req.body.date,
            time:req.body.time
            //message:req.body.message
        })
        const reserved = await reserve.save();
        req.flash('reserve','Reservation Request Send Successfully...');
        res.status(201).redirect('/');
    } catch (error) {
        console.log(error);
    }
})
app.post("/register",upload.single('image'), async (req, res) => {
    try {
        const register =new Register({
            name:req.body.name,
            email:req.body.email,
            password:req.body.password,
            phone:req.body.phone,
            //number_people:req.body.number_people,
            image:req.file.filename,
            otp:GenOtp
        })
        

        const token = await register.generateAuthToken();
        console.log("register token "+token);
    
        res.cookie("jwt",token,{
            expires :new Date(Date.now() + 600000),
            httpOnly:true
        })
    
        const registered = await register.save();
        req.flash('register','Register Successfully');
        res.status(201).redirect("/register");

    } catch (error) {
        res.status(400).send(error);
    }
});
app.post("/VerOtp",async (req,res)=>{
    try {
        const otp = req.body.otp;
        const verify = await Register.findOne({otp:otp});
        console.log(GenOtp)
        if(verify)
        {
            result = await Register.updateOne(
                {  otp:otp},{
                    $set : {otp:GenOtp}
                })
                console.log(result);
                res.status(201).render("admin",{currUser:verify});
        }
        else
        {
            //res.send("please enter valid otp");
            req.flash('otp','PLease Enter Valid Otp !!');
            res.redirect('/otp');
        }
    } catch (error) {
        console.log(error)
    }
});
app.post("/login", async (req,res)=>{
    try {
        
        const email = req.body.email
        const phone = req.body.phone;
        const password = req.body.password
        const username = await Register.findOne({email:email, phone:phone});
        if (username) {
            
        
        const match = await bcrypt.compare(password, username.password);
        const token = await username.generateAuthToken();
        console.log("login token"+ token);

        res.cookie("jwt",token,{
            expires :new Date(Date.now() + 600000),
            httpOnly:true
        })
        // res.cookie("jwt", token, {
        //     expires:new Date(Date.now() + 50000),
        //     httpOnly:true
        // })

        if(match)
        {
            const html = `
                <table border="2px solid black" align="center">
        <tr>
            <th><h1>Hello ${username.name}  From Klassy Resturtant !!</h1></th>
        </tr>
        <tr>
            <td align="center">
                <img src="cid:arzala@gmail.com" alt="image loading :)" width="400px">
                <p><b>Thank You For Choose Our Resturtant :)</b></p>
                <p>We Glad To Serve Food That Make Your Day Great </p>
            </td>
        </tr>
        <tr>
            <td align="center">
               <h1>This Is Your verifying OTP: ${username.otp} For login</h1>
            </td>
        </tr>
        <tr>
            <td align="center">
            <a href="https://www.instagram.com/ajayrajsinh_2414" target="_blank"><i class="fa fa-instagram"></i>Klassy Resturtant</a><br>
            <a href="https://wa.me/919510464748" target="_blank"><i class="fa fa-whatsapp"></i>For More info Connect on Whatsapp !</a><br>  
            <p>Connect With Us On Instagram And Write Reviews !!!</p>
            </td>
        </tr>
    </table>`
       
                var transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port:587,
            secure:false,
            requireTLS: true,
            auth: {
                user:'gamingfact03@gmail.com',
                pass:"sexpvcicomzyiyyh"
            }
        });
        var mailOption = {
            from : 'gamingfact03@gmail.com',
            to:username.email,
            subject:"Login OTP Mail",
            html:html,
            attachments:[{
                filename:'klassy.png',
                path:'./views/image/klassy.png',
                cid:'arzala@gmail.com'
            }
            ]
        }
        
        transporter.sendMail(mailOption, function(error, info){
            if(error)
            {
                console.log(error);
            }
            else
            {
                console.log("mail send successfuly",info.response);
            }
        })
            // console.log("please check mail & enter otp");
            //req.flash('mail','Please Check MailBox & Enter Otp');
            res.status(201).redirect("/otp");
            //res.status(201).render("admin",{username:username});
        }
        else if(!match){
            req.flash('password','Password Not Matched !!');
            res.redirect('/login');
        }
        else{
            console.log("Opps something wrong !!")
        }
    } 
    else {
           // res.send("email and phone no invalid") 
           req.flash('message','Email And Phone Not Match');
           res.redirect('/login');
    }

    } catch (error) {
        res.status(400).send("something wrong..");
    }
});

app.listen(port, () => {
    console.log(`server listening on ${port} `);
});