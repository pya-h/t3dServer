const UserModel = require('../../../models/users');
const { Routes, StatusCodes } = require("../../../configs");
const fs = require('fs');
// get user public info == player records

module.exports = async(playerID) => {
    const userFound = await UserModel.findById(playerID);
    if (!userFound) {
        const error = new Error('No user has been found');
        error.statusCode = StatusCodes.NotFound;
        throw error;
    }
    const supposedAvatar = `${userFound._id.toString()}.jpg`;
    let avatar = `${Routes.HttpRoot}/${Routes.Avatars}/`;
    try {
        await fs.promises.access(`./public/${Routes.Avatars}/${supposedAvatar}`);
        avatar += supposedAvatar;
        // if player has avatar send then
    } catch (error) {
        avatar += 'no-avatar.png';
        // if player doesnt have an avatar yet send 'no-avatar' image to client
    }

    return {
        userID: userFound._id.toString(),
        fullname: userFound.fullname,
        records: userFound.records,
        avatar,
        isAdmin: userFound.isAdmin
    }
}