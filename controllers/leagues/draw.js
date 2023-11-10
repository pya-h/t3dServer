const { shuffle } = require('lodash');
const { StatusCodes } = require('../../configs');

const chunkify = (list) => {
    const chunky = [];
    try {
        do {
            // this algo is based on .pop and removing item after pop
            // if pop wen wrong? ( i am sure it will throw error)!
            // use simple for? to make sure?
            const chunk = [list.pop(), list.pop()];
            /*            if (chunk.length !== 2) {
                            const error = new Error("Wrong chunk length: Something went wrong while making chunks for league's draws.");
                            error.statusCode = StatusCodes.MethodNotAllowed; //edit this; determine a suitable custom status code
                            throw error;
                        } */
            chunky.push(chunk);
        } while (list.length);
    } catch (err) {
        console.log("making chunks failed 'cause: ", err);
    }
    return chunky;
}

const first = (mode, contesters) => {
        // plan and draw all games for each round
        const draws = [];

        if (!mode) { // kickout cup mode
            if (contesters.length % 2) { // if number of contesters if an odd number
                const error = new Error("Wrong number of contesters; kickout cup must have even number of contesters");
                error.statusCode = StatusCodes.MethodNotAllowed; //edit, creat new code for this?
                throw error;
            }
            try {
                const leagueDraws = chunkify(shuffle(contesters)); // a list containing items that contain each games player IDs

                //while scheduling: put games with 5min offsets
                for (const draw of leagueDraws)
                    draws.push({ schedule: new Date(), players: [draw[0].player, draw[1].player] }); //EDIT SCHEDULE VALUE

            } catch (err) {
                console.log("league draw process failed 'cause: ", err);
            }
        }
        return draws;

    },
    next = (league, previousRoundMatches) => {
        const schedule = new Date();
        const nextRoundMatches = [];

        if (!league.mode) {
            if (previousRoundMatches.length >= 2) {
                nextRoundMatches.push({ schedule, players: [] });
                // kickout cup
                // Next round is constructed from the result of previous rounds
                // the winner of first match will encounter the winner of the second match, and so on.
                for (const match of previousRoundMatches) {
                    try {
                        // TODO: What happens if unexpectedly winnerIndex is -1?
                        if (match.game.winnerIndex < 0) {
                            // choose by throwing a coin
                            // TODO: or what?
                            match.game.winnerIndex = +((Math.random() * 10) > 5);
                        }
                        nextRoundMatches[nextRoundMatches.length - 1].players.push(match.game.players[match.game.winnerIndex].self);
                        if (nextRoundMatches[nextRoundMatches.length - 1].players.length >= 2) {
                            nextRoundMatches.push({ schedule, players: [] });
                        }
                    } catch (ex) {
                        console.log("Failed drawing next round of the league; ", ex);
                    }
                }
            } else {
                if (previousRoundMatches[0].game.winnerIndex < 0) {
                    // choose by throwing a coin
                    // TODO: or what?
                    match.game.winnerIndex = +((Math.random() * 10) > 5);
                }
                league.champion = previousRoundMatches[0].players[previousRoundMatches[0].game.winnerIndex].self;
                // TODO: check if .then .catch works correctly!
                league.save().then(r => {
                    console.log(`League:${league._id.toString()} Champion has been declared: user:${league.champion}`);
                }).catch(err => {
                    console.log("Sth went wrong when declaring the champion! reason: ", err);
                });
            }

        }
        return nextRoundMatches;
    };

module.exports = {
    first,
    next
}