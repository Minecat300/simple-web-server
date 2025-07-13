const express = require("express");
const fs = require("fs");
const path = require("path")

const { createServer, writeToFile, getFromFile, hashSHA512 } = require("./networkingEngine");
const indexPath = path.join(__dirname, 'public', 'index.html');
const htmlFile = fs.readFileSync(indexPath, 'utf8');

const PORT = 3081;

const app = createServer(PORT, "ipLog.log", "blockedIps.json", "/etc/letsencrypt/live/flameys.ddns.net", htmlFile);