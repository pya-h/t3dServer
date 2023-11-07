const LeagueModel = require("../../models/leagues");

module.exports = async(req, res, next) => {
    try {
        const { Mode, title, capacity, prize, scoreless, dimension, details } = req.body;
        const league = new LeagueModel({
            mode: Mode,
            type: {
                scoreless,
                dimension
            },
            title,
            contesters: [],
            capacity,
            prize,
            details
        });
        await league.save();
        res.status(201).json({ msg: 'league created successfully' });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}