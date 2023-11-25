const mongoose = require("mongoose");

const { mongoUser, mongoPassword, mongoDatabaseName } = process.env;
const connectionString = `mongodb+srv://${mongoUser}:${mongoPassword}@cluster0.iaxun.mongodb.net/${mongoDatabaseName}?retryWrites=true&w=majority&authSource=admin`;
// const connectionString = "mongodb://127.0.0.1:27017/t3d";
console.log(connectionString);

const dropEverything = () => mongoose.connect(connectionString, () => mongoose.connection.db.dropDatabase());

exports.connectToDB = () => {
    // dropEverything();
    return mongoose.connect(connectionString);
};