const GameModel = require("../../models/games");

module.exports = async(req, res, next) => {
    const userID = req.CurrentUser.id;
    try {
        // if code below didnt work => use two seperate .find
        // is it needed to CONVERT userID to ObjectID?????
        const now = new Date();
        const myGames = (await GameModel.find().populate("players.self"))
            .filter(
                (game) =>
                game.date < now && (game.players[0].self._id.toString() === userID.toString() ||
                    game.players[1].self._id.toString() === userID.toString())
            )
            .map((game) => {
                //.toString() is essential for both ids
                return {
                    gameID: game._id.toString(),
                    Type: game.type,
                    date: game.date,
                    players: game.players.map((player) => {
                        return {
                            name: player.self.fullname,
                            id: player.self._id.toString(),
                            score: player.score,
                        };
                    }),
                    isLive: game.isLive,
                    scoreless: game.scoreless
                };
            });

        res.status(200).json({ myGames });
    } catch (err) {
        // console.log(err);
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};