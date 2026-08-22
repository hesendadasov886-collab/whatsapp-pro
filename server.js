const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const twilio = require('twilio');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(express.static('public'));

// MongoDB Bağlantısı (Bulud baza üçün URI)
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/whatsapp_clone');

// Schema Tərifləri
const User = mongoose.model('User', new mongoose.Schema({
  phone: { type: String, unique: true },
  username: String,
  isVerified: { type: Boolean, default: false }
}));

const Message = mongoose.model('Message', new mongoose.Schema({
  senderPhone: String,
  receiverPhone: String,
  text: String,
  timestamp: { type: Date, default: Date.now }
}));

const Status = mongoose.model('Status', new mongoose.Schema({
  userPhone: String,
  text: String,
  createdAt: { type: Date, default: Date.now, expires: 86400 } // 24 saat sonra avtomatik silinir
}));

const otpStore = {}; // Müvəqqəti OTP yaddaşı

// 1. API: SMS OTP Göndərmə
app.post('/api/send-otp', async (req, res) => {
  const { phone } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[phone] = otp;

  console.log(`[TEST OTP] ${phone} üçün kod: ${otp}`);
  res.json({ success: true, message: "OTP göndərildi.", testOtp: otp });
});

// 2. API: OTP Təsdiqləmə və Qeydiyyat
app.post('/api/verify-otp', async (req, res) => {
  const { phone, otp, username } = req.body;
  if (otpStore[phone] === otp) {
    delete otpStore[phone];
    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({ phone, username, isVerified: true });
    }
    res.json({ success: true, user });
  } else {
    res.status(400).json({ success: false, message: "Xətalı OTP kodu!" });
  }
});

// 3. API: Status Paylaşma
app.post('/api/status', async (req, res) => {
  const { userPhone, text } = req.body;
  const newStatus = await Status.create({ userPhone, text });
  io.emit('new_status', newStatus);
  res.json({ success: true, status: newStatus });
});

// 4. Real-Time Socket.IO Rabitəsi
const activeUsers = {};

io.on('connection', (socket) => {
  socket.on('register_user', (phone) => {
    activeUsers[phone] = socket.id;
  });

  socket.on('send_private_message', async (data) => {
    const { senderPhone, receiverPhone, text } = data;
    
    const msg = await Message.create({ senderPhone, receiverPhone, text });

    const receiverSocketId = activeUsers[receiverPhone];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receive_private_message', msg);
    }
    socket.emit('message_sent', msg);
  });

  socket.on('disconnect', () => {
    for (let phone in activeUsers) {
      if (activeUsers[phone] === socket.id) {
        delete activeUsers[phone];
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server ${PORT} portunda aktivdir.`));

