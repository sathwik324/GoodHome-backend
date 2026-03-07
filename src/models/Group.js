import mongoose from "mongoose";
import crypto from "crypto";

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: "",
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    inviteCode: {
        type: String,
        unique: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Auto-generate inviteCode before saving
groupSchema.pre("save", function (next) {
    if (!this.inviteCode) {
        this.inviteCode = crypto.randomBytes(4).toString("hex"); // 8 hex chars
    }
    next();
});

const Group = mongoose.model("Group", groupSchema);
export default Group;
