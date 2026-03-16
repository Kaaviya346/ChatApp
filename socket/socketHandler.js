const User = require('../models/User');
const Message = require('../models/Message');

const connectedUsers = new Map();

const socketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // Handle user online
        socket.on('user-online', async (userId) => {
            try {
                connectedUsers.set(userId, socket.id);
                await User.findByIdAndUpdate(userId, {
                    isOnline: true,
                    socketId: socket.id,
                    lastSeen: new Date()
                });

                const user = await User.findById(userId).populate('friends', '_id');
                if (user && user.friends) {
                    user.friends.forEach(friend => {
                        const friendSocketId = connectedUsers.get(friend._id.toString());
                        if (friendSocketId) {
                            io.to(friendSocketId).emit('friend-online', { userId });
                        }
                    });
                }
                console.log(`User ${userId} is online`);
            } catch (error) {
                console.error('Error:', error);
            }
        });

        // Handle send message - UPDATED to prevent duplicates
        socket.on('send-message', async (data) => {
            try {
                const { senderId, receiverId, messageType, messageContent, fileUrl } = data;

                // Save message to database
                const message = await Message.create({
                    senderId,
                    receiverId,
                    messageType: messageType || 'text',
                    messageContent,
                    fileUrl: fileUrl || null,
                    status: 'sent'
                });

                // Populate sender info
                await message.populate('senderId', 'username email');
                await message.populate('receiverId', 'username email');

                // Get receiver's socket ID
                const receiverSocketId = connectedUsers.get(receiverId);

                if (receiverSocketId) {
                    // Only emit to receiver, not back to sender
                    io.to(receiverSocketId).emit('receive-message', message);
                    
                    // Update message status to delivered
                    message.status = 'delivered';
                    await message.save();
                    
                    // Notify sender that message was delivered
                    socket.emit('message-delivered', { messageId: message._id });
                } else {
                    // User is offline
                    socket.emit('message-sent', { messageId: message._id });
                }
                
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('message-error', { error: 'Failed to send message' });
            }
        });

        // Handle typing indicator
        socket.on('typing', (data) => {
            const { senderId, receiverId, isTyping } = data;
            const receiverSocketId = connectedUsers.get(receiverId);
            
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('user-typing', {
                    userId: senderId,
                    isTyping
                });
            }
        });

        // Handle message seen
        socket.on('message-seen', async (data) => {
            try {
                const { messageId, readerId, senderId } = data;

                await Message.findByIdAndUpdate(messageId, {
                    status: 'seen',
                    seenAt: new Date()
                });

                const senderSocketId = connectedUsers.get(senderId);
                if (senderSocketId) {
                    io.to(senderSocketId).emit('message-status-update', {
                        messageId,
                        status: 'seen',
                        seenAt: new Date()
                    });
                }
            } catch (error) {
                console.error('Error updating message seen status:', error);
            }
        });

        // Handle disconnection
        socket.on('disconnect', async () => {
            try {
                let disconnectedUserId = null;
                for (const [userId, socketId] of connectedUsers.entries()) {
                    if (socketId === socket.id) {
                        disconnectedUserId = userId;
                        break;
                    }
                }

                if (disconnectedUserId) {
                    connectedUsers.delete(disconnectedUserId);
                    await User.findByIdAndUpdate(disconnectedUserId, {
                        isOnline: false,
                        socketId: null,
                        lastSeen: new Date()
                    });

                    console.log(`User ${disconnectedUserId} disconnected`);
                }
            } catch (error) {
                console.error('Error handling disconnection:', error);
            }
        });
    });
};

module.exports = socketHandler;