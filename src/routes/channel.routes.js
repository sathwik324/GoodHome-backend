import express from "express";
import Channel from "../models/Channel.js";
import Message from "../models/Message.js";
import Activity from "../models/Activity.js";
import User from "../models/User.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// GET /api/channels — return all channels
router.get("/", authMiddleware, async (req, res) => {
    try {
        const channels = await Channel.find();
        res.status(200).json(channels);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// GET /api/channels/:id/messages — return last 50 messages, populate sender name
router.get("/:id/messages", authMiddleware, async (req, res) => {
    try {
        const messages = await Message.find({ channelId: req.params.id })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate("sender", "name");

        res.status(200).json(messages.reverse());
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// POST /api/channels/:id/messages — create message + activity
router.post("/:id/messages", authMiddleware, async (req, res) => {
    try {
        const { text } = req.body;

        const message = await Message.create({
            channelId: req.params.id,
            sender: req.userId,
            text,
        });

        // Look up user and channel for activity description
        const user = await User.findById(req.userId);
        const channel = await Channel.findById(req.params.id);

        await Activity.create({
            type: "message_sent",
            description: `${user.name} sent a message in #${channel.name}`,
            createdBy: req.userId,
        });

        res.status(201).json(message);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
