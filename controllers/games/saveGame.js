const { StatusCodes, GameRules } = require("../../configs");
const GameModel = require("../../models/games");

module.exports = async(gameID, X, O, finished = false, isLive = true) => {
    try {
        let game = await GameModel.findById(gameID).populate("league");
        if (!game) {
            const error = new Error("No game with this id has been found");
            error.statusCode = StatusCodes.NotFound;
            throw error;
        }
        // update game
        // verification step:
        // 1. gameID verification
        // 2. X.id && O.id verif
        // use foreach, but first check if foreach paraneter is byRef pr byVal
        if ( //fix bug
            X.id === game.players[0].self.toString() && //its not populated => so .self is actually the id
            O.id === game.players[1].self.toString() && //check player IDs are true- otherwise request is unauthorized
            game.isLive // when isLive is set to false means game ended and there is no updating accepted
        ) {
            game.players[0].score = X.score;
            game.players[1].score = O.score;
            game.isLive = !finished ? isLive : false;
            game.finished = finished;
        } else {
            const error = new Error("Unauthorized request");
            error.statusCode = StatusCodes.Forbidden; //means forbidden:
            // use another code?
            throw error;
        }

        await game.save();

        // TODO: move this code to league controller
        if (finished) {
            if (game.league) {
                for (let i = 0; i < game.players.length; i++) {
                    const ci = game.league.contesters.findIndex(
                        (c) => c.player.toString() === game.players[i].self.toString()
                    );
                    if (ci !== -1) {
                        const j = (i + 1) % 2; // other player's index
                        game.league.contesters[ci].progress.wins += +(
                            game.players[i].score > game.players[j].score
                        );
                        game.league.contesters[ci].progress.draws += +(
                            game.players[i].score === game.players[j].score
                        );
                        game.league.contesters[ci].progress.loses += +(
                            game.players[i].score < game.players[j].score
                        );

                        // calculate CONTESTER SCORE  based on the league type and the number of wins and draws
                        // score = wins * 3 + draws?
                        if (game.league.mode > 0) {
                            // mode 0 is the kickout league that score is not important there!
                            game.league.contesters[ci].progress.score =
                                game.league.contesters[ci].progress.wins *
                                GameRules.T3D.GameStatusScores.WIN +
                                game.league.contesters[ci].progress.draws *
                                GameRules.T3D.GameStatusScores.DRAW +
                                game.league.contesters[ci].progress.loses *
                                GameRules.T3D.GameStatusScores.LOSE; // in case losing has a negative score!}
                        }
                        // console.log(game.league.contesters[ci]);
                    }
                    await game.league.save();
                }

            }
            game.winnerIndex = game.players[0].score > game.players[1].score ? 0 : (
                game.players[1].score > game.players[0].score ? 1 : -1
            );
            await game.save();
        }
    } catch (err) {
        console.log(err);
        //manage exeptions better**************
    }
};
