const express = require('express');
const router = express.Router();
const { 
    searchUsers, 
    addFriend, 
    getFriends, 
    getUserById,
    removeFriend  // Make sure this is imported
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect); // All routes below require authentication

router.get('/search', searchUsers);
router.post('/add-friend', addFriend);
router.get('/friends', getFriends);
router.get('/:userId', getUserById);
router.delete('/remove-friend/:friendId', removeFriend);  // Make sure this line exists

module.exports = router;