const GameModel = require("../../models/games");

module.exports = async(req, res, next) => {
    try {
        const now = new Date();
        const allGames = (await GameModel.find().populate("players.self"))
            .filter((game) => game.date < now)
            .map((game) => {
                return {
                    gameID: game._id.toString(),
                    Type: game._type,
                    date: game.date,
                    players: game.players.map((player) => {
                        return {
                            name: player.self.fullname,
                            score: player.score,
                        };
                    }),
                    isLive: game.isLive,
                };
            });

        res.status(200).json({ allGames });
    } catch (err) {
        // console.log(err);
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};