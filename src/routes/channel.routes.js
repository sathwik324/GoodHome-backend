import express from "express";
import Channel from "../models/Channel.js";
import Message from "../models/Message.js";
import Activity from "../models/Activity.js";
import User from "../models/User.js";
import Group from "../models/Group.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// ---- Backward-compatible routes ----

// GET /api/channels — return all channels (backward compat)
router.get("/", authMiddleware, async (req, res) => {
    try {
        const channels = await Channel.find();
        res.status(200).json(channels);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// GET /api/channels/:channelId/messages — return last 50 messages
router.get("/:channelId/messages", authMiddleware, async (req, res) => {
    try {
        // Verify channel exists and user is member of channel's group
        const channel = await Channel.findById(req.params.channelId);
        if (!channel) {
            return res.status(404).json({ message: "Channel not found" });
        }

        if (channel.groupId) {
            const group = await Group.findById(channel.groupId);
            if (group && !group.members.some((m) => m.toString() === req.userId.toString())) {
                return res.status(403).json({ message: "Not a member of this group" });
            }
        }

        const messages = await Message.find({ channelId: req.params.channelId })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate("sender", "name");

        res.status(200).json(messages.reverse());
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// POST /api/channels/:channelId/messages — create message + activity (backward compat)
router.post("/:channelId/messages", authMiddleware, async (req, res) => {
    try {
        const { text } = req.body;

        const channel = await Channel.findById(req.params.channelId);
        if (!channel) {
            return res.status(404).json({ message: "Channel not found" });
        }

        // Verify membership if channel has a group
        if (channel.groupId) {
            const group = await Group.findById(channel.groupId);
            if (group && !group.members.some((m) => m.toString() === req.userId.toString())) {
                return res.status(403).json({ message: "Not a member of this group" });
            }
        }

        const message = await Message.create({
            channelId: req.params.channelId,
            groupId: channel.groupId,
            sender: req.userId,
            text,
        });

        // Look up user for activity description
        const user = await User.findById(req.userId);

        await Activity.create({
            type: "message_sent",
            description: `${user.name} sent a message in #${channel.name}`,
            groupId: channel.groupId,
            createdBy: req.userId,
        });

        res.status(201).json(message);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
