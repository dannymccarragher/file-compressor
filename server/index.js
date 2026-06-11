const express = require('express');
const cors = require('cors');
const compressRoute = require('./routes/compress');

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use('/api', compressRoute);

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
