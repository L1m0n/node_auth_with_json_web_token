var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var config = require('./config');
var User = require('./models/user').User;

mongoose.connect(config.database);
app.set('superSecret', config.secret);

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json());

app.use(morgan('dev'));

app.post('/setup', function (req, res) {
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
                    res.json({success:true});
                }
            })
        } else {
            res.json({success: false, message: 'Email exist'});
        }
    });
});

var apiRoutes = express.Router();

// Route to authenticate user
apiRoutes.post('/authenticate', function (req, res) {
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
                    success: true,
                    message: 'Enjoy your token!',
                    token: token
                })
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

apiRoutes.get('/', function (req, res) {
    res.json({message: "Welcome to to the API!"})
})

apiRoutes.get('/users', function (req, res) {
    User.find({}, function (err, users) {
        res.json(users);
    })
})

app.use('/api', apiRoutes);

app.listen(3000);

