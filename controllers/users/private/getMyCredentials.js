const { StatusCodes } = require("../../../configs");
const UserModel = require("../../../models/users");
// get user public info == player records
module.exports = async(req, res, next) => {
    try {
        const userID = req.CurrentUser.id; // i didnt use req.params
        //i think its better to use the id extracted from token (via tokenManager)
        // cause: if you use /:userID, any one can get opthers credentials with their own token and some one else's userID
        const userFound = await UserModel.findById(userID);

        if (!userID || !userFound) {
            const error = new Error("No user has been found");
            error.statusCode = StatusCodes.NotFound;
            throw error;
        }
        const me = {
            userID: userFound._id.toString(),
            studentID: userFound.studentID,
            fullname: userFound.fullname,
            email: userFound.email,
            isAdmin: userFound.isAdmin,
        };

        res.status(200).json({ me });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = StatusCodes.InternalServerError;
        }
        next(err);
    }
};