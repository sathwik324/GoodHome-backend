import mongoose from 'mongoose';
import crypto from 'crypto';

const groupSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    inviteCode: {
        type: String,
        unique: true,
        default: () => crypto.randomBytes(4).toString('hex')
    },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Group', groupSchema);
