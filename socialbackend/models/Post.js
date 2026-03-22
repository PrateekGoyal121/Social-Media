// const mongoose = require("mongoose");

// const postSchema = new mongoose.Schema({
//     author: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//         required: true,
//     },
//     content: {
//         type: String,
//         default: "",
//     },
//     image: {
//         type: String,
//         default: "",
//     },
//     likes: [
//         {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "User",
//         },
//     ],
// });

// module.exports =  mongoose.model("Post", postSchema);


const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
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
    // ✅ tracks which users saved this post
    savedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
  },
  { timestamps: true } // ✅ adds createdAt + updatedAt (needed for comment timestamps)
);

module.exports = mongoose.model("Post", postSchema);