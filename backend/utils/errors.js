//TO DO error handling

exports.handleError = (err, next) => {
    if (!err.statusCode){
        err.statusCode = 500;
    }
    next(err); // can't throw err because inside of a promise chain a.k.a async code snippet
};