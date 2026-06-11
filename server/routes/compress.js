const express = require('express');
const multer = require('multer');
const archiver = require('archiver');

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

  const outputName = req.file.originalname + '.zip';

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${outputName}"`);

  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.on('error', (err) => {
    console.error('[POST /api/compress] Archive error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Compression failed.' });
    }
  });

  archive.on('end', () => {
    console.log(`[POST /api/compress] Done: sent "${outputName}" (${archive.pointer()} bytes)`);
  });

  archive.pipe(res);
  archive.append(req.file.buffer, { name: req.file.originalname });
  archive.finalize();
});

module.exports = router;
