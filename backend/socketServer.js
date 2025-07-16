// backend/socketServer.js
const { Server } = require("socket.io");
const Chat = require("./model/Chats");

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:4000", // React frontend
      methods: ["GET", "POST"],
    },
  });

  const users = {}; // Track connected users and their socket IDs

  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

   
   
  });

  return io;
}

module.exports = setupSocket;
