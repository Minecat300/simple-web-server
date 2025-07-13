const express = require("express");
const fs = require("fs");
const path = require('path');

const { createServer, writeToFile, getFromFile, hashSHA512 } = require("./networkingEngine");
const index = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');

const PORT = 3081;

const app = createServer(PORT, "ipLog.log", "blockedIps.json", "/etc/letsencrypt/live/flameys.ddns.net", htmlFile);