import express from "express";
import Event from "../models/Event.js";
import Activity from "../models/Activity.js";
import User from "../models/User.js";
import Group from "../models/Group.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// GET /api/events — requires groupId query param
router.get("/", authMiddleware, async (req, res) => {
    try {
        const { groupId } = req.query;

        if (!groupId) {
            return res.status(400).json({ message: "groupId query param is required" });
        }

        // Verify user is member of group
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }
        if (!group.members.some((m) => m.toString() === req.userId.toString())) {
            return res.status(403).json({ message: "Not a member of this group" });
        }

        const events = await Event.find({ groupId }).populate("createdBy", "name");
        res.status(200).json(events);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// POST /api/events — require groupId in body
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { title, date, time, description, groupId } = req.body;

        if (!groupId) {
            return res.status(400).json({ message: "groupId is required" });
        }

        // Verify user is member of group
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }
        if (!group.members.some((m) => m.toString() === req.userId.toString())) {
            return res.status(403).json({ message: "Not a member of this group" });
        }

        const event = await Event.create({
            title,
            date,
            time,
            description,
            groupId,
            createdBy: req.userId,
        });

        // Look up user name for activity description
        const user = await User.findById(req.userId);

        await Activity.create({
            type: "event_created",
            description: `${user.name} created event ${title}`,
            groupId,
            createdBy: req.userId,
        });

        res.status(201).json(event);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// DELETE /api/events/:id — unchanged (delete only if owner)
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        if (event.createdBy.toString() !== req.userId.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this event" });
        }

        await Event.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: "Event deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
