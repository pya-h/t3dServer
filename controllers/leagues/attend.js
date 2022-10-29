const LeagueModel = require("../../models/leagues");
const { StatusCodes } = require("../../configs");
const { createGame } = require("../games");

module.exports = async(req, res, next) => {
    // fetch all ongoing leagues
    const { leagueID } = req.params;
    try {
        console.log("league attend req was sent.");
        const league = await LeagueModel.findById(leagueID);
        if (!league) {
            const error = new Error("No league has been found");
            error.statusCode = StatusCodes.LeagueNotFound;
            throw error;
        }
        const userID = req.CurrentUser.id;
        // now search if attender has game in this league
        const { matches } = league;
        const correspondingMatch = matches[matches.length - 1].find((match) =>
            match.players.find((playerID) => playerID === userID)
        );
        if (correspondingMatch) {
            console.log("one corresponding match found");

            if (new Date(correspondingMatch.schedule) <= new Date()) { // meaning that the game time has started
                console.log("gathering data for user");

                if (!correspondingMatch.gameID) {
                    // if this player is the first attendant
                    const { gameID } = await createGame(
                        correspondingMatch.players[0],
                        correspondingMatch.players[1],
                        league._type.dimension,
                        true
                    );
                    correspondingMatch.gameID = gameID;
                    await league.save();
                } // else: just send the gameID to the requester, if the game is not expired
                else {
                    // check game game not passed an hour
                    // check game is still live (isLive)
                    // and check other things like players in the game field to math the league data

                }
            } else {
                const error = new Error("Game is not started yet!");
                error.statusCode = StatusCodes.NotStartedYet;
                throw error;
            }
        } else {
            const error = new Error(
                "No match has been found for this user in this league"
            );
            error.statusCode = StatusCodes.MatchNotFound;
            throw error;
        }
        res.status(200).json({ gameID: correspondingMatch.gameID });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = StatusCodes.InternalServerError;
        }
        next(err);
    }
};