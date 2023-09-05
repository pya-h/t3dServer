const GameModel = require("../../models/games");
const LeagueModel = require("../../models/leagues");
const mongoose = require("mongoose");
const { StatusCodes } = require("../../configs");
//module.exports = async (req, res, next) => {
module.exports = async(playerX, playerO, Type, isLive = true, leagueID = null) => {
    try {
        // check data another time to make sure
        // userIDs may be changed ==> must be
        // what to do for isLive?
        if (!playerX || !playerO) {
            //check if ids exist in database?
            const error = new Error("Each player must be online!");
            error.statusCode = StatusCodes.NotFound; //edit
            throw error;
        }

        const newGame = new GameModel({
            players: [playerX, playerO].map(each => { return { self: mongoose.Types.ObjectId(each), score: 0 } }),
            _type: Type,
            date: new Date(),
            isLive,
            league: leagueID ? mongoose.Types.ObjectId(leagueID) : null
        });
        await newGame.save();
        return { gameID: newGame._id };
    } catch (err) {
        console.log(err);
        //manage exeptions better
        return null;
    }
};
