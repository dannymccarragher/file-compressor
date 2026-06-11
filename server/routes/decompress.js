const express = require('express');
const multer = require('multer');
const { decompress } = require('../lib/lz77');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

router.post('/decompress', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  console.log(`[POST /api/decompress] Received: "${req.file.originalname}" (${req.file.size} bytes)`);

  try {
    const decompressed = decompress(req.file.buffer);
    // Strip .lz77 extension to recover original filename
    const outputName = req.file.originalname.endsWith('.lz77')
      ? req.file.originalname.slice(0, -5)
      : req.file.originalname;

    console.log(`[POST /api/decompress] Decompressed: ${req.file.size} → ${decompressed.length} bytes, sending as "${outputName}"`);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${outputName}"`);
    res.setHeader('Content-Length', decompressed.length);
    res.send(decompressed);

    console.log(`[POST /api/decompress] Response sent: "${outputName}"`);
  } catch (err) {
    console.error('[POST /api/decompress] Decompression failed:', err.message);
    res.status(500).json({ error: err.message || 'Decompression failed.' });
  }
});

module.exports = router;
