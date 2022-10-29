const NoticeModel = require('../../models/notices');

module.exports = async(req, res, next) => {
    try {
        const notices = (await NoticeModel.find());
        res.status(200).json({ notices });

    } catch (err) {
        // console.log(err);
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}