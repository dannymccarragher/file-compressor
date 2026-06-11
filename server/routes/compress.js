const express = require('express');
const multer = require('multer');
const { ZipArchive } = require('archiver');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

router.post('/compress', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const baseName = req.file.originalname.replace(/\.[^.]+$/, '');
  const outputName = baseName + '.zip';

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${outputName}"`);

  const archive = new ZipArchive({ zlib: { level: 9 } });

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
