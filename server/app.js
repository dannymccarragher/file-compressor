const express = require('express');
const cors = require('cors');
const compressRoute = require('./routes/compress');

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use('/api', compressRoute);

module.exports = app;
