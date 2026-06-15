/* Local development only — Netlify uses netlify/functions/api.js */
const { app }   = require('./app');
const express   = require('express');
const path      = require('path');
const PORT      = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));
app.listen(PORT, () => console.log(`Mendez server on :${PORT}`));
