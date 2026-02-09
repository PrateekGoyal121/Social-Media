const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    content: {
        type: String,
        default: "",
    },
    image: {
        type: String,
        default: "",
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
});

module.exports =  mongoose.model("Post", postSchema);

