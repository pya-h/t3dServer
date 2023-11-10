const { StatusCodes } = require("../../../configs");
const UserModel = require("../../../models/users");
const { GameStatusScores } = require('../../../configs/game')
    //folder description: Modules that are called ONLY by server and cannot be called by http requests

module.exports = async(userID, achievement) => {
    try {
        const userFound = await UserModel.findById(userID);
        if (!userFound) {
            const error = new Error("One of the players wasnt found");
            error.statusCode = StatusCodes.NotFound;
            throw error;
        }

        switch (achievement) {
            case GameStatusScores.WIN:
                userFound.records.wins++;
                break;
            case GameStatusScores.DRAW:
                userFound.records.draws++;
                break;
            case GameStatusScores.LOSE:
                userFound.records.loses++;
                break;
            default:
                const error = new Error("Game result is wronge... forbidden operation!");
                error.statusCode = StatusCodes.Forbidden;
                throw error;
        }

        userFound.records.points += achievement;
        await userFound.save();
    } catch (err) {
        console.log(err);
        if (!err.statusCode) err.statusCode = StatusCodes.InternalServerError;
        //next(err); good idea?
    }
};