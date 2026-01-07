const cds = require('@sap/cds');
const express = require('express');

// Serve static files from app/webapp
cds.on('bootstrap', app => {
  app.use(express.static('app/webapp'));
});

// Delegate to default server.js
module.exports = cds.server;
