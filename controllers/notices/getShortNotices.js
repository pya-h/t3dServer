const NoticeModel = require("../../models/notices");

module.exports = async (req, res, next) => {
    try {
        //just return notices that startDate<= now <= endDate
        const today = new Date();
        const notices = (await NoticeModel.find())
            .filter(
                (notice) => notice.startDate <= today && today <= notice.endDate
            )
            .map((notice) => {
                return { title: notice.title, text: notice.text };
            });
        res.status(200).json({ notices });
    } catch (err) {
        // console.log(err);
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};
