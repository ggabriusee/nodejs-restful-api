const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

const errors = require('../utils/errors');
const validation = require('../utils/validation');

exports.signup = (req, res, next) => {
    validation.validateRequest(req);
    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;
    bcrypt.hash(password, 12)
    .then(hashedPw => {
        const user = new User({
            name: name,
            password: hashedPw,
            email: email
        });
        return user.save();
    })
    .then(user => {
        res.status(201).json({message: 'user created', userId: user._id})
    })
    .catch(err => errors.handleError(err, next));

};

exports.login = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;
    User.findOne({email: email})
    .then(user => {
        if(!user){
            const error = new Error('A user with this email cannot be found');
            error.statusCode = 401;
            throw error;
        }
        loadedUser = user;
        return bcrypt.compare(password, user.password);
    })
    .then(isEqual => {
        if(!isEqual){
            const error = new Error('Wrong password!');
            error.statusCode = 401;
            throw error;
        }
        const token = jwt.sign(
            {
                email: loadedUser.email, 
                userId: loadedUser._id.toString()
            }, 
            process.env.AUTH_KEY,
            {expiresIn: '1h'}
        );
        res.status(200).json({token: token, userId: loadedUser._id.toString()});
    })
    .catch(err => errors.handleError(err, next))
};

exports.getUserStatus = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            const error = new Error('User not found.');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({ status: user.status });
    }catch (err) {
        errors.handleError(err, next);
    }
  };
  
exports.updateUserStatus = async (req, res, next) => {
    const newStatus = req.body.status;
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            const error = new Error('User not found.');
            error.statusCode = 404;
            throw error;
        }
        user.status = newStatus;
        await user.save();
        res.status(200).json({ message: 'User updated.' });
    }catch (err) {
        errors.handleError(err, next);
    }
};

