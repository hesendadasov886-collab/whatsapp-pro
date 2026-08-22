const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));

// Aktiv istifadəçilər siyahısı: { socketId: { name, phone } }
const users = {};

io.on('connection', (socket) => {
  // İstifadəçi sisteme daxil olduqda
  socket.on('user joined', (data) => {
    users[socket.id] = { name: data.name, phone: data.phone, id: socket.id };
    io.emit('update user list', Object.values(users));
  });

  // Şəxsi mesaj göndərmə
  socket.on('private message', (data) => {
    // data: { recipientId, text, senderName, senderPhone }
    io.to(data.recipientId).emit('private message', {
      senderId: socket.id,
      senderName: data.senderName,
      senderPhone: data.senderPhone,
      text: data.text
    });
  });

  // İstifadəçi çıxdıqda
  socket.on('disconnect', () => {
    delete users[socket.id];
    io.emit('update user list', Object.values(users));
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server is running on port ${PORT}`));



