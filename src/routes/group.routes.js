import express from "express";
import Group from "../models/Group.js";
import Channel from "../models/Channel.js";
import Media from "../models/Media.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// POST /api/groups/create
router.post("/create", authMiddleware, async (req, res) => {
    try {
        const { name, description } = req.body;

        const group = await Group.create({
            name,
            description,
            owner: req.userId,
            members: [req.userId],
        });

        res.status(201).json(group);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// POST /api/groups/join
router.post("/join", authMiddleware, async (req, res) => {
    try {
        const { inviteCode } = req.body;

        const group = await Group.findOne({ inviteCode });
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        if (group.members.includes(req.userId)) {
            return res.status(400).json({ message: "Already a member" });
        }

        group.members.push(req.userId);
        await group.save();

        res.status(200).json(group);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// GET /api/groups/my
router.get("/my", authMiddleware, async (req, res) => {
    try {
        const groups = await Group.find({ members: req.userId })
            .populate("owner", "name");

        const result = groups.map((g) => ({
            ...g.toObject(),
            membersCount: g.members.length,
        }));

        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// GET /api/groups/:groupId
router.get("/:groupId", authMiddleware, async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId)
            .populate("owner", "name")
            .populate("members", "name email");

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        if (!group.members.some((m) => m._id.toString() === req.userId.toString())) {
            return res.status(403).json({ message: "Not a member of this group" });
        }

        res.status(200).json(group);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// ---- Group-scoped channels (Step 4) ----

// GET /api/groups/:groupId/channels
router.get("/:groupId/channels", authMiddleware, async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }
        if (!group.members.some((m) => m.toString() === req.userId.toString())) {
            return res.status(403).json({ message: "Not a member of this group" });
        }

        const channels = await Channel.find({ groupId: req.params.groupId });
        res.status(200).json(channels);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// POST /api/groups/:groupId/channels
router.post("/:groupId/channels", authMiddleware, async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }
        if (!group.members.some((m) => m.toString() === req.userId.toString())) {
            return res.status(403).json({ message: "Not a member of this group" });
        }

        const { name, description } = req.body;
        const channel = await Channel.create({
            name,
            description,
            groupId: req.params.groupId,
            createdBy: req.userId,
        });

        res.status(201).json(channel);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// ---- Group-scoped members (Step 6) ----

// GET /api/groups/:groupId/members
router.get("/:groupId/members", authMiddleware, async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId)
            .populate("members", "name email role");

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }
        if (!group.members.some((m) => m._id.toString() === req.userId.toString())) {
            return res.status(403).json({ message: "Not a member of this group" });
        }

        res.status(200).json(group.members);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// ---- Group-scoped media (Step 7) ----

// GET /api/groups/:groupId/media
router.get("/:groupId/media", authMiddleware, async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }
        if (!group.members.some((m) => m.toString() === req.userId.toString())) {
            return res.status(403).json({ message: "Not a member of this group" });
        }

        const media = await Media.find({ groupId: req.params.groupId })
            .populate("uploadedBy", "name");

        res.status(200).json(media);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
