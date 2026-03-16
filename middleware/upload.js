const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        let uploadPath = 'uploads/';
        
        // Determine folder based on file type
        if (file.mimetype.startsWith('image/')) {
            uploadPath += 'images';
        } else if (file.mimetype.startsWith('video/')) {
            uploadPath += 'videos';
        } else if (file.mimetype.startsWith('audio/')) {
            uploadPath += 'audio';
        } else {
            uploadPath += 'others';
        }
        
        cb(null, uploadPath);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter - Updated to include audio formats
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mp3|wav|ogg|webm|m4a/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images, videos, and audio files are allowed.'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: fileFilter
});

module.exports = upload;