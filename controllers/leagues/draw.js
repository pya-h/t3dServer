const _ = require('lodash');
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
module.exports = (_mode, _type, contesters) => {
    // plan and draw all games for each round
    const draws = [];

    if (_mode === 0) { // kickout cup mode
        if (contesters.length % 2) { // if number of contesters if an odd number
            const error = new Error("Wrong number of contesters; kickout cup must have even number of contesters");
            error.statusCode = StatusCodes.MethodNotAllowed; //edit, creat new code for this?
            throw error;
        }
        try {
            const leagueDraws = chunkify(_.shuffle(contesters)); // a list containing items that contain each games player IDs

            //while scheduling: put games with 5min offsets
            for (const draw of leagueDraws)
                draws.push({ schedule: new Date(), players: [draw[0].player.toString(), draw[1].player.toString()] }); //EDIT SCHEDULE VALUE

        } catch (err) {
            console.log("league draw process failed 'cause: ", err);
        }
    }
    return draws;

}