const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

app.get('/', (req, res) => res.send('NEXUS UW App Backend'));

const { PORT } = process.env;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
