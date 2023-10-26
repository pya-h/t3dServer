const mongoose = require("mongoose");

const { mongoUser, mongoPassword, databaseName } = process.env;
const connectionString = `mongodb+srv://${mongoUser}:${mongoPassword}@cluster0.iaxun.mongodb.net/${databaseName}?retryWrites=true&w=majority`;
// const connectionString = "mongodb://127.0.0.1:27017/t3d";

exports.connectToDB = () => {
    return mongoose.connect(connectionString);
};