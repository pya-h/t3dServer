const GameModel = require("../../models/games");

module.exports = async(gameID) => {
    try {
        const game = await GameModel.findById(gameID);
        return game;
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};