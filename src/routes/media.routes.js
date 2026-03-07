import express from "express";
import multer from "multer";
import path from "path";
import Media from "../models/Media.js";
import Group from "../models/Group.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// Multer config: image files only, max 5MB, store in uploads/
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// POST /api/media/upload
router.post("/upload", authMiddleware, upload.single("file"), async (req, res) => {
    try {
        const { groupId } = req.body;

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

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const media = await Media.create({
            groupId,
            uploadedBy: req.userId,
            fileUrl: `/uploads/${req.file.filename}`,
            fileName: req.file.originalname,
        });

        res.status(201).json(media);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
