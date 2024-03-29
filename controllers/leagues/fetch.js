const LeagueModel = require("../../models/leagues");

module.exports = async(req, res, next) => {
    // fetch all ongoing leagues, used while listing all leagues
    try {
        const leagues = (await LeagueModel.find().populate('contesters.player') /*.populate('contesters.team')*/ ).map((league) => {
            // populate teams in future
            return {
                leagueID: league._id.toString(),
                title: league.title,
                started: league.started,
                finished: league.finished,
                contesters: league.contesters.map(contester => {
                    return {
                        // TODO: remove unneeded fields
                        fullname: contester.player.fullname,
                        // records: contester.player.records,
                        // team: contester.team,
                        // progress: contester.progress,
                        // userID: contester.player._id.toString()
                    }
                }),
                capacity: league.capacity,
                prize: league.prize,
                Mode: league.mode,
                Type: league.type,
                champion: league.champion

            }
        });
        res.status(200).json({ leagues });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}