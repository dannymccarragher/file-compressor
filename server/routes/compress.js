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

  console.log(`[POST /api/compress] Received: "${req.file.originalname}" (${req.file.size} bytes)`);

  try {
    const compressed = compress(req.file.buffer);
    const outputName = req.file.originalname;

    console.log(`[POST /api/compress] Compressed: ${req.file.size} → ${compressed.length} bytes (ratio: ${(compressed.length / req.file.size * 100).toFixed(1)}%)`);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${outputName}"`);
    res.setHeader('Content-Length', compressed.length);
    res.send(compressed);

    console.log(`[POST /api/compress] Response sent: "${outputName}"`);
  } catch (err) {
    console.error('[POST /api/compress] Compression failed:', err);
    res.status(500).json({ error: 'Compression failed.' });
  }
});

module.exports = router;
