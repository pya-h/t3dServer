const mongoose = require("mongoose");

// const { mongouser, mongopass } = process.env;
// const connectionString = "mongodb+srv://t3d:iust666cee@cluster0.iaxun.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const connectionString = "mongodb://127.0.0.1:27017/t3d";
// const connectionString = "mongodb://root:VE8u7YdMw5EN2SvocrNMaV70@t3ddb:27017/my-app?authSource=admin";

exports.connectToDB = () => {
    return mongoose.connect(connectionString);
};
