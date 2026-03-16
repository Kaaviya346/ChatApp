const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'video', 'audio'],
        default: 'text'
    },
    messageContent: {
        type: String,
        required: true
    },
    fileUrl: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'seen'],
        default: 'sent'
    },
    seenAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Index for faster queries
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);