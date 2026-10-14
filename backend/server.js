require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const validateEnv = require('./src/config/env');
const { initSocket } = require('./src/config/socket');
const startAlertWorker = require('./src/queues/alertWorker');

// Validate all required environment variables on startup
validateEnv();

// Connect to MongoDB
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Attach Socket.io to HTTP server
initSocket(server);

// Start Bull queue worker
startAlertWorker();

// Listen on PORT
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
