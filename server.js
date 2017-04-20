var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var config = require('./config');
var User = require('./models/user').User;
var fs = require('fs');
const path = require('path');
const public = __dirname + "/build/";

app.set('port', (process.env.PORT || 5000));
app.use(express.static(public));

mongoose.connect(config.database);
app.set('superSecret', config.secret);

// Serve static
app.get('*', function(req, res) {
    res.sendFile(path.join(public + "index.html"));
});

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json());

// Headers
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.use(morgan('dev'));

var apiRoutes = express.Router();

//signup route
app.post('/signup', function (req, res) {
    var email = req.body.email;
    var password = req.body.password;
    var userName = req.body.userName;
    var user = new User({userName: userName, email: email, password: password, });

    User.findOne({email: email}, function (err, usr) {
        if(!usr) {
            user.save(function (err) {
                if (err) {
                    res.json({success: false});
                } else {
                    var token = jwt.sign(user, app.get('superSecret'), {
                        expiresIn: '24h'
                    })
                    res.json({
                        success:true,
                        user: {
                            token: token,
                            userName: userName,
                            email: email
                        }
                    });
                }
            })
        } else {
            res.json({success: false, message: 'Email exist'});
        }
    });
});

// Route to authenticate user
app.post('/login', function (req, res) {
    var email = req.body.email;
    var password = req.body.password;

    User.findOne({
        email: email
    }, function (err, user) {
        if (err) throw err;
        if (!user) {
            res.json({
                success: false,
                message: 'Authenticate failed. User not found.'
            })
        } else if (user) {
            if (!user.checkPassword(password)) {
                res.json({
                    success: false,
                    message: 'Authenticate failed. Wrong password.'
                })
            } else {
                var token = jwt.sign(user, app.get('superSecret'), {
                    expiresIn: '24h'
                })

                res.json({
                    success:true,
                    user: {
                        token: token,
                        userName: user.userName,
                        email: email
                    }
                });
            }
        }
    })
})

// Route middleware to verify token
apiRoutes.use(function (req, res, next) {

    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    if (token) {
        jwt.verify(token, app.get('superSecret'), function (err, decoded) {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Failed to authenticate token'
                })
            } else {
                req.decoded = decoded;
                next();
            }
        })
    } else {
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        })
    }
    
})

app.use('/api', apiRoutes);

app.listen(app.get('port'));

