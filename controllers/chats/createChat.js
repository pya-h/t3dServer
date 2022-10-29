const { StatusCodes } = require('../../configs');
const ChatModel = require('../../models/chats');
const getChatID = require('./getChatID');

module.exports = async([friend1, friend2]) => {
    try {

        if (!friend1 || !friend2) {
            //check if ids exist in database?
            const error = new Error("One of the friends doesnt exist!");
            error.statusCode = StatusCodes.NotFound; //edit
            throw error;
        }

        const [chatID] = getChatID(friend1, friend2);

        const newChat = new ChatModel({
            chatID,
            messages: []
        });
        console.log(newChat);
        await newChat.save();
        return newChat._id;
    } catch (err) {
        console.log(err);
        //manage exeptions better
        return null;
    }
};