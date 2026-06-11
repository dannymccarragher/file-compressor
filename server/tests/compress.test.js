const request = require('supertest');
const AdmZip = require('adm-zip');
const app = require('../app');

const TEXT_CONTENT = Buffer.from('Hello world! '.repeat(500));
const BINARY_CONTENT = Buffer.from([0x00, 0x01, 0x02, 0x03, 0xff, 0xfe, 0xfd]);

describe('POST /api/compress', () => {
  test('returns 400 when no file is uploaded', async () => {
    const res = await request(app).post('/api/compress');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('No file uploaded.');
  });

  test('returns 200 with a zip content-type', async () => {
    const res = await request(app)
      .post('/api/compress')
      .attach('file', TEXT_CONTENT, 'test.txt');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/zip/);
  });

  test('output filename strips original extension and adds .zip', async () => {
    const res = await request(app)
      .post('/api/compress')
      .attach('file', TEXT_CONTENT, 'document.txt');
    expect(res.headers['content-disposition']).toContain('document.zip');
    expect(res.headers['content-disposition']).not.toContain('.txt');
  });

  test('output filename works for files with no extension', async () => {
    const res = await request(app)
      .post('/api/compress')
      .attach('file', TEXT_CONTENT, 'Makefile');
    expect(res.headers['content-disposition']).toContain('Makefile.zip');
  });

  test('response body is a valid ZIP archive', async () => {
    const res = await request(app)
      .post('/api/compress')
      .attach('file', TEXT_CONTENT, 'test.txt')
      .buffer(true)
      .parse((res, callback) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    expect(() => new AdmZip(res.body)).not.toThrow();
  });

  test('ZIP contains the original file under its original name', async () => {
    const res = await request(app)
      .post('/api/compress')
      .attach('file', TEXT_CONTENT, 'hello.txt')
      .buffer(true)
      .parse((res, callback) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    const zip = new AdmZip(res.body);
    const entries = zip.getEntries().map((e) => e.entryName);
    expect(entries).toContain('hello.txt');
  });

  test('extracted file content matches the original', async () => {
    const res = await request(app)
      .post('/api/compress')
      .attach('file', TEXT_CONTENT, 'hello.txt')
      .buffer(true)
      .parse((res, callback) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    const zip = new AdmZip(res.body);
    const extracted = zip.readFile('hello.txt');
    expect(extracted).toEqual(TEXT_CONTENT);
  });

  test('ZIP file is smaller than the original for compressible content', async () => {
    const res = await request(app)
      .post('/api/compress')
      .attach('file', TEXT_CONTENT, 'hello.txt')
      .buffer(true)
      .parse((res, callback) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    expect(res.body.length).toBeLessThan(TEXT_CONTENT.length);
  });

  test('handles binary file content correctly', async () => {
    const res = await request(app)
      .post('/api/compress')
      .attach('file', BINARY_CONTENT, 'data.bin')
      .buffer(true)
      .parse((res, callback) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    expect(res.status).toBe(200);
    const zip = new AdmZip(res.body);
    const extracted = zip.readFile('data.bin');
    expect(extracted).toEqual(BINARY_CONTENT);
  });

  test('handles large file up to 100 MB limit', async () => {
    const largeBuffer = Buffer.alloc(10 * 1024 * 1024, 'A'); // 10 MB of repeated data
    const res = await request(app)
      .post('/api/compress')
      .attach('file', largeBuffer, 'large.txt')
      .buffer(true)
      .parse((res, callback) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    expect(res.status).toBe(200);
    expect(res.body.length).toBeLessThan(largeBuffer.length);
  }, 15000);

  test('rejects files over 100 MB', async () => {
    const tooBig = Buffer.alloc(101 * 1024 * 1024);
    const res = await request(app)
      .post('/api/compress')
      .attach('file', tooBig, 'toobig.bin');

    expect(res.status).toBe(413);
  }, 30000);
});
