const User = require('../models/User');

// @desc    Search users by username
// @route   GET /api/users/search?username=value
// @access  Private
const searchUsers = async (req, res) => {
    try {
        const { username } = req.query;
        
        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }

        const users = await User.find({
            username: { $regex: username, $options: 'i' },
            _id: { $ne: req.user._id }
        }).select('username email isOnline lastSeen');

        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add a friend
// @route   POST /api/users/add-friend
// @access  Private
const addFriend = async (req, res) => {
    try {
        const { friendUsername } = req.body;

        if (!friendUsername) {
            return res.status(400).json({ message: 'Friend username is required' });
        }

        // Find friend by username
        const friend = await User.findOne({ username: friendUsername });

        if (!friend) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if trying to add self
        if (friend._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot add yourself as friend' });
        }

        // Check if already friends
        if (req.user.friends.includes(friend._id)) {
            return res.status(400).json({ message: 'Already friends with this user' });
        }

        // Add friend to current user's friend list
        await User.findByIdAndUpdate(req.user._id, {
            $push: { friends: friend._id }
        });

        // Add current user to friend's friend list (bidirectional)
        await User.findByIdAndUpdate(friend._id, {
            $push: { friends: req.user._id }
        });

        res.json({ 
            message: 'Friend added successfully',
            friend: {
                _id: friend._id,
                username: friend.username,
                email: friend.email,
                isOnline: friend.isOnline,
                lastSeen: friend.lastSeen
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get user's friends list
// @route   GET /api/users/friends
// @access  Private
const getFriends = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('friends', 'username email isOnline lastSeen');
        
        res.json(user.friends);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get user by ID
// @route   GET /api/users/:userId
// @access  Private
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .select('username email isOnline lastSeen');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Remove a friend
// @route   DELETE /api/users/remove-friend/:friendId
// @access  Private
const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;

    if (!friendId) {
      return res.status(400).json({ message: 'Friend ID is required' });
    }

    // Check if friend exists
    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({ message: 'Friend not found' });
    }

    // Check if they are actually friends
    if (!req.user.friends.includes(friendId)) {
      return res.status(400).json({ message: 'This user is not in your friends list' });
    }

    // Remove friend from current user's friend list
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { friends: friendId }
    });

    // Remove current user from friend's friend list (bidirectional)
    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: req.user._id }
    });

    res.json({ 
      message: 'Friend removed successfully',
      friendId: friendId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
    searchUsers,
    addFriend,
    getFriends,
    getUserById,
    removeFriend  // Make sure this is included!
};