import express from "express";
import User from "../models/User.js";
import Group from "../models/Group.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// GET /api/members — return users who share at least one group with req.user
// Note: Previously returned ALL users which caused wrong member counts.
// Now scoped to users sharing groups with the authenticated user.
router.get("/", authMiddleware, async (req, res) => {
    try {
        // Find all groups the current user belongs to
        const userGroups = await Group.find({ members: req.userId });

        // Collect all unique member IDs across those groups
        const memberIdSet = new Set();
        userGroups.forEach((group) => {
            group.members.forEach((m) => memberIdSet.add(m.toString()));
        });

        const memberIds = Array.from(memberIdSet);

        const users = await User.find({ _id: { $in: memberIds } }).select("-password");
        res.status(200).json({
            users,
            note: "Only shows users who share at least one group with you",
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// POST /api/members/invite — create new user with defaults (unchanged)
router.post("/invite", authMiddleware, async (req, res) => {
    try {
        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: "Name and email are required" });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        await User.create({
            name,
            email,
            password: "GoodHome@123",
            role: "member",
        });

        res.status(201).json({ message: "Member invited successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
