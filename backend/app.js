const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer'); // for file uploads

const feedRouts = require('./routes/feed');
const authRouts = require('./routes/auth');

const app = express();

const fileStorage = multer.diskStorage({
    //file - info about file multer detected
    //cb - callback to call when done setting destination by passing error and destination path
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        //'yyyy-MM-dd_HH-mm-ss-SSS'
        const d = new Date();
        const dformat = [d.getFullYear(), d.getMonth()+1, d.getDate(),].join('-')+'_'+
           [d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()].join('-');
        cb(null, dformat + '_' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg'){
        cb(null, true); // valid file
    }else{
        cb(null, false); // invalid file
    }
}

app.use(express.json());
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
})

app.use('/feed', feedRouts);
app.use('/auth', authRouts);

app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({message: message, data: data});
})

mongoose.connect(`mongodb+srv://${process.env.DB_USRNAME}:${process.env.DB_PASSWORD}@cluster0.ql6xl.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`)
.then(result => {
    app.listen(process.env.PORT || 8080);
})
.catch(err => console.log(err));