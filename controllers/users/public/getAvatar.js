const { Routes } = require("../../../configs");
const fs = require('fs');
const getAvatarPath = require('../internal/getAvatarPath');

module.exports = async(req, res, next) => {
    const avatar = await getAvatarPath(`${req.params.userID}.jpg`);
    res.status(200).json({ avatar });
};