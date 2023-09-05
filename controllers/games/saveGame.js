const { StatusCodes } = require("../../configs");
const GameModel = require("../../models/games");

module.exports = async(gameID, xID, oID, xScore, oScore, isLive) => {
    try {
        console.log(gameID);
        const game = await GameModel.findById(gameID);
        if (!game) {
            const error = new Error("No game with this id has been found");
            error.statusCode = StatusCodes.NotFound;
            throw error;
        }

        // update game
        // verification step:
        // 1. gameID verification
        // 2. xID && oID verif
        // use foreach, but first check if foreach paraneter is byRef pr byVal
        if (
            xID.toString() === game.players[0].self.toString() && //its not populated => so .self is actually the id
            oID.toString() === game.players[1].self.toString() && //check player IDs are true- otherwise request is unauthorized
            game.isLive // when isLive is set to false means game ended and there is no updating accepted
        ) {
            game.players[0].score = xScore;
            game.players[1].score = oScore;
            game.isLive = isLive;
        } else {
            const error = new Error("Unauthorized request");
            error.statusCode = StatusCodes.Forbidden; //means forbidden:
            // use another code?
            throw error;
        }
        await game.save();
        // console.log(game);
        // res.status(200).json({ message: "game result updated." });
    } catch (err) {
        console.log(err);
        //manage exeptions better
    }
};