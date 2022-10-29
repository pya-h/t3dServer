module.exports = async(req, res, next) => {
    try {
        res.status(200).json({ msg: 'your avatar uploaded successfully' });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};