const fs = require('fs');
const path = require('path');

const Post = require('../models/post');
const User = require('../models/user');

const errors = require('../utils/errors');
const validation = require('../utils/validation');

exports.getPosts = (req, res, next) => {
    //with pagination
    const currentPage = req.query.page || 1;
    const perPage = 2; //should pass this back to frontend because must be same in front end
    let totalItems;
    Post.find().countDocuments()
    .then(count => {
        totalItems = count;
        return Post.find()
            .populate('creator')
            .skip((currentPage-1) * perPage)
            .limit(perPage);
    })
    .then(posts => {
        res.status(200).json({
            message: 'Fetched posts successesfully', 
            posts: posts,
            totalItems: totalItems
        });
    })
    .catch(err => errors.handleError(err, next));
};

exports.createPost = (req, res, next) => {
    validation.validateRequest(req);
    if(!req.file){
        const error = new Error('No image provided.');
        error.statusCode = 422;
        throw error;
    }
    const imageUrl = req.file.path;
    const title = req.body.title;
    const content = req.body.content;
    let creator;

    //create post in db
    const post = new Post({
        //_id: new Date().toISOString(), mongodb adds this automatically by default
        title: title, 
        content: content,
        imageUrl: imageUrl,
        creator: req.userId
        //createdAt: new Date() adds this automatically because in the models/post.js specified timestamps: true
    });
    post.save().then(result => {
        return User.findById(req.userId);
    })
    .then(user => {
        creator = user;
        user.posts.push(post);
        return user.save();
    })
    .then(result => {
        res.status(201).json({
            message: "succsefully created post",
            post: post,
            creator: {_id: creator._id, name: creator.name}
        });
    }).catch(err => errors.handleError(err, next));
};

exports.getPost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
    .then(post => {
        if(!post){
            const error = new Error('Could not find post.');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({message: 'Post fetched', post: post});
    })
    .catch(err => errors.handleError(err, next));
};

exports.updatePost = (req, res, next) => {
    const postId = req.params.postId;
    validation.validateRequest(req);
    const title = req.body.title;
    const content = req.body.content;
    const imageUrl = req.file ? req.file.path : req.body.image;
    if(!imageUrl){
        const error = new Error('No file picked.');
        error.statusCode = 422;
        throw error;
    }
    Post.findById(postId)
    .then(post => {
        if(!post){
            const error = new Error('Could not find post.');
            error.statusCode = 404;
            throw error;
        }
        if(post.creator.toString() !== req.userId){
            const error = new Error('Not authorized!');
            error.statusCode = 403;
            throw error;
        }

        post.title = title;
        post.content = content;
        if(imageUrl !== post.imageUrl){
            clearImage(post.imageUrl);
            post.imageUrl = imageUrl;
        }
        
        return post.save();
    })
    .then(result => {
        res.status(200).json({message: 'Post updated!', post: result});
    })
    .catch(err => errors.handleError(err, next));
};

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
    .then(post => {
        if(!post){
            const error = new Error('Could not find post.');
            error.statusCode = 404;
            throw error;
        }
        //check logged in user
        if(post.creator.toString() !== req.userId){
            const error = new Error('Not authorized!');
            error.statusCode = 403;
            throw error;
        }
        clearImage(post.imageUrl);
        return Post.findByIdAndRemove(postId);
    })
    .then(result => {
        return User.findById(req.userId);
    })
    .then(user => {
        user.posts.pull(postId);
        return user.save();
    })
    .then(user => {
        res.status(200).json({message: 'Post deleted!'});
    })
    .catch(err => errors.handleError(err, next));
};

const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err)); //delete file
};