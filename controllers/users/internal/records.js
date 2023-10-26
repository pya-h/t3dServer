const UserModel = require('../../../models/users');
const { Routes, StatusCodes } = require("../../../configs");
const fs = require('fs');
const getAvatarPath = require('./getAvatarPath');
// get user public info == player records

module.exports = async(playerID) => {
    const userFound = await UserModel.findById(playerID);
    if (!userFound) {
        const error = new Error('No user has been found');
        error.statusCode = StatusCodes.NotFound;
        throw error;
    }
    const avatar = await getAvatarPath(`${userFound._id.toString()}.jpg`);
    console.log(avatar)
    return {
        userID: userFound._id.toString(),
        fullname: userFound.fullname,
        records: userFound.records,
        avatar,
        isAdmin: userFound.isAdmin
    }
}