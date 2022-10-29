const { StatusCodes } = require("../../configs");
const ChatModel = require("../../models/chats");
const getChatID = require("./getChatID");

module.exports = async(sender, receiver, text) => {
    try {
        const [chatID, contributerIndex] = getChatID(sender, receiver);

        const chat = await ChatModel.findOne({ chatID });
        if (!chat) { //because the search wasnt by id 
            const error = new Error("No chatroom between these two players has been found");
            error.statusCode = StatusCodes.NotFound;
            throw error;
        }

        chat.messages.push({
            text,
            owner: contributerIndex,
            date: new Date()
        });
        await chat.save();
        return true;

    } catch (err) {
        console.log(err);
        //manage exeptions better
        return false;
    }
};