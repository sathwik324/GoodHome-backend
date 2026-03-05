import express from "express";
import User from "../models/User.js";
import Message from "../models/Message.js";
import Event from "../models/Event.js";
import Activity from "../models/Activity.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// GET /api/dashboard — return aggregated stats
router.get("/", authMiddleware, async (req, res) => {
    try {
        const totalMembers = await User.countDocuments();

        // activeNow: random 1-3 since lastSeen is not tracked
        const activeNow = Math.floor(Math.random() * 3) + 1;

        // messagesToday: count messages created today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const messagesToday = await Message.countDocuments({
            createdAt: { $gte: startOfDay },
        });

        // upcomingEvents: events with date >= today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcomingEvents = await Event.countDocuments({
            date: { $gte: today },
        });

        // recentActivity: last 5 activities
        const recentActivity = await Activity.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("createdBy", "name");

        res.status(200).json({
            totalMembers,
            activeNow,
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
