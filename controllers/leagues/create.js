const LeagueModel = require("../../models/leagues");

module.exports = async(req, res, next) => {
    try {
        const { Mode, title, capacity, prize, scoreless, dimension } = req.body;
        const league = new LeagueModel({
            _mode: Mode,
            _type: {
                scoreless,
                dimension
            },
            title,
            contesters: [],
            capacity,
            prize
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