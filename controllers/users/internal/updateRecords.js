const GAME_STATUS = { WIN: 3, DRAW: 1, LOSE: 0 };
const { StatusCodes } = require("../../../configs");
const UserModel = require("../../../models/users");

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
            case GAME_STATUS.WIN:
                userFound.records.wins++;
                break;
            case GAME_STATUS.DRAW:
                userFound.records.draws++;
                break;
            case GAME_STATUS.LOSE:
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