const bcryptjs = require("bcryptjs");
const { validationResult } = require("express-validator");
const UserModel = require("../../../models/users");
const { generateToken } = require("../../../middlewares/authenticate");
const { StatusCodes } = require("../../../configs");
// const { sendEmail } = require('../utils/mailer');
const SALT_LENGTH = 11;

module.exports = async(req, res, next) => {
    try {
        const { studentID, email, fullname, password } = req.body;
        const errors = validationResult(req);
        if (!errors.isEmpty()) { // is it needed to check input ormat in sign in?
            const error = new Error("Payload validation failed.");
            error.statusCode = StatusCodes.UnprocessableEntity;
            error.data = errors.array();
            throw error;
        }
        const userFound =
            (await UserModel.findOne({ studentID })) ||
            (await UserModel.findOne({ email }));
        if (userFound) {
            const error = new Error(
                "A user with this Student ID or Email has registered before"
            );
            error.statusCode = StatusCodes.Conflict; // already exists
            throw error;
        }

        const hashedPassword = await bcryptjs.hash(password, SALT_LENGTH);
        const userCount = await UserModel.find().countDocuments();
        let user = new UserModel({
            studentID,
            email,
            fullname,
            password: hashedPassword,
            isAdmin: !Boolean(userCount),
        });
        await user.save();

        const token = await generateToken(user);

        res.status(201).json({ token, userID: user._id.toString() });
        // sendEmail(
        //     user.email,
        //     user.fullname,
        //     'Signup was seccessfull.',
        //     'We glad to have you on board.'
        // )
    } catch (err) {
        // console.log(err);
        if (!err.statusCode) {
            err.statusCode = StatusCodes.InternalServerError;
        }
        next(err);
    }
};