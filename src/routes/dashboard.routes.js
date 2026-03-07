import express from "express";
import Message from "../models/Message.js";
import Event from "../models/Event.js";
import Activity from "../models/Activity.js";
import Group from "../models/Group.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// GET /api/dashboard?groupId=xxx — return group-scoped stats
router.get("/", authMiddleware, async (req, res) => {
    try {
        const { groupId } = req.query;

        // If no groupId, return empty so frontend can show "join a group" state
        if (!groupId) {
            return res.status(200).json({ groups: [] });
        }

        // Verify user is member of group
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }
        if (!group.members.some((m) => m.toString() === req.userId.toString())) {
            return res.status(403).json({ message: "Not a member of this group" });
        }

        const totalMembers = group.members.length;

        // messagesToday: messages in that group created today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const messagesToday = await Message.countDocuments({
            groupId,
            createdAt: { $gte: startOfDay },
        });

        // upcomingEvents: events in that group with date >= today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcomingEvents = await Event.countDocuments({
            groupId,
            date: { $gte: today },
        });

        // recentActivity: last 5 activity docs for that group
        const recentActivity = await Activity.find({ groupId })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("createdBy", "name");

        res.status(200).json({
            totalMembers,
            messagesToday,
            upcomingEvents,
            recentActivity,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
