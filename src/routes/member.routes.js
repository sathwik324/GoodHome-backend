import express from "express";
import User from "../models/User.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// GET /api/members — return all users (exclude password)
router.get("/", authMiddleware, async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.status(200).json(users);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

// POST /api/members/invite — create new user with defaults
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
