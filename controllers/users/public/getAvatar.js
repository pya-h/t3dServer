const { Routes } = require("../../../configs");
const fs = require('fs');

module.exports = async(req, res, next) => {

    const supposedAvatar = `${req.params.userID}.jpg`;
    let avatar = `${Routes.HttpRoot}/${Routes.Avatars}/`;
    try {
        await fs.promises.access(`./public/${Routes.Avatars}/${supposedAvatar}`);
        avatar += supposedAvatar;
        // if player has avatar send then
    } catch (error) {
        console.log(error);
        avatar += 'no-avatar.png';
        // if player doesnt have an avatar yet send 'no-avatar' image to client
    }
    res.status(200).json({ avatar });

};