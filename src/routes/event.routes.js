import express from "express";
import Event from "../models/Event.js";
import Activity from "../models/Activity.js";
import User from "../models/User.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// GET /api/events — return all events, populate createdBy name
router.get("/", authMiddleware, async (req, res) => {
    try {
        const events = await Event.find().populate("createdBy", "name");
        res.status(200).json(events);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// POST /api/events — create event + activity
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { title, date, time, description } = req.body;

        const event = await Event.create({
            title,
            date,
            time,
            description,
            createdBy: req.userId,
        });

        // Look up user name for activity description
        const user = await User.findById(req.userId);

        await Activity.create({
            type: "event_created",
            description: `${user.name} created event ${title}`,
            createdBy: req.userId,
        });

        res.status(201).json(event);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// DELETE /api/events/:id — delete only if owner
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
