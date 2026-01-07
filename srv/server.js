const cds = require('@sap/cds');
const express = require('express');
const path = require('path');

// Serve static files from app/webapp
cds.on('bootstrap', app => {
  // Serve UI5 app files
  const webappPath = path.join(__dirname, '../app/webapp');
  
  // Serve static files with proper MIME types
  app.use(express.static(webappPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (filePath.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json');
      } else if (filePath.endsWith('.properties')) {
        res.setHeader('Content-Type', 'text/plain');
      }
    }
  }));
  
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
  
  // Handle Component-preload.js requests (return empty if not found)
  app.get('/Component-preload.js', (req, res) => {
    const preloadPath = path.join(webappPath, 'Component-preload.js');
    res.sendFile(preloadPath, (err) => {
      if (err) {
        // Return empty preload if file doesn't exist
        res.type('application/javascript');
        res.send('sap.ui.define([], function() { "use strict"; return {}; });');
      }
    });
  });
});

// Delegate to default server.js
module.exports = cds.server;
