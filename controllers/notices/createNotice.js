const NoticeModel = require("../../models/notices");
const { validationResult } = require("express-validator");
const { StatusCodes } = require("../../configs");

module.exports = async(req, res, next) => {
    try {

        const { title, text } = req.body;
        let startDate = new Date(req.body.startDate),
            endDate = new Date(req.body.endDate);
        //************ */
        //COMPLETELY CHECK NOTICE IN CLIENT AND SERVER
        const errors = validationResult(req);
        if (!errors.isEmpty()) { // is it needed to check input ormat in sign in?
            const error = new Error("Payload validation failed.");
            error.statusCode = StatusCodes.UnprocessableEntity;
            error.data = errors.array();
            throw error;
        }

        if (startDate > endDate) {
            const error = new Error("Notice start date must be before its end date.");
            error.statusCode = StatusCodes.UnprocessableEntity;
            throw error;
        }
        const newNotice = new NoticeModel({
            title,
            text,
            startDate,
            endDate,
        });

        await newNotice.save();

        res.status(201).json({ msg: "Notice created." });
    } catch (err) {
        // console.log(err);
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};