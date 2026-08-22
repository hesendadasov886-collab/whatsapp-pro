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
  <title>WhatsApp Pro</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: sans-serif; }
    body { background: #0b141a; color: #e9edef; display: flex; justify-content: center; height: 100vh; }
    .app-container { width: 100%; max-width: 450px; height: 100vh; background: #0b141a; display: flex; flex-direction: column; position: relative; }
    .header { background: #111b21; padding: 15px 20px; font-size: 20px; font-weight: bold; color: #e9edef; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #222d34; }
    .auth-box { padding: 25px; display: flex; flex-direction: column; gap: 15px; margin-top: 40px; }
    input { padding: 14px; background: #2a3942; border: none; border-radius: 8px; color: #fff; font-size: 15px; outline: none; }
    button.btn-main { padding: 12px; background: #00a884; border: none; border-radius: 8px; color: #111b21; font-weight: bold; font-size: 16px; cursor: pointer; }
    .content-area { flex: 1; overflow-y: auto; display: flex; flex-direction: column; padding-bottom: 70px; }
    .status-section { padding: 15px; }
    .section-title { font-size: 16px; font-weight: bold; color: #e9edef; margin-bottom: 15px; }
    .sub-title { font-size: 14px; font-weight: bold; color: #8696a0; margin: 20px 0 10px 0; }
    .status-item { display: flex; align-items: center; gap: 15px; padding: 10px 0; cursor: pointer; }
    .avatar-wrapper { position: relative; width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #202c33; }
    .avatar-wrapper.has-status { border: 2.5px solid #00a884; padding: 2px; }
    .add-icon { position: absolute; bottom: 0; right: 0; background: #00a884; color: #111b21; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; border: 2px solid #0b141a; }
    .status-info { flex: 1; display: flex; flex-direction: column; gap: 3px; }
    .status-name { font-size: 16px; font-weight: 600; color: #e9edef; }
    .status-time { font-size: 13px; color: #8696a0; }
    .user-item { padding: 12px 15px; border-bottom: 1px solid #1f2c34; cursor: pointer; display: flex; align-items: center; gap: 15px; }
    .bottom-nav { position: absolute; bottom: 0; left: 0; width: 100%; background: #111b21; display: flex; justify-content: space-around; padding: 10px 0; border-top: 1px solid #222d34; }
    .nav-item { display: flex; flex-direction: column; align-items: center; gap: 4px; color: #8696a0; font-size: 12px; cursor: pointer; background: none; border: none; width: 50%; }
    .nav-item.active { color: #00a884; }
    .nav-icon { font-size: 20px; }
    .modal { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.9); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 1000; padding: 20px; }
    .hidden { display: none !important; }
    .logout-btn { background: transparent; color: #ea0038; border: none; font-size: 13px; cursor: pointer; }
  </style>
</head>
<body>

<div class="app-container">

  <div id="auth-section" class="auth-box">
    <h2 style="color:#00a884; text-align:center;">WhatsApp Pro</h2>
    <input type="text" id="phone" placeholder="Telefon nömrəniz (+994...)">
    <input type="text" id="username" placeholder="Adınız">
    <button class="btn-main" onclick="sendOTP()">Davam Et</button>

    <div id="otp-box" class="hidden" style="display:flex; flex-direction:column; gap:10px; margin-top:10px;">
      <p style="font-size: 13px; color: #8696a0;">Test kodunu daxil edin (<b>123456</b>):</p>
      <input type="text" id="otp" placeholder="123456">
      <button class="btn-main" onclick="verifyOTP()">Daxil Ol</button>
    </div>
  </div>

  <div id="main-section" class="hidden" style="flex:1; display:flex; flex-direction:column; height:100%;">
    <div class="header">
      <span id="page-title">Gündəm</span>
      <button class="logout-btn" onclick="logout()">Çıxış</button>
    </div>

    <div class="content-area">
      <div id="tab-updates" class="status-section">
        <div class="section-title">Durum</div>
        <div class="status-item" onclick="addStatus()">
          <div class="avatar-wrapper">
            <div style="font-size: 20px;">👤</div>
            <div class="add-icon">+</div>
          </div>
          <div class="status-info">
            <div class="status-name">Durum ekle</div>
            <div class="status-time">Status paylaşmaq üçün toxunun</div>
          </div>
        </div>

        <div class="sub-title">Son güncellemeler</div>
        <div id="status-list">
          <div style="font-size:13px; color:#8696a0;">Hələ heç kim status paylaşmayıb</div>
        </div>
      </div>

      <div id="tab-chats" class="hidden">
        <div id="users-container"></div>
      </div>
    </div>

    <div class="bottom-nav">
      <button class="nav-item" id="nav-chats-btn" onclick="switchTab('chats')">
        <span class="nav-icon">💬</span>
        <span>Sohbetler</span>
      </button>
      <button class="nav-item active" id="nav-updates-btn" onclick="switchTab('updates')">
        <span class="nav-icon">⭕</span>
        <span>Güncellemeler</span>
      </button>
    </div>
  </div>

  <div id="chat-section" class="hidden" style="flex:1; display:flex; flex-direction:column; height:100%;">
    <div class="header">
      <div style="display:flex; align-items:center; gap:10px;">
        <button style="background:none; border:none; color:#00a884; font-size:20px; cursor:pointer;" onclick="closeChat()">←</button>
        <span id="chat-with-name">Çat</span>
      </div>
    </div>
    <div id="messages" style="flex:1; padding:15px; overflow-y:auto; display:flex; flex-direction:column; gap:10px;"></div>
    <div style="padding:10px; background:#111b21; display:flex; gap:8px;">
      <input type="text" id="message" placeholder="Mesaj yazın..." style="flex:1;">
      <button class="btn-main" onclick="sendMessage()" style="padding: 10px 18px;">➤</button>
    </div>
  </div>

  <div id="status-modal" class="modal hidden" onclick="closeStatusModal()">
    <div id="modal-content" style="background:#202c33; padding:20px; border-radius:12px; max-width:90%; text-align:center; color:#fff;" onclick="event.stopPropagation()">
    </div>
  </div>

</div>

<script src="/socket.io/socket.io.js"></script>
<script>
  let socket;
  let currentUser = { name: '', phone: '' };
  let activeRecipient = null;
  const chatHistories = {};

  window.onload = function() {
    const savedUser = localStorage.getItem('wp_user');
    if (savedUser) {
      currentUser = JSON.parse(savedUser);
      initApp();
    }
  };

  function sendOTP() {
    const phone = document.getElementById('phone').value;
    const username = document.getElementById('username').value;
    if (!phone || !username) return alert("Nömrə və adınızı yazın!");
    currentUser = { name: username, phone: phone };
    document.getElementById('otp-box').classList.remove('hidden');
  }

  function verifyOTP() {
    if (document.getElementById('otp').value === "123456") {
      localStorage.setItem('wp_user', JSON.stringify(currentUser));
      initApp();
    } else {
      alert("Yanlış kod! Test kodu: 123456");
    }
  }

  function logout() {
    localStorage.removeItem('wp_user');
    location.reload();
  }

  function initApp() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('main-section').classList.remove('hidden');

    socket = io();
    socket.emit('user joined', currentUser);

    socket.on('update user list', (users) => renderUserList(users));
    socket.on('update statuses', (statuses) => renderStatuses(statuses));

    socket.on('private message', (data) => {
      if (!chatHistories[data.senderId]) chatHistories[data.senderId] = [];
      chatHistories[data.senderId].push({ text: data.text, type: 'received' });

      if (activeRecipient && activeRecipient.id === data.senderId) {
        renderMessages();
      } else {
        alert(data.senderName + ' sizə mesaj yazdı!');
      }
    });
  }

  function switchTab(tab) {
    if (tab === 'updates') {
      document.getElementById('tab-updates').classList.remove('hidden');
      document.getElementById('tab-chats').classList.add('hidden');
      document.getElementById('nav-updates-btn').classList.add('active');
      document.getElementById('nav-chats-btn').classList.remove('active');
      document.getElementById('page-title').innerText = 'Gündəm';
    } else {
      document.getElementById('tab-updates').classList.add('hidden');
      document.getElementById('tab-chats').classList.remove('hidden');
      document.getElementById('nav-updates-btn').classList.remove('active');
      document.getElementById('nav-chats-btn').classList.add('active');
      document.getElementById('page-title').innerText = 'WhatsApp';
    }
  }

  function addStatus() {
    const text = prompt("Status mətninizi yazın:");
    if (!text || !text.trim()) return;

    const imageUrl = prompt("Varsa Şəkil URL-i daxil edin (istəməsəniz boş saxlayın):");

    socket.emit('post status', {
      text: text.trim(),
      imageUrl: imageUrl && imageUrl.trim() ? imageUrl.trim() : null
    });
  }

  function renderStatuses(statuses) {
    const box = document.getElementById('status-list');
    if (!statuses || statuses.length === 0) {
      box.innerHTML = '<div style="font-size:13px; color:#8696a0;">Hələ heç kim status paylaşmayıb</div>';
      return;
    }

    box.innerHTML = statuses.map(s => `
      <div class="status-item" onclick="viewStatus('${s.userName}', '${s.text}', '${s.imageUrl || ''}', '${s.time}')">
        <div class="avatar-wrapper has-status">
          <div style="font-size:18px;">👤</div>
        </div>
        <div class="status-info">
          <div class="status-name">${s.userName}</div>
          <div class="status-time">${s.time}</div>
        </div>
      </div>
    `).join('');
  }

  function viewStatus(name, text, img, time) {
    const modal = document.getElementById('status-modal');
    const content = document.getElementById('modal-content');
    
    content.innerHTML = `
      <h3 style="color:#00a884; margin-bottom:8px;">${name}</h3>
      <p style="font-size:12px; color:#8696a0; margin-bottom:15px;">${time}</p>
      ${img ? `<img src="${img}" style="max-width:100%; max-height:250px; border-radius:8px; margin-bottom:12px;" onerror="this.style.display='none'">` : ''}
      <p style="font-size:16px; word-break:break-word;">${text}</p>
      <button onclick="closeStatusModal()" style="margin-top:20px; padding:8px 16px; background:#00a884; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">Bağla</button>
    `;
    
    modal.classList.remove('hidden');
  }

  function closeStatusModal() {
    document.getElementById('status-modal').classList.add('hidden');
  }

  function renderUserList(users) {
    const container = document.getElementById('users-container');
    container.innerHTML = '';
    const otherUsers = users.filter(u => u.id !== socket.id);

    if (otherUsers.length === 0) {
      container.innerHTML = '<p style="color:#8696a0; text-align:center; padding:30px;">Hələlik başqa onlayn istifadəçi yoxdur.</p>';
      return;
    }

    otherUsers.forEach(u => {
      const div = document.createElement('div');
      div.className = 'user-item';
      div.innerHTML = `
        <div class="avatar-wrapper"><div style="font-size:20px;">👤</div></div>
        <div style="flex:1;">
          <div style="font-weight:600; font-size:16px; color:#e9edef;">${u.name}</div>
          <div style="font-size:13px; color:#8696a0;">${u.phone}</div>
        </div>
        <span style="color:#00a884; font-size:12px;">● Onlayn</span>
      `;
      div.onclick = () => openChat(u);
      container.appendChild(div);
    });
  }

  function openChat(user) {
    activeRecipient = user;
    if (!chatHistories[user.id]) chatHistories[user.id] = [];
    document.getElementById('chat-with-name').innerText = user.name;
    document.getElementById('main-section').classList.add('hidden');
    document.getElementById('chat-section').classList.remove('hidden');
    renderMessages();
  }

  function closeChat() {
    activeRecipient = null;
    document.getElementById('chat-section').classList.add('hidden');
    document.getElementById('main-section').classList.remove('hidden');
  }

  function sendMessage() {
    const input = document.getElementById('message');
    const text = input.value.trim();
    if (!text || !activeRecipient) return;

    socket.emit('private message', {
      recipientId: activeRecipient.id,
      text: text,
      senderName: currentUser.name,
      senderPhone: currentUser.phone
    });

    chatHistories[activeRecipient.id].push({ text: text, type: 'sent' });
    renderMessages();
    input.value = '';
  }

  function renderMessages() {
    const area = document.getElementById('messages');
    area.innerHTML = '';
    if (!activeRecipient || !chatHistories[activeRecipient.id]) return;

    chatHistories[activeRecipient.id].forEach(msg => {
      const div = document.createElement('div');
      div.style.padding = '8px 12px';
      div.style.borderRadius = '8px';
      div.style.maxWidth = '75%';
      div.style.fontSize = '14px';
      div.style.wordBreak = 'break-word';
      
      if (msg.type === 'sent') {
        div.style.background = '#005c4b';
        div.style.alignSelf = 'flex-end';
      } else {
        div.style.background = '#202c33';
        div.style.alignSelf = 'flex-start';
      }
      
      div.innerText = msg.text;
      area.appendChild(div);
    });
    area.scrollTop = area.scrollHeight;
  }
</script>
</body>
</html>
  `);
});

io.on('connection', (socket) => {
  socket.emit('update statuses', statuses);

  socket.on('user joined', (data) => {
    users[socket.id] = { name: data.name, phone: data.phone, id: socket.id };
    io.emit('update user list', Object.values(users));
  });

  socket.on('post status', (data) => {
    const user = users[socket.id];
    if (!user) return;

    const newStatus = {
      id: Date.now(),
      userName: user.name,
      userPhone: user.phone,
      text: data.text,
      imageUrl: data.imageUrl,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    statuses.unshift(newStatus);
    io.emit('update statuses', statuses);
  });

  socket.on('private message', (data) => {
    io.to(data.recipientId).emit('private message', {
      senderId: socket.id,
      senderName: data.senderName,
      senderPhone: data.senderPhone,
      text: data.text
    });
  });

  socket.on('disconnect', () => {
    delete users[socket.id];
    io.emit('update user list', Object.values(users));
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));

