const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const db = require('./mysql.js');
const app = express();
const port = 8080;
var http = require('http');
var fs = require('fs');
var qs = require('querystring');
var nodemailer = require('nodemailer');

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(
    session({
        secret: 'secret',
        resave: true,
        saveUninitialized: true
    })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/home', function(req, res) {
    res.render('home.ejs');
});

app.get('/login', function(req, res) {
    res.render('login.ejs');
});

app.get('/register', function(req, res) {
    res.render('register.ejs');
});

app.post('/authlogin', (req, res) => {
    var email = req.body.email;
    var password = req.body.password;
    var nama_user = req.body.nama_user;
    const sql = 'SELECT * FROM user WHERE email = ? AND password = ?';
    if (email && password) {
        db.query(sql, [email, password], function(err, rows) {
            if (err) throw err;
            else if (rows.length > 0) {
                req.session.loggedin = true;
                req.session.email = email;
                req.session.nama_user = nama_user;
                res.redirect('/profil');
            } else {
                res.end('Kredensial anda salah!');
            }
        });
    }
});

app.post('/auth_register', function(req, res) {
    var register_data = {
        nama_user: req.body.nama_user,
        email: req.body.email,
        password: req.body.password
    };
    db.query('insert into user set ?' , register_data, function(err, results) {
        if (err) throw err;
        else {
            console.log('Data masuk!', results);
            res.redirect('/login');
        }
    });
});

//app.get('/home', function(request, response) {
//	if (request.session.loggedin) {
//		response.send('Welcome back, ' + request.session.email + '!');
//	} else {
//		response.send('Please login to view this page!');
//	}
//	response.end();
//});

app.get('/profil', function(req, res) {
    if (req.session.loggedin) {
        res.render('profil.ejs');
    } else {
        res.end('Silahkan login dahulu!');
    }
});

app.get('/logout', function(req, res) {
    if (req.session.loggedin  = true) {
        req.session.loggedin = false;
        res.redirect('/home');
    }
    res.end();
});

app.get('/about', function(req, res) {
    res.render('about.ejs');
});

app.get('/contact', function(req, res) {
    res.render('contact.ejs');
});

app.get('/maps', function(req, res) {
    res.render('maps.ejs');
});

// NODEMAILER

http.createServer((req, res) => {
    if (req.url === "/") {
        //redirect ke halaman contact form
        res.writeHead(302, {
            'Location' : '/contact/'
        });
        res.end();
    }

    //load contact form
    if (req.url === "/contact/" && req.method === "GET"){
        fs.readFile("contact.ejs", (err, data) => {
            if (err) throw err;
            res.end(data);
        });
    }

    //send email
    if (req.url === "/contact/" && req.method === "POST"){
        var requestBody = '';
        req.on('data', function(data) {
            //tangkap data dari form
            requestBody += data;

            //kirim balasan jika datanya terlalu besar
            if(requestBody.length > 1e7) {
                res.writeHead(413, 'Request Entity Too Large', {'Content-Type' : 'text/html'});
                res.end('<!doctype html><html><head><title>413</title></head><body>413: Request Entity Too Large</body></html>');
            }
        });

        req.on('end', function() {
            let formData = qs.parse(requestBody);

            // send email
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'nestaalsya@gmail.com',
                    pass: 'naesteu2002' 
                }
            });

            let mailOptions = {
                from: formData.email,
                replyTo: formData.email,
                to : 'nestaalsya@gmail.com',
                subject: formData.subject,
                text: formData.message
            };

            transporter.sendMail(mailOptions, (err, info) => {
                if (err) throw err;
                console.log('Email sent: ' + info.resnponse);
                res.end("Thank you!");
            });
        });
    }
})

//PORT
app.listen(port, function() {
    console.log(`Server di ${port}`);
});