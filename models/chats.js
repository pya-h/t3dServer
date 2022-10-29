const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const chatRoomSchema = new Schema({
    chatID: {
        type: String,
        required: true,
        unique: true
    },
    messages: [{
        text: {
            type: String,
            required: true,
        },
        date: {
            type: String,
            required: true
        },
        owner: { //the one who sent the message, 0: smallerID, 1: biggerID
            type: Number, //contributer index
            //when client delivers the messages --> .splits the chatID and finds his/her contributer index
            required: true,
        }
    }]
});

module.exports = mongoose.model('Chats', chatRoomSchema);