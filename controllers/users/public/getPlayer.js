const records = require("../internal/records");

// get user public info == player records
module.exports = async(req, res, next) => {
    try {
        const player = await records(req.params.userID)
        res.status(200).json({ player });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};