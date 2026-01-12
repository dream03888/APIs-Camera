const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv').config({ path: path.join(__dirname, '.env') });
const http = require('http');
const mysql = require("mysql2/promise");
const axios = require('axios');

const app = express();

app.use(cors({ origin: '*' }));
app.use(bodyParser.json({ limit: '500mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '500mb', extended: true }));

const PORT = dotenv.parsed.PORT || 3000;

// สร้าง HTTP Server
const httpServer = http.createServer(app);
httpServer.listen(PORT, () => {
  console.log(`HTTP Server running on port ${PORT}`);
});
// httpServer.listen(PORT, "0.0.0.0", () => {
//   console.log(`🚀 HTTP Server running on:`);
//   console.log(`   Local:   http://localhost:${PORT}`);
//   console.log(`   Network: http://swapp.dyndns.org:${PORT}`);
// });

// สร้าง MySQL Pool
const pool = mysql.createPool({
  host: dotenv.parsed.DB_HOST,
  user: dotenv.parsed.DB_USER,
  password: dotenv.parsed.DB_PASSWORD,
  database: dotenv.parsed.DB_DATABASE,
  port: dotenv.parsed.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// สร้าง Socket.io
const io = require('socket.io')(httpServer, { 
  cors: { origin: '*' }
});

module.exports = { app, io, pool, axios };
