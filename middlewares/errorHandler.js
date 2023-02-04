const { StatusCodes } = require("../configs");

exports.errorHandler = (error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || StatusCodes.InternalServerError;
    const message = error.message;
    const data = error.data;
    req.CurrentError = message; //temp: to log error in morgan
    // above code: not working! why?
    res.status(status).json({ message, data });
};
