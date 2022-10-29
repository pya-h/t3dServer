const { StatusCodes } = require('../../configs');
const ChatModel = require('../../models/chats');
const getChatID = require('./getChatID');
module.exports = async(req, res, next) => {
    const userID = req.CurrentUser.id;
    const friendID = req.params.friendID;
    //redundant ????????
    try {
        const [chatID, contributerIndex] = getChatID(userID, friendID);
        const chat = await ChatModel.findOne({ chatID });
        if (!chat) {
            const error = new Error('No chat between these two players has been found');
            error.statusCode = StatusCodes.NotFound;
            throw error;
        }

        res.status(200).json({ myIndex: contributerIndex, chat: chat.messages });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};