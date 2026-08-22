const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const users = {};
let statuses = [];

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WhatsApp Pro - Private & Status</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: sans-serif; }
    body { background: #111b21; color: #e9edef; display: flex; justify-content: center; height: 100vh; }
    .app-container { width: 100%; max-width: 450px; height: 100vh; background: #0b141a; display: flex; flex-direction: column; }
    .header { background: #202c33; padding: 12px 15px; font-size: 16px; font-weight: bold; color: #00a884; display: flex; justify-content: space-between; align-items: center; }
    .auth-box { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
    input { padding: 12px; background: #2a3942; border: none; border-radius: 8px; color: #fff; font-size: 15px; outline: none; }
    button { padding: 10px 14px; background: #00a884; border: none; border-radius: 8px; color: #fff; font-weight: bold; cursor: pointer; }
    .user-list { flex: 1; overflow-y: auto; padding: 10px; }
    .user-item { padding: 12px; background: #202c33; margin-bottom: 8px; border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; }
    .status-bar { background: #182229; padding: 10px; display: flex; gap: 10px; overflow-x: auto; border-bottom: 1px solid #222d34; }
    .status-card { background: #202c33; padding: 8px 10px; border-radius: 12px; min-width: 140px; border: 1px solid #00a884; }
    .messages-area { flex: 1; padding: 10px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
    .msg { padding: 8px 12px; border-radius: 8px; max-width: 75%; width: fit-content; font-size: 14px; word-break: break-word; }
    .msg.sent { background: #005c4b; align-self: flex-end; }
    .msg.received { background: #202c33; align-self: flex-start; }
    .hidden { display: none !important; }
    .back-btn { background: transparent; color: #00a884; border: none; font-size: 18px; cursor: pointer; margin-right: 10px; }
    .logout-btn { background: transparent; color: #ea0038; border: none; font-size: 12px; cursor: pointer; }
  </style>
</head>
<body>

  <div class="app-container">
    <!-- Giriş Ekranı -->
    <div id="auth-section" class="auth-box">
      <h3 style="color:#00a884;">WhatsApp Pro Giriş</h3>
      <input type="text" id="phone" placeholder="Telefon nömrəniz (+994...)">
      <input type="text" id="username" placeholder="Adınız">
      <button onclick="sendOTP()">Davam Et</button>

      <div id="otp-box" class="hidden" style="display:flex; flex-direction:column; gap:10px; margin-top:10px;">
        <p style="font-size: 12px; color: #8696a0;">Test kodunu daxil edin (<b>123456</b>):</p>
        <input type="text" id="otp" placeholder="123456">
        <button onclick="verifyOTP()">Daxil Ol</button>
      </div>
    </div>

    <!-- Söhbətlər və Status Siyahısı -->
    <div id="list-section" class="hidden" style="flex:1; display:flex; flex-direction:column;">
      <div class="header">
        <span>WhatsApp Pro</span>
        <div style="display:flex; gap:10px; align-items:center;">
          <button onclick="addStatus()" style="font-size:12px; padding:6px 10px;">+ Status</button>
          <button class="logout-btn" onclick="logout()">Çıxış</button>
        </div>
      </div>

      <div id="status-container" class="status-bar">
        <span style="font-size: 12px; color: #8696a0; align-self:center;">Hələ status paylaşılmayıb</span>
      </div>

      <div style="padding:10px 15px 5px; font-size:13px; color:#00a884; font-weight:bold;">Söhbətlər (Onlayn İstifadəçilər)</div>
      <div class="user-list" id="users-container"></div>
    </div>

    <!-- Şəxsi Çat Ekranı -->
    <div id="chat-section" class="hidden" style="flex:1; display:flex; flex-direction:column;">
      <div class="header">
        <div style="display:flex; align-items:center;">
          <button class="back-btn" onclick="backToList()">←</button>
          <span id="chat-with-name">Çat</span>
        </div>
      </div>
      <div class="messages-area" id="messages"></div>
      <div style="padding:10px; background:#202c33; display:flex; gap:8px;">
        <input type="text" id="message" placeholder="Mesaj yazın..." style="flex:1;">
        <button onclick="sendMessage()">></button>
      </div>
    </div>
  </div>

  <script src="/socket.io/socket.io.js"></script>
  <script>
    const socket = io();
    let myPhone = "";
    let myName = "";
    let activeChatPhone = null;

    function sendOTP() {
      myPhone = document.getElementById('phone').value.trim();
      myName = document.getElementById('username').value.trim();
      if(!myPhone || !myName) return alert("Bütün xanaları doldurun!");
      document.getElementById('otp-box').classList.remove('hidden');
    }

    function verifyOTP() {
      const otp = document.getElementById('otp').value.trim();
      if(otp !== "123456") return alert("Yanlış OTP Kodu! (Test kodu: 123456)");
      
      document.getElementById('auth-section').classList.add('hidden');
      document.getElementById('list-section').classList.remove('hidden');

      socket.emit('register_user', { phone: myPhone, name: myName });
    }

    function logout() {
      location.reload();
    }

    socket.on('update_users', (userList) => {
      const container = document.getElementById('users-container');
      container.innerHTML = "";
      
      const otherUsers = Object.keys(userList).filter(p => p !== myPhone);
      
      if(otherUsers.length === 0) {
        container.innerHTML = '<div style="text-align:center; color:#8696a0; margin-top:20px; font-size:14px;">Hələlik başqa onlayn istifadəçi yoxdur. Linki dostlarınıza atın!</div>';
        return;
      }

      otherUsers.forEach(phone => {
        const u = userList[phone];
        const div = document.createElement('div');
        div.className = 'user-item';
        div.innerHTML = \`<span>\${u.name} (\${phone})</span> <span style="color:#00a884; font-size:12px;">● Onlayn</span>\`;
        div.onclick = () => openChat(phone, u.name);
        container.appendChild(div);
      });
    });

    function openChat(phone, name) {
      activeChatPhone = phone;
      document.getElementById('chat-with-name').innerText = name;
      document.getElementById('messages').innerHTML = "";
      document.getElementById('list-section').classList.add('hidden');
      document.getElementById('chat-section').classList.remove('hidden');
    }

    function backToList() {
      activeChatPhone = null;
      document.getElementById('chat-section').classList.add('hidden');
      document.getElementById('list-section').classList.remove('hidden');
    }

    function sendMessage() {
      const input = document.getElementById('message');
      const text = input.value.trim();
      if(!text || !activeChatPhone) return;

      socket.emit('send_private_message', {
        toPhone: activeChatPhone,
        fromPhone: myPhone,
        message: text
      });

      appendMessage(text, 'sent');
      input.value = "";
    }

    socket.on('receive_private_message', (data) => {
      if(data.fromPhone === activeChatPhone) {
        appendMessage(data.message, 'received');
      } else {
        alert("Yeni mesajınız var: " + data.fromName);
      }
    });

    function appendMessage(text, type) {
      const area = document.getElementById('messages');
      const msgDiv = document.createElement('div');
      msgDiv.className = \`msg \${type}\`;
      msgDiv.innerText = text;
      area.appendChild(msgDiv);
      area.scrollTop = area.scrollHeight;
    }

    function addStatus() {
      const text = prompt("Status metnini daxil edin:");
      if(text) {
        socket.emit('post_status', { name: myName, text: text });
      }
    }

    socket.on('update_statuses', (statusList) => {
      const container = document.getElementById('status-container');
      if(statusList.length === 0) return;
      container.innerHTML = "";
      statusList.forEach(s => {
        const card = document.createElement('div');
        card.className = 'status-card';
        card.innerHTML = \`<div style="font-size:11px; color:#00a884; font-weight:bold;">\${s.name}</div><div style="font-size:13px; margin-top:3px;">\${s.text}</div>\`;
        container.appendChild(card);
      });
    });
  </script>
</body>
</html>
  `);
});

io.on('connection', (socket) => {
  socket.on('register_user', (data) => {
    users[data.phone] = { socketId: socket.id, name: data.name };
    io.emit('update_users', users);
    socket.emit('update_statuses', statuses);
  });

  socket.on('send_private_message', (data) => {
    const recipient = users[data.toPhone];
    if (recipient) {
      io.to(recipient.socketId).emit('receive_private_message', {
        fromPhone: data.fromPhone,
        fromName: users[data.fromPhone] ? users[data.fromPhone].name : data.fromPhone,
        message: data.message
      });
    }
  });

  socket.on('post_status', (data) => {
    statuses.unshift(data);
    if(statuses.length > 10) statuses.pop();
    io.emit('update_statuses', statuses);
  });

  socket.on('disconnect', () => {
    for (let phone in users) {
      if (users[phone].socketId === socket.id) {
        delete users[phone];
        break;
      }
    }
    io.emit('update_users', users);
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));





