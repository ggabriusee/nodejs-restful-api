const { validationResult } = require('express-validator');

//to DO 

exports.validateRequest = (req) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        console.log(JSON.stringify(errors));
        const error = new Error('Validation failed!');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
};