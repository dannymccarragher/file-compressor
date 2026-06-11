const express = require('express');
const multer = require('multer');
const { compress } = require('../lib/lz77');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

router.post('/compress', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    const compressed = compress(req.file.buffer);
    const outputName = req.file.originalname + '.lz77';

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${outputName}"`);
    res.setHeader('Content-Length', compressed.length);
    res.send(compressed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Compression failed.' });
  }
});

module.exports = router;
