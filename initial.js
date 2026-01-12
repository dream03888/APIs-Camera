const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const http = require('http');
const mysql = require("mysql2/promise");
const axios = require('axios');
require("dotenv").config(); // ใช้เฉพาะ local

const app = express();

app.use(cors({ origin: '*' }));
app.use(bodyParser.json({ limit: '500mb' }));
app.use(bodyParser.urlencoded({ limit: '500mb', extended: true }));

// Railway จะส่ง PORT มาให้เอง
const PORT = process.env.PORT || 3000;

// สร้าง HTTP Server
const httpServer = http.createServer(app);
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 HTTP Server running on port ${PORT}`);
});

// สร้าง MySQL Pool (Railway)
const pool = mysql.createPool({
   host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
  ssl: {
    rejectUnauthorized: false
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// สร้าง Socket.io
const io = require('socket.io')(httpServer, {
  cors: { origin: '*' }
});

module.exports = { app, io, pool, axios };
