const express = require('express');
const router = express.Router();
const { 
    sendMessage, 
    getMessages, 
    updateMessageStatus 
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect); // All routes below require authentication

router.post('/', upload.single('file'), sendMessage);
router.get('/:userId', getMessages);
router.put('/:messageId/status', updateMessageStatus);

module.exports = router;