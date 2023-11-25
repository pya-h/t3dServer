const UserModel = require('../../../models/users');

module.exports = async(req, res, next) => {
    try {
        const players = (await UserModel.find()).map(user => { // return userID or not? is it safe?
            return {
                userID: user._id.toString(),
                fullname: user.fullname,
                records: user.records
            }
        });
        res.status(200).json({ players });

    } catch (err) {
        // console.log(err);
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}