const express = require('express');
const multer = require('multer');
const archiver = require('archiver');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

router.post('/compress', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File exceeds 100 MB limit.' });
    }
    if (err) return res.status(500).json({ error: 'Upload failed.' });
    next();
  });
}, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const baseName = req.file.originalname.replace(/\.[^.]+$/, '');
  const outputName = baseName + '.zip';

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${outputName}"`);

  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.on('error', () => {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Compression failed.' });
    }
  });

  archive.pipe(res);
  archive.append(req.file.buffer, { name: req.file.originalname });
  archive.finalize();
});

module.exports = router;
