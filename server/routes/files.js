const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configure multer for storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Get path from body or query, default to root of files
        // Security: Ensure we don't traverse up
        let targetPath = req.body.path || '';
        // Remove leading/trailing slashes and dots to prevent directory traversal
        targetPath = targetPath.replace(/^[\\\/]+|[\\\/]+$/g, '').replace(/\.\./g, '');

        const fullPath = path.join(__dirname, '../public/files', targetPath);

        // Ensure directory exists
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }

        cb(null, fullPath);
    },
    filename: function (req, file, cb) {
        // Use original filename but handle duplicates or encoding if needed
        // For now, keep simple: utf-8 safe filename
        const safeName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        cb(null, safeName);
    }
});

const upload = multer({ storage: storage });

// GET /api/files/list?path=category/subcategory
router.get('/list', (req, res) => {
    try {
        let requestedPath = req.query.path || '';
        // Security sanitization
        requestedPath = requestedPath.replace(/\.\./g, '');

        const directoryPath = path.join(__dirname, '../public/files', requestedPath);

        if (!fs.existsSync(directoryPath)) {
            return res.status(404).json({ message: 'Directory not found', path: requestedPath });
        }

        fs.readdir(directoryPath, (err, files) => {
            if (err) {
                return res.status(500).json({ message: 'Unable to scan files!', error: err });
            }

            const fileInfos = files.map(file => {
                const filePath = path.join(directoryPath, file);
                const stat = fs.statSync(filePath);

                return {
                    name: file,
                    isDirectory: stat.isDirectory(),
                    size: stat.size,
                    path: path.join(requestedPath, file).replace(/\\/g, '/'), // Relative path
                    url: `/public/files/${path.join(requestedPath, file).replace(/\\/g, '/')}`
                };
            });

            // Filter out system files if any (e.g. .DS_Store)
            const validFiles = fileInfos.filter(f => !f.name.startsWith('.'));

            res.json(validFiles);
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// POST /api/files/upload
router.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        res.json({
            message: 'File uploaded successfully',
            file: {
                name: req.file.filename,
                size: req.file.size,
                path: req.body.path
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading file', error: error.message });
    }
});

// DELETE /api/files?path=...
router.delete('/', (req, res) => {
    try {
        const filePath = req.query.path;
        if (!filePath) return res.status(400).json({ message: 'Path required' });

        // Security
        const safePath = filePath.replace(/\.\./g, '');
        const fullPath = path.join(__dirname, '../public/files', safePath);

        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            res.json({ message: 'File deleted successfully' });
        } else {
            res.status(404).json({ message: 'File not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting file', error: error.message });
    }
});

module.exports = router;
