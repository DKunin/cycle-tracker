const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 4232;

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () =>
  console.log(`Cycling tracker listening on http://localhost:${PORT}`)
);