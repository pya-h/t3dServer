const { StatusCodes } = require('../../configs');
const UserModel = require('../../models/users');
const getChatID = require('./getChatID');
const fs = require('fs');

module.exports = async(req, res, next) => {
    const myID = req.CurrentUser.id;
    try {
        const me = await UserModel.findById(myID).populate("friends.self").populate("friends.chat");
        if (!me) {
            const error = new Error('No user with this id has been found');
            error.statusCode = StatusCodes.NotFound;
            throw error;
        }

        const interactions = me.friends.map(friend => {
            const { self, chat } = friend;
            const { messages } = chat;
            const friendID = self._id.toString();
            const [chatID, ownerOf] = getChatID(myID, friendID);
            //messages werent format here, because that means another .map withen a .map and for large amount of users i think its not good
            //I devided process within two part, one is formatting friend (its necessary because the version we have here contains credentials)
            // second part of the process is achieved in client side
            // server just sends an index named 'ownerOf' to determine wich message belongs to him/her
            return {
                friend: { name: self.fullname, userID: friendID, records: self.records },
                messages,
                ownerOf
            }
        })

        res.status(200).json({ interactions });
    } catch (err) {
        console.log(err);
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};
