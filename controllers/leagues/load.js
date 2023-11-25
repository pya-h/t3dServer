const { StatusCodes } = require("../../configs");
const LeagueModel = require("../../models/leagues");

module.exports = async(req, res, next) => {
    // fetch all ongoing leagues
    const { leagueID } = req.params;
    try {
        const leagueFound = await LeagueModel.findById(leagueID).populate('contesters.player')
            .populate('matches.game'); //.populate('matches.game.players.self'); // CHECK: IS IT NEEDED?
        /* there are two methods here:
            1- first populate all data and sent it as a one time response. features: high traffic data; more process
            2- just send league as it is; each time user needs to see prev match ruslts he/she can send an independent request to games route.
                features: less traffic; less process here; but many more requests must be handled and a lot of processing happens there
        */
        if (!leagueFound) {
            const error = new Error('No league has been found');
            error.statusCode = StatusCodes.NotFound;
            throw error;
        }

        const league = {
            title: leagueFound.title,
            started: leagueFound.started,
            finished: leagueFound.finished,
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
            champion: leagueFound.champion
        }
        res.status(200).json({ league });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}