const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Send a message (HTTP endpoint)
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
    try {
        const { receiverId, messageType, messageContent } = req.body;
        const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

        if (!receiverId || !messageContent) {
            return res.status(400).json({ message: 'Receiver and message content are required' });
        }

        // Check if receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ message: 'Receiver not found' });
        }

        // Create message
        const message = await Message.create({
            senderId: req.user._id,
            receiverId,
            messageType: messageType || 'text',
            messageContent,
            fileUrl,
            status: 'sent'
        });

        // Populate sender and receiver info
        await message.populate('senderId', 'username email');
        await message.populate('receiverId', 'username email');

        res.status(201).json(message);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get chat history between two users
// @route   GET /api/messages/:userId
// @access  Private
const getMessages = async (req, res) => {
    try {
        const otherUserId = req.params.userId;

        const messages = await Message.find({
            $or: [
                { senderId: req.user._id, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: req.user._id }
            ]
        })
        .sort({ createdAt: 1 })
        .populate('senderId', 'username email')
        .populate('receiverId', 'username email');

        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update message status (seen/delivered)
// @route   PUT /api/messages/:messageId/status
// @access  Private
const updateMessageStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const messageId = req.params.messageId;

        const message = await Message.findById(messageId);
        
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Only receiver can mark as seen
        if (status === 'seen' && message.receiverId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        message.status = status;
        if (status === 'seen') {
            message.seenAt = new Date();
        }
        
        await message.save();

        res.json(message);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    sendMessage,
    getMessages,
    updateMessageStatus
};