var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var nodemailer = require("nodemailer");

const app = express();

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended: true
}));

mongoose.connect('mongodb://localhost:27017/mydb', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

var db = mongoose.connection;

db.on('error', () => console.log("Error in Connecting to Database"));
db.once('open', () => console.log("Connected to Database"));

app.post("/sign_up", async (req, res) => {
    var name = req.body.name;
    var email = req.body.email;
    var phno = req.body.phno;
    var fileupload = req.body.fileupload;

    const verificationToken = generateRandomToken();

    var data = {
        "name": name,
        "email": email,
        "phno": phno,
        "fileupload": fileupload,
        "verificationToken": verificationToken,
        "verified": false
    };

    db.collection('users').insertOne(data, (err, collection) => {
        if (err) {
            throw err;
        }
        console.log("Record Inserted Successfully");

        sendVerificationEmail(email, verificationToken);
    });

    return res.redirect('signup_success.html');
});

app.get("/verify/:token", (req, res) => {
    const token = req.params.token;

    db.collection('users').findOneAndUpdate(
        { verificationToken: token },
        { $set: { verified: true }, $unset: { verificationToken: 1 } },
        (err, result) => {
            if (err) {
                console.error(err);
                res.send('Email verification failed.');
            } else if (result.value) {
                res.send('Email verified. You can now log in.');
            } else {
                res.send('Invalid token. Email verification failed.');
            }
        }
    );
});

app.get("/", (req, res) => {
    res.set({
        "Allow-access-Allow-Origin": '*'
    });
    return res.redirect('index.html');
}).listen(3000);

console.log("Listening on PORT 3000");

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your_email@gmail.com',
        pass: 'your_email_password',
    },
});

function sendVerificationEmail(email, token) {
    const mailOptions = {
        from: 'your_email@gmail.com',
        to: email,
        subject: 'Email Verification',
        text: `Click the following link to verify your email: http://localhost:3000/verify/${token}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

function generateRandomToken() {
    return 'random_token';
}
