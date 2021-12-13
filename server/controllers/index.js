let express = require('express');
let router = express.Router();
let mongoose = require('mongoose');
let passport = require('passport');

//enable JWT
let jwt = require('jsonwebtoken');
let DB = require('../config/db');

//create the user Model instance
let userModel = require('../models/user');
let surveyModel = require('../models/survey');
let User = userModel.User;  //alias

// module.exports.displayHomePage = (req, res, next) => {
//     res.render('index', 
//         {title: 'Home', displayName: req.user ? req.user.displayName : ''}
//     );
// }

module.exports.displaySurveyList = (req, res, next) => {
    var query = { status: 'ACTIVE' };

    surveyModel.find(query, function(err, surveyList) {
        if(!err) {
            res.render('survey/list', {
                title: 'Group 4 Survey Site',
                SurveyList: surveyList,
                displayName: req.user ? req.user.displayName : ''
            }); 
        }
        else
        {
            return console.error(err);
        }
    }).sort({"name": 1});
}

module.exports.displayLoginPage = (req, res, next) => {
    //check if the user is already logged in
    if(!req.user)
    {
        res.render('auth/login', 
        {
            title: "Login",
            messages: req.flash('loginMessage'),
            displayName: req.user ? req.user.displayName : ''
        });
    }
    else
    {
        return res.redirect('/');
    }
}

module.exports.processLoginPage = (req, res, next) => {
    passport.authenticate('local',
    (err, user, info) => {
        //server error
        if(err)
        {
            return next(err);
        }
        // is there a user login error?
        if(!user)
        {
            req.flash('loginMessage', 'Authentication Error');
            return res.redirect('/login');
        }
        req.login(user, (err) => {
            //server error?
            if(err)
            {
                return next(err);
            }

            const payload = 
            {
                id: user._id,
                displayName: user.displayName,
                userName: user.username,
                email: user.email
            }

            const authToken = jwt.sign(payload, DB.Secret, 
                {
                    expiresIn: 604800  // 1 week in seconds
            });

            /* getting ready to convert to API
            res.json({success: true, msg: 'User Logged in Successfully', user: {
                id: user._id,
                displayName: user.displayName,
                userName: user.username,
                email: user.email
            }, token: authToken});
            */

            return res.redirect('/my-survey');
        });
    })(req, res, next);
}

module.exports.displayRegisterPage = (req, res, next) => {
    //check if the user is not already logged in
    if(!req.user)
    {
        res.render('auth/register',
        {
            title: 'Register',
            messages: req.flash('registerMessage'),
            displayName: req.user ? req.user.displayName : ''
        });
    }
    else
    {
        return res.redirect('/');
    }
}

module.exports.processRegisterPage = (req, res, next) => {
    // instantiate a user object
    let newUser = new User({
        username: req.body.username,
        //password: req.body.password
        email: req.body.email,
        displayName: req.body.displayName
    });

    User.register(newUser, req.body.password, (err) => {
        if(err)
        {
            console.log("Error: Inserting New User");
            if(err.name == "UserExistsError")
            {
                req.flash(
                    'registerMessage',
                    'Registration Error: User Already Exists!'
                );
                console.log('Error: User Already Exists!')
            }
            return res.render('auth/register',
            {
                title: 'Register',
                messages: req.flash('registerMessage'),
                displayName: req.user ? req.user.displayName : ''
            });
        }
        else
        {
            // if no error exists, then registration is successful

            // redirect the user and authenticate them

            /* TODO - Getting Ready to convert to API
            res.json({success: true, msg: 'User Registered Successfully!'});
            */

            return passport.authenticate('local')(req, res, () => {
                res.redirect('/my-survey')
            });
        }
    });
}

module.exports.displayEditUserPage = (req, res, next) => {
    let id = req.user._id;

    User.findById(id, (err, UserToEdit) => {
        if(err)
        {
            console.log(err);
            res.end(err);
        }
        else
        {
            //show the edit view
            res.render('auth/editprofile', {title: 'Edit User', user : UserToEdit,
            displayName: req.user ? req.user.displayName : ''});      
        }
    });
}

module.exports.processEditUserPage = (req, res, next) => {
    let id = req.user._id;

    let updatedUser = User({
        "_id": id,
        "username": req.body.userName,
        "email": req.body.email,
        "displayName": req.body.displayName,
    });

    User.updateOne({_id: id}, updatedUser, (err) => {
        if(err)
        {
            console.log(err);
            res.end(err);
        }
        else
        {
            // refresh the book list
            res.redirect('/');
        }
    });
}


module.exports.performLogout = (req, res, next) => {
    req.logout();
    res.redirect('/');
}

module.exports.displayMySurveyPage = (req, res, next) => {
    if(!req.user) {
        res.redirect('/login');
    }
    else {
        var query = { creatorId: req.user.id };

        surveyModel.find(query, function(err, surveyList) {
            if(!err) {
                res.render('my-survey', {
                    title: 'My Survey', 
                    SurveyList: surveyList,
                    displayName: req.user ? req.user.displayName : ''
                });
            }
        }).sort({ "name": 1 });
    }
}
