const { StatusCodes } = require("../../configs");
const LeagueModel = require("../../models/leagues");
const draw = require("./draw");

module.exports = async(req, res, next) => {
    try {
        const { leagueID } = req.params; //if teamID not sent, means the league is player-player
        const { teamID } = req.body;
        const playerID = req.CurrentUser.id;
        const league = await LeagueModel.findById(leagueID);

        if (league.contesters.length < league.capacity) {
            // now sign up here
            // search if user hasnt joined the league bnefore
            for (const contester of league.contesters) {
                if (contester.player.toString() === playerID.toString()) { //this means the user has joined before}
                    const error = new Error('player has joined before');
                    error.statusCode = StatusCodes.Conflict; //405: Conflict
                    throw error;
                }
            }
            league.contesters.push({ player: playerID, points: 0, team: teamID }); //
            await league.save();

            // // FIND A BETTER ALGO TO START PLANNING AND DRAWING**************
            // if (league.contesters.length === league.capacity) {
            //     // sign up for league is completed
            //     // call a planning algorythm to plan first round games of the league
            //     const { _mode, _type, contesters } = league;

            //     const currentRountDrawsAsPromised = [draw(_mode, _type.dimension, contesters)];
            //     // draws for this round have been returned as promises; so they need to be handled by .then .catch
            //     Promise.all(currentRountDrawsAsPromised).then(promises => {
            //         for (const rawDraws of promises) {
            //             const matches = rawDraws.map(game => game.gameID);
            //             league.matches.push([...matches]);
            //         }
            //         league.started = new Date();
            //         league.save().then((result) => {
            //             console.log("capacity fulfilled and first round of the league has been drawn successfully.");
            //         }).catch(err => {
            //             console.log("capacity fulfilled but first round draws failed 'cause:\n\t", err);

            //         });

            //     }).catch(err => {
            //         console.log("saving draws in the leagues database failed 'cause:\t", err);
            //     });
            // }

            // FIND A BETTER ALGO TO START PLANNING AND DRAWING**************
            if (league.contesters.length === league.capacity) {
                // sign up for league is completed
                // call a planning algorythm to plan first round games of the league
                const { _mode, _type, contesters } = league;

                try {
                    const firstRoundDraws = draw(_mode, _type.dimension, contesters);
                    // draws for this round have been returned as promises; so they need to be handled by .then .catch
                    console.log(firstRoundDraws);
                    // const draws = firstRoundDraws.map(game => game.gameID);
                    league.matches.push([...firstRoundDraws]);
                    league.started = new Date();
                    await league.save();
                    console.log("capacity fulfilled and first round of the league has been drawn successfully.");
                } catch (err) {
                    console.log("saving draws in the leagues database failed 'cause:\t", err);
                }
            }

        } else {
            const error = new Error('This league\'s joining window is closed.');
            error.statusCode = StatusCodes.MethodNotAllowed; //MethodNotAllowed
            throw error;
        }

        res.status(200).json({ msg: "successfully joined in the league." });
    } catch (err) {

        if (!err.statusCode) {
            err.statusCode = StatusCodes.InternalServerError;
        }
        next(err);
    }
}