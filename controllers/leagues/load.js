const { StatusCodes } = require("../../configs");
const LeagueModel = require("../../models/leagues");

module.exports = async(req, res, next) => {
    // fetch all ongoing leagues
    const { leagueID } = req.params;
    try {
        const leagueFound = await LeagueModel.findById(leagueID).populate('contesters.player');
        if (!leagueFound) {
            const error = new Error('No league has been found');
            error.statusCode = StatusCodes.NotFound;
            throw error;
        }

        const league = {
            title: leagueFound.title,
            started: leagueFound.started,
            matches: leagueFound.matches,
            contesters: leagueFound.contesters.map(contester => {
                return {
                    fullname: contester.player.fullname,
                    records: contester.player.records,
                    team: contester.team,
                    progress: contester.progress,
                    userID: contester.player._id.toString()
                }
            }),
            capacity: leagueFound.capacity,
            prize: leagueFound.prize,
            Mode: leagueFound.mode,
            Type: leagueFound.type,
            round: leagueFound.currentRound,
            championIndex: leagueFound.championIndex
        }
        res.status(200).json({ league });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}