const express = require('express');
const bp = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const PORT = process.env.PORT || 3000;
const app = express();
const session = require('express-session');
const md5 = require('md5');
const mailjet = require('node-mailjet')
    .connect('633709ad5b30f0fcbd24430f07ef1473', '66635f4a26910153126304f6aca46704');
app.use(express.static("public"));
app.use(bp.urlencoded({ extended: true }));
app.use(session({
    secret: 'this is the secret',
    resave: false,
    saveUninitialized: false

}));
app.use(function (req, res, next) {
    res.locals.username = req.session.username;
    res.locals.staffid = req.session.staffid;
    res.locals.doctorid=req.session.doctorid;
    next();
});
app.set("view engine", "ejs");
mongoose.connect('mongodb://localhost:27017/maxcare');
const staffSchema = new mongoose.Schema({
    name: String,
    staffid: String,
    password: String
});
const staff = mongoose.model("staff", staffSchema);
const doctorSchema = new mongoose.Schema({
    name: String,
    doctorid: String,
    password: String,
    qualification: String,
    speciality: String,
    experience: Number,
    availableToday: Number
});
const doctor = mongoose.model("doctor", doctorSchema);
const appointmentSchema = new mongoose.Schema({
    type: String,
    doctorid: String,
    date: String,
    name: String,
    email: String,
    status: Number,
    action: Number
});
const appointment = mongoose.model("appointment", appointmentSchema);

app.get("/", (req, res) => {
    res.render("home");
})

app.get("/login", (req, res) => {
    if (typeof req.session.staffid == "undefined") {
        res.render("login");
    } else {
        res.redirect("/dashboard");
    }

})

app.post("/login", (req, res) => {
    let staffid = req.body.staffid;
    let password = req.body.password;
    staff.find(
        { staffid: staffid },
        function (err, docs) {
            if (err) {
                console.log(err);
            } else {
                if (docs.length == 0) {
                    res.render("login", { message: 0 });
                } else if (docs.length == 1) {
                    password = md5(password);
                    if (docs[0].password == password) {

                        req.session.username = docs[0].name;
                        req.session.staffid = docs[0].staffid;
                        res.redirect("/dashboard");
                    } else {
                        res.render("login", { message: 1 })
                    }

                }
            }
        }
    )
})
app.get("/loginDoctor",(req,res)=>{
    if (typeof req.session.doctorid == "undefined") {
        res.render("loginDoctor");
    } else {
        res.redirect("/dashboardDoctor");
    }
})
app.post("/loginDoctor",(req,res)=>{
    let doctorid = req.body.doctorid;
    let password = req.body.password;
    doctor.find(
        { doctorid: doctorid },
        function (err, docs) {
            if (err) {
                console.log(err);
            } else {
                if (docs.length == 0) {
                    res.render("loginDoctor", { message: 0 });
                } else if (docs.length == 1) {
                    password = md5(password);
                    if (docs[0].password == password) {

                        req.session.username = docs[0].name;
                        req.session.doctorid = docs[0]._id;
                        res.redirect("/dashboardDoctor");
                    } else {
                        res.render("loginDoctor", { message: 1 })
                    }

                }
            }
        }
    )
})
app.get("/dashboard", (req, res) => {
    if (typeof req.session.staffid == "undefined") {
        res.redirect("/login");
    } else {
        doctor.find(
            {},
            function (err, docs) {
                if (err) { console.log(err); }
                else {
                    res.render("dashboard", { doctors: docs });
                }
            }
        )

    }
})
app.get("/dashboardDoctor",(req,res)=>{
    if (typeof req.session.doctorid == "undefined") {
        res.redirect("/loginDoctor");
    } else {
        var today = new Date();
        var dd = today.getDate();

        var mm = today.getMonth() + 1;
        var yyyy = today.getFullYear();
        if (dd < 10) {
            dd = '0' + dd;
        }

        if (mm < 10) {
            mm = '0' + mm;
        }
        today = dd + '/' + mm + '/' + yyyy;
        appointment.find(
            {
                date:today,
                doctorid:req.session.doctorid
            },
            function (err, docs) {
                if (err) { console.log(err); }
                res.render("dashboardDoctor", { appointments: docs });
            }
        )

    }
})
app.get("/registerStaff", (req, res) => {
    if (typeof req.session.staffid == "undefined") {
        res.redirect("/login");
    } else {
        res.render("registerStaff");
    }
})
app.post("/registerStaff", (req, res) => {
    if (typeof req.session.staffid == "undefined") {
        res.redirect("/login");
    } else {
        let name = req.body.name;
        let staffid = req.body.staffid;
        let password = req.body.password;
        let cpassword = req.body.cpassword;
        staff.find(
            { staffid: staffid },
            function (err, docs) {
                if (err) {
                    console.log(err);
                } else {
                    if (docs.length > 0) {
                        res.render("registerStaff", { message: 0 });
                    } else {
                        if (password !== cpassword) {
                            res.render("registerStaff", { message: 1 });
                        } else {
                            password = md5(password);
                            const newStaff = new staff(
                                {
                                    name: name,
                                    staffid: staffid,
                                    password: password,

                                }
                            );
                            newStaff.save();
                            res.render("registerStaff", { message: 2 });
                        }
                    }
                }
            }
        )
    }
})
app.get("/registerDoctor", (req, res) => {
    if (typeof req.session.staffid == "undefined") {
        res.redirect("/login");
    } else {
        res.render("registerDoctor");
    }
})
app.post("/registerDoctor", (req, res) => {
    if (typeof req.session.staffid == "undefined") {
        res.redirect("/login");
    } else {
        let name = req.body.name;
        let doctorid = req.body.doctorid;
        let password = req.body.password;
        let cpassword = req.body.cpassword;
        let qualification = req.body.qualification;
        let speciality = req.body.speciality;
        let experience = req.body.experience;
        doctor.find(
            { doctorid: doctorid },
            function (err, docs) {
                if (err) {
                    console.log(err);
                } else {
                    if (docs.length > 0) {
                        res.render("registerDoctor", { message: 0 });
                    } else {
                        if (password !== cpassword) {
                            res.render("registerDoctor", { message: 1 });
                        } else {
                            password = md5(password);
                            const newDoctor = new doctor(
                                {
                                    name: name,
                                    doctorid: doctorid,
                                    password:password,
                                    qualification: qualification,
                                    speciality: speciality,
                                    experience: experience,
                                    availableToday: 1

                                }
                            );
                            newDoctor.save();
                            res.render("registerDoctor", { message: 2 });
                        }
                    }
                }
            }
        )
    
        
    }
})
app.get("/doctors", (req, res) => {
    doctor.find(
        {},
        function (err, docs) {
            if (err) { console.log(err); }
            else {
                res.render("doctors", { doctors: docs });
            }
        }
    )
})
app.get("/timeout/:id/:status", (req, res) => {
    if (typeof req.session.staffid == "undefined") {
        res.redirect("/login");
    } else {
        let status;
        if (req.params.status == 1) {
            status = 0;
        } else if (req.params.status == 0) {
            status = 1;
        }


        doctor.updateOne(
            { _id: req.params.id },
            { availableToday: status },
            function (err) {
                if (err) { console.log(err); }

                res.redirect("/dashboard");

            }
        )

    }
})
app.get("/appointment", (req, res) => {
    doctor.find(
        {},
        function (err, docs) {
            if (err) { console.log(err); }
            else {
                res.render("appointment", { doctors: docs });
            }
        }
    )

})

app.get("/logout", (req, res) => {
    if (typeof req.session.username == "undefined") {
        res.redirect("/login");
    } else {
        delete req.session.username;
        delete req.session.staffid;
        delete req.session.doctorid;
        res.redirect("/login");
    }
})
app.get("/logoutDoctor",(req,res)=>{
    if (typeof req.session.username == "undefined") {
        res.redirect("/loginDoctor");
    } else {
        delete req.session.username;
        delete req.session.staffid;
        delete req.session.doctorid;
        res.redirect("/loginDoctor");
    }
})
app.get("/emailVerify", (req, res) => {

    res.render("emailVerify", { doctorid: req.query.id });
})
app.post("/emailVerify", (req, res) => {
    let OTP = Math.floor(Math.random() * 9000 + 1000);
    const request = mailjet
        .post("send", { 'version': 'v3.1' })
        .request({
            "Messages": [
                {
                    "From": {
                        "Email": "omdalvi184@gmail.com",
                        "Name": "Om Dalavi"
                    },
                    "To": [
                        {
                            "Email": req.body.email,
                            "Name": ""
                        }
                    ],
                    "Subject": "MaxCare Email Verification",
                    "TextPart": "",
                    "HTMLPart": "<p>OTP For Online Appointment Booking at MaxCare Multispeciality Hospital is </p><h3>" + OTP + "</h3>",
                    "CustomID": "AppGettingStartedTest"
                }
            ]
        });
    request
        .then((result) => {
            console.log("Sent");
            req.session.otp = OTP;
            res.render("otp", { doctorid: req.body.doctorid, email: req.body.email });
        })
        .catch((err) => {
            console.log("Not Sent");
            res.redirect("/emailVerify");
        });




})
app.post("/otp", (req, res) => {
    if (req.body.otp == req.session.otp) {
        delete req.session.otp;
        res.render("appointmentForm", { doctorid: req.body.doctorid, email: req.body.email });
    } else {
        delete req.session.otp;
        res.redirect("/message/0");
    }
})
app.post("/appointmentApproval", (req, res) => {
    var today = new Date();
    var dd = today.getDate();

    var mm = today.getMonth() + 1;
    var yyyy = today.getFullYear();
    if (dd < 10) {
        dd = '0' + dd;
    }

    if (mm < 10) {
        mm = '0' + mm;
    }
    today = dd + '/' + mm + '/' + yyyy;


    let newAppointment = new appointment(
        {
            type: req.body.type,
            doctorid: req.body.doctorid,
            date: today,
            name: req.body.name,
            email: req.body.email,
            status: 0,
            action: 0
        }
    )
    newAppointment.save();
    res.redirect("/message/1");

})
app.get("/message/:message", (req, res) => {
    res.render("message", { message: req.params.message });
})
app.get("/adminAppointments", (req, res) => {

    if (typeof req.session.staffid == "undefined") {
        res.redirect("/login");
    } else {
        var today = new Date();
        var dd = today.getDate();

        var mm = today.getMonth() + 1;
        var yyyy = today.getFullYear();
        if (dd < 10) {
            dd = '0' + dd;
        }

        if (mm < 10) {
            mm = '0' + mm;
        }
        today = dd + '/' + mm + '/' + yyyy;
        appointment.find(
            { date: today },
            function (err, docs) {
                if (err) { console.log(err); }
                res.render("adminAppointments", { appointments: docs });
            }
        )

    }
})
app.get("/handleAppointment", (req, res) => {
    if (typeof req.session.staffid == "undefined") {
        res.redirect("/login");
    } else {
        let status = 0;
        if (req.query.action == "approve") {
            status = 1;
        }
        appointment.updateOne(
            { _id: req.query.id },
            {
                status: status,
                action: 1
            },
            function (err) {
                if (err) { console.log(err); }
                if (status == 1) {
                    const request = mailjet
                        .post("send", { 'version': 'v3.1' })
                        .request({
                            "Messages": [
                                {
                                    "From": {
                                        "Email": "omdalvi184@gmail.com",
                                        "Name": "Om Dalavi"
                                    },
                                    "To": [
                                        {
                                            "Email": req.query.email,
                                            "Name": ""
                                        }
                                    ],
                                    "Subject": "MaxCare Appointment Approval",
                                    "TextPart": "",
                                    "HTMLPart": "<h3>Your appointment request at MaxCare Multispeciality Hospital is successfully approved.</h3><p>Kindly Visit the hospital today in working hours only.</p>",
                                    "CustomID": "AppGettingStartedTest"
                                }
                            ]
                        });
                    request
                        .then((result) => {
                            console.log("Sent");


                        })
                        .catch((err) => {
                            console.log("Not Sent");

                        });
                } else if (status == 0) {
                    const request = mailjet
                        .post("send", { 'version': 'v3.1' })
                        .request({
                            "Messages": [
                                {
                                    "From": {
                                        "Email": "omdalvi184@gmail.com",
                                        "Name": "Om Dalavi"
                                    },
                                    "To": [
                                        {
                                            "Email": req.query.email,
                                            "Name": ""
                                        }
                                    ],
                                    "Subject": "MaxCare Appointment Declined",
                                    "TextPart": "",
                                    "HTMLPart": "<h3>Your appointment request at MaxCare Multispeciality Hospital is unfortunately Declined.</h3><p>Kindly Do not Visit the hospital today.</p>",
                                    "CustomID": "AppGettingStartedTest"
                                }
                            ]
                        });
                    request
                        .then((result) => {
                            console.log("Sent");


                        })
                        .catch((err) => {
                            console.log("Not Sent");

                        });
                }



            }
        )

        res.redirect("/adminAppointments");
    }
})
app.listen(PORT, (req, res) => {
    console.log("Server Listening on " + PORT);
})