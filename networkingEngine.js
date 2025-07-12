const fs = require("fs");
const https = require("https");
const crypto = require('crypto');
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

function getFromFile(filePath, defaultData = "[]") {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, defaultData, "utf8");
    }

    try {
        const data = fs.readFileSync(filePath, "utf8");
        return JSON.parse(data);
    } catch (err) {
        console.error(`Error reading or parsing ${filePath}:`, err);
        return [];
    }
}

function writeToFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error(`Error writing to file ${filePath}:`, err);
    }
}

async function fetchIpInfo(ip) {
    try {
        const respone = await fetch(`https://api.iplocation.net/?ip=${ip}`);
        const data = await respone.json();
        console.log("Ip Info:", data);
        return data;
    } catch (error) {
        console.error("Error fetching IP info:", error);
    }
};

function setupClient(app, ipLogPath, blockedIpsPath) {
    app.use(async (req, res, next) => {
        const clientIP = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
        const clientAgent = req.headers["user-agent"];

        loggedIps = getFromFile(ipLogPath, "{}");
        blockedIps = getFromFile(blockedIpsPath);

        if (!loggedIps.hasOwnProperty(clientIP)) {
            console.log("Client IP:", clientIP);

            const slicedIp = clientIP.slice(7);
            const ipInfo = await fetchIpInfo(slicedIp);

            loggedIps[clientIP] = {location: {}, agent: {}};
            loggedIps[clientIP].location = ipInfo;

            if (ipInfo.country_code2 === "RU" || ipInfo.country_code2 === "CN") {
                if (!blockedIps.includes(clientIP)) {
                    blockedIps.push(clientIP);
                    writeToFile(blockedIpsPath, blockedIps);
                }
            }
        }

        loggedIps[clientIP].agent = clientAgent;
        writeToFile(ipLogPath, loggedIps);

        
        if (blockedIps.includes(clientIP)) {
            console.log(`Blocked request from: ${clientIP}`);
            return res.status(403).json({ error: "Access denied" });
        }

        next();
    });
}

function createServer(PORT, ipLogPath, blockedIpsPath, SSlPath, htmlFile, useHttps = true) {
    const app = express();

    if (useHttps) {
        const options = {
            key: fs.readFileSync(SSlPath + "/privkey.pem"),
            cert: fs.readFileSync(SSlPath + "/fullchain.pem")
        };
    }

    //app.use(cors());
    app.use(bodyParser.json());

    app.use((err, req, res, next) => {
        console.error("Error:", err);
        res.status(500).send('Something went wrong!');
    });

    setupClient(app, ipLogPath, blockedIpsPath);

    app.get("/", (req, res) => {
        if (htmlFile != undefined && htmlFile != "") {
            res.send(htmlFile);
        } else {
            res.status(404).send("Not Found");
        }
    });

    app.post("/ping", (req, res) => {
        return res.status(200).json({ message: "Ping recived" });
    });

    if (useHttps) {
        https.createServer(options, app).listen(PORT, () => {
            console.log(`This HTTPS server is running on port: ${PORT}`);
        });
    } else {
        app.listen(PORT, () => {
            console.log(`This HTTP server is running on port: ${PORT}`);
        });
    }

    return app;
}

function hashSHA512(text) {
    return crypto.createHash('sha512').update(text).digest('hex');
}

module.exports = { createServer, writeToFile, getFromFile, hashSHA512 };