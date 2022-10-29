const mongoose = require("mongoose");
const { StatusCodes } = require("../../../configs");
const UserModel = require("../../../models/users");
const { createChat } = require('../../chats');
const areFriends = (person, sbFriends) =>
    Boolean(sbFriends.filter((friend) => person.toString() === friend.toString()).length); //.toString() is essential for both ids

module.exports = async(IDs) => {
    try {
        if (IDs.length !== 2) {
            const error = new Error(
                "ID array list must contain both friends id"
            ); //status code doesnt work!?
            error.statusCode = StatusCodes.Forbidden; //change
            throw error;
        }
        let persons = [];
        for (const eachID of IDs) {
            const eachUser = await UserModel.findById(eachID);
            if (!eachUser) {
                const error = new Error("One of the players wasnt found");
                error.statusCode = StatusCodes.NotFound;
                throw error;
            }
            persons.push(eachUser);
        }

        if (areFriends(IDs[0], persons[1].friends) || areFriends(IDs[1], persons[0].friends)) {
            const error = new Error("These two were friends before");
            error.statusCode = StatusCodes.NotFound;
            throw error;
        }
        //if every thing ok till here and these two are'nt friends
        //create new chat
        const chatID = await createChat(IDs);
        if (!chatID) {
            const error = new Error("Unknown error happened friending them");
            error.statusCode = StatusCodes.NotFound; // specify a proper code
            throw error;
        }
        const chatLink = mongoose.Types.ObjectId(chatID);
        for (let index = 0; index < IDs.length; index++) {
            const friendID = IDs[Number(!index)];
            const friendsObjectID = mongoose.Types.ObjectId(friendID);
            persons[index].friends.push({ self: friendsObjectID, chat: chatLink });
            persons[index].save();
        }
    } catch (err) {
        console.log(err);
    }
};