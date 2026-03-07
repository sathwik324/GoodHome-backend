import express from "express";
import crypto from "crypto";
import Group from "../models/Group.js";
import Channel from "../models/Channel.js";

const router = express.Router();

// POST /api/groups/create
router.post('/create', async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) return res.status(400).json({ message: 'Group name is required' });

        const group = new Group({
            name,
            description: description || '',
            owner: req.userId,
            members: [req.userId]
        });

        await group.save();

        const defaultChannels = ['general', 'announcements', 'random'];
        await Promise.all(
            defaultChannels.map(channelName =>
                Channel.create({ name: channelName, groupId: group._id, createdBy: req.userId })
            )
        );

        console.log('Group created:', group._id);
        res.status(201).json(group);
    } catch (err) {
        console.error('Error creating group:', err);
        res.status(500).json({ message: err.message });
    }
});

// POST /api/groups/join
router.post("/join", async (req, res) => {
    try {
        const { inviteCode } = req.body;

        if (!inviteCode) {
            return res.status(400).json({ message: "Invite code is required" });
        }

        const group = await Group.findOne({ inviteCode });
        if (!group) {
            return res.status(404).json({ message: "Invalid invite code" });
        }

        if (group.members.includes(req.userId)) {
            return res.status(400).json({ message: "Already a member" });
        }

        group.members.push(req.userId);
        await group.save();

        res.status(200).json(group);
    } catch (err) {
        console.error('Error in POST /api/groups/join:', err);
        return res.status(500).json({ message: err.message });
    }
});

// GET /api/groups/my
router.get("/my", async (req, res) => {
    try {
        const groups = await Group.find({ members: req.userId })
            .populate("owner", "name");

        res.status(200).json(groups || []);
    } catch (err) {
        console.error('Error in GET /api/groups/my:', err);
        return res.status(500).json({ message: err.message });
    }
});

// GET /api/groups/:groupId
router.get("/:groupId", async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId)
            .populate("owner", "name")
            .populate("members", "name");

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        if (!group.members.some((m) => m._id.toString() === req.userId.toString())) {
            return res.status(403).json({ message: "Not a member" });
        }

        res.status(200).json(group);
    } catch (err) {
        console.error('Error in GET /api/groups/:groupId:', err);
        return res.status(500).json({ message: err.message });
    }
});

// GET /api/groups/:groupId/invite
router.get("/:groupId/invite", async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        const isMember = group.members.some((m) => m.toString() === req.userId.toString());
        if (!isMember) return res.status(403).json({ message: 'Not a member' });

        res.json({ inviteCode: group.inviteCode, groupName: group.name });
    } catch (err) {
        console.error('Error fetching invite:', err);
        res.status(500).json({ message: err.message });
    }
});

export default router;
