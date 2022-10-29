const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const teamSchema = new Schema({

    title: {
        type: String,
        required: true,
        unique: true
    },
    created: {
        type: Date,
        default: new Date()
    },
    logo: {
        type: String,
        default: nuyll, // find sth as no-logo file for this too
    },
    prestidge: { // sth to messure teams performance so far
        type: Number,
        default: 0,
        required: true
    }
});

module.exports = mongoose.model("Teams", teamSchema);