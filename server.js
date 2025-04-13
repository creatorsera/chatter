const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Mock user database (replace with real DB in production)
const users = new Map(); // { socket.id: username }
const messages = []; // { from: username, to: username, text: string, timestamp: string }

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user login
  socket.on('login', (username) => {
    users.set(socket.id, username);
    io.emit('userList', Array.from(users.values()));
    socket.emit('messageHistory', messages.filter(
      (msg) => msg.from === username || msg.to === username
    ));
  });

  // Handle new message
  socket.on('sendMessage', ({ to, text }) => {
    const from = users.get(socket.id);
    const timestamp = new Date().toLocaleTimeString();
    const message = { from, to, text, timestamp };
    messages.push(message);

    // Emit to sender and recipient
    io.to([...users.entries()].find(([_, u]) => u === to)?.[0]).emit('newMessage', message);
    socket.emit('newMessage', message);
  });

  // Handle typing indicator
  socket.on('typing', ({ to }) => {
    const recipientSocketId = [...users.entries()].find(([_, u]) => u === to)?.[0];
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('typing', users.get(socket.id));
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    users.delete(socket.id);
    io.emit('userList', Array.from(users.values()));
    console.log('User disconnected:', username);
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
