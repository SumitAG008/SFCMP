const cds = require('@sap/cds');
const express = require('express');
const path = require('path');

// Serve static files from app/webapp
cds.on('bootstrap', app => {
  // Serve UI5 app files
  const webappPath = path.join(__dirname, '../app/webapp');
  app.use(express.static(webappPath));
  
  // Serve index.html for root and app routes
  app.get('/', (req, res) => {
    res.sendFile(path.join(webappPath, 'index.html'));
  });
  
  app.get('/app', (req, res) => {
    res.sendFile(path.join(webappPath, 'index.html'));
  });
  
  app.get('/app/*', (req, res) => {
    res.sendFile(path.join(webappPath, 'index.html'));
  });
});

// Delegate to default server.js
module.exports = cds.server;
