import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true,
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    fileUrl: {
        type: String,
        required: true,
    },
    fileName: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Media = mongoose.model("Media", mediaSchema);
export default Media;
