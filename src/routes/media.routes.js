import express from 'express';
import multer from 'multer';
import Media from '../models/Media.js';
import Group from '../models/Group.js';
import authMiddleware from '../middleware/auth.middleware.js'; // although it's applied in app.js as per user, we need it here if app.js doesn't apply it to everything inside. Oh wait, user wants `app.use('/api/media', authMiddleware, mediaRoutes);` in app.js. Let's still import it here just in case, but rely on app.js. Actually no, if we apply it in app.js we don't need it per-route, but existing routes use it per-route. User said "app.use('/api/groups', authMiddleware, groupRoutes);". Let me define router here without `authMiddleware` on individual routes, as it'll be on the router level. Actually, existing group.routes.js I wrote has authMiddleware inside the routes? Oh, wait. The user explicitly asked for: `app.use('/api/groups', authMiddleware, groupRoutes);`. In the group routes I just wrote, I didn't include `authMiddleware` on the individual route handlers, but wait, looking closely at my rewritten `group.routes.js`, I *didn't* put authMiddleware inside `router.post(...)`. That's perfect! I will write `media.routes.js` without `authMiddleware` on the routes because it will be mounted with it in `app.js`.

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only images allowed'));
    }
});

// POST /api/media/upload
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const { groupId } = req.body;

        if (!groupId) {
            return res.status(400).json({ message: "groupId is required" });
        }

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
            fileUrl: '/uploads/' + req.file.filename,
            fileName: req.file.originalname,
        });

        res.status(201).json(media);
    } catch (err) {
        console.error('Error in POST /api/media/upload:', err);
        return res.status(500).json({ message: err.message });
    }
});

// GET /api/groups/:groupId/media
router.get('/groups/:groupId/media', async (req, res) => {
    try {
        const { groupId } = req.params;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        if (!group.members.some((m) => m.toString() === req.userId.toString())) {
            return res.status(403).json({ message: "Not a member of this group" });
        }

        const media = await Media.find({ groupId })
            .populate('uploadedBy', 'name');

        res.status(200).json(media);
    } catch (err) {
        console.error('Error in GET /api/groups/:groupId/media:', err);
        return res.status(500).json({ message: err.message });
    }
});

export default router;
