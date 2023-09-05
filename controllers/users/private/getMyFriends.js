const UserModel = require("../../../models/users");

module.exports = async(req, res, next) => {
    try {
        // returns friends without any extra info
        const userID = req.CurrentUser.id;
        const user = await UserModel.findById(userID).populate("friends.self");
        const friends = user.friends.map((friend) => {
            return {
                userID: friend.self._id.toString(),
                fullname: friend.self.fullname,
                records: friend.self.records,
            };
        });
        res.status(200).json({ friends });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};