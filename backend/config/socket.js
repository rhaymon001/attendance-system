const { Server } = require('socket.io');

/**
 * Socket.io configuration
 * -----------------------
 * Manages the single io instance used across the entire application.
 *
 * Why a module-level singleton?
 * attendance.controller.js needs to emit events to the lecturer's
 * room after a student checks in. Since controllers run in a different
 * file from where Socket.io is initialised, we store the io instance
 * here and export getIO() so any file can access it without circular
 * imports.
 *
 * Room strategy:
 * Each active session gets its own Socket.io room named after its
 * MongoDB ObjectId string. The lecturer joins this room when they
 * open the session screen. When a student checks in, the controller
 * emits 'attendance:new' to that room — only the relevant lecturer
 * receives it.
 */

let io; // module-level singleton

/**
 * initSocket
 * ----------
 * Called once in server.js after the HTTP server is created.
 * Attaches Socket.io to the HTTP server and registers connection logic.
 *
 * @param {http.Server} httpServer - The Node.js HTTP server instance
 * @returns {Server} io           - The Socket.io server instance
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    /**
     * 'join' event
     * Lecturer emits this after opening a session screen,
     * passing the sessionId so we can put them in the right room.
     * The student's CheckInView does NOT join a room — it only
     * sends HTTP requests.
     */
    socket.on('join', ({ sessionId }) => {
      if (!sessionId) return;
      socket.join(sessionId);
      console.log(`Socket ${socket.id} joined room: ${sessionId}`);
    });

    /**
     * 'leave' event
     * Lecturer emits this when they end a session or navigate away.
     */
    socket.on('leave', ({ sessionId }) => {
      if (!sessionId) return;
      socket.leave(sessionId);
      console.log(`Socket ${socket.id} left room: ${sessionId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * getIO
 * -----
 * Returns the active io instance.
 * Called by attendance.controller.js to emit 'attendance:new'.
 * Throws if called before initSocket — this should never happen
 * in normal operation since server.js calls initSocket at startup.
 *
 * Usage in controllers:
 *   const { getIO } = require('../config/socket');
 *   getIO().to(sessionId).emit('attendance:new', data);
 *
 * @returns {Server} io
 */
const getIO = () => {
  if (!io) {
    throw new Error(
      'Socket.io not initialised. Call initSocket(httpServer) in server.js first.'
    );
  }
  return io;
};

module.exports = { initSocket, getIO };
