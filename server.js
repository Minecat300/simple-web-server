const express = require("express");
const fs = require("fs");

const { createServer, writeToFile, getFromFile, hashSHA512 } = require("./networkingEngine");
const htmlFile = fs.readFileSync("./public/index.html", "utf8");

const PORT = 3081;

const app = createServer(PORT, "ipLog.log", "blockedIps.json", "/etc/letsencrypt/live/flameys.ddns.net", htmlFile);