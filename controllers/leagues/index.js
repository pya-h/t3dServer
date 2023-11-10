const create = require("./create");
const join = require("./join");
const fetch = require('./fetch');
const load = require('./load');
const { schedule } = require('node-cron');
const LeagueModel = require("../../models/leagues");
const draw = require("./draw");

schedule('* * * * *', async() => {
    // runs every day at 04:19 === 4 19 * * *
    try {
        console.log("starting to check leagues!");
        const leagues = await LeagueModel.find().populate('matches.game').populate('matches.game.players');
        for (const league of leagues) {
            if (!league.finished && league.matches.length) {
                const recentRound = league.matches[league.currentRound];
                // if at least a day is passed from the round, then its time for next round calculations
                let itsTimeForNextRound = !league.finished && league.started && recentRound.length && (new Date(recentRound[0].schedule).toDateString() !== new Date().toDateString());
                // if its the same day, check if all matches are finished
                if (!itsTimeForNextRound) {
                    let matchesCompleted = 0;
                    for (matchesCompleted = 0; matchesCompleted < recentRound.length &&
                        recentRound[matchesCompleted].game && recentRound[matchesCompleted].game.finished; matchesCompleted++);
                    itsTimeForNextRound = matchesCompleted === recentRound.length;
                }
                if (itsTimeForNextRound) {
                    // all that means that the date of the round has passed
                    try {
                        const nextRoundMatches = draw.next(league, recentRound);
                        if (nextRoundMatches.length) {
                            league.matches.push([...nextRoundMatches]);
                            league.currentRound++;
                        } else {
                            // winner declared
                            // TODO: ???
                            // does this need league.save()?
                        }
                        await league.save();
                        console.log(`next round drawn for league:${league._id.toString()} done at ${(new Date()).toUTCString()}`);

                        // TODO: NOTIFY CONTESTERS
                    } catch (err) {
                        console.log("saving draws in the leagues database failed 'cause:\t", err);
                    }
                }
            }
        }
    } catch (err) {
        console.log(err);
    }
});

module.exports = {
    join,
    create,
    fetch,
    load,
}