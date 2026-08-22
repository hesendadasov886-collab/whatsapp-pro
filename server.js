const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Yaddaşda saxlanılan məlumatlar
let messages = [];
let statuses = [];

io.on('connection', (socket) => {
    console.log('Yeni istifadəçi qoşuldu');

    // Əvvəlki mesajları göndər
    socket.emit('initial-messages', messages);
    socket.emit('initial-statuses', statuses);

    // Yeni mesaj
    socket.on('send-message', (data) => {
        messages.push(data);
        if (messages.length > 100) messages.shift(); // Son 100 mesajı saxla
        io.emit('new-message', data);
    });

    // Yeni status
    socket.on('send-status', (data) => {
        statuses.push(data);
        io.emit('new-status', data);
    });
});

// HTML Səhifəsi (Düzəldilmiş sintaksis ilə)
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
        body { background: #121b22; color: #e9edef; display: flex; justify-content: center; height: 100vh; }
        .app-container { width: 100%; max-width: 450px; background: #0b141a; display: flex; flex-direction: column; height: 100%; }
        .header { background: #202c33; padding: 15px; font-weight: bold; font-size: 18px; color: #00a884; }
        .chat-box { flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
        .message { background: #202c33; padding: 8px 12px; border-radius: 8px; max-width: 80%; width: fit-content; word-break: break-word; }
        .status-container { padding: 10px; background: #111b21; border-bottom: 1px solid #222d34; display: flex; gap: 10px; overflow-x: auto; }
        .status-item { background: #202c33; border: 2px solid #00a884; border-radius: 50%; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; font-size: 12px; }
        .input-box { display: flex; padding: 10px; background: #202c33; gap: 8px; }
        input { flex: 1; padding: 10px; border-radius: 20px; border: none; background: #2a3942; color: #fff; outline: none; }
        button { background: #00a884; border: none; padding: 10px 15px; border-radius: 50%; color: white; cursor: pointer; }
    </style>
</head>
<body>
    <div class="app-container">
        <div class="header">WhatsApp Pro</div>
        <div class="status-container" id="status-list"></div>
        <div class="chat-box" id="chat-box"></div>
        <div class="input-box">
            <input type="text" id="username" placeholder="Adınız..." style="max-width: 80px;">
            <input type="text" id="message-input" placeholder="Mesaj yazın...">
            <button onclick="sendMessage()">➤</button>
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();

        function escapeHTML(str) {
            return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        }

        socket.on('initial-messages', (msgs) => {
            const chat = document.getElementById('chat-box');
            chat.innerHTML = msgs.map(m => \`<div class="message"><b>\${m.user}:</b> \${m.text}</div>\`).join('');
            chat.scrollTop = chat.scrollHeight;
        });

        socket.on('initial-statuses', (stats) => {
            const list = document.getElementById('status-list');
            list.innerHTML = stats.map(s => {
                const uName = escapeHTML(s.userName);
                const uText = escapeHTML(s.text);
                const uImg = escapeHTML(s.imageUrl || '');
                const uTime = escapeHTML(s.time);
                return \`<div class="status-item" onclick="viewStatus('\${uName}', '\${uText}', '\${uImg}', '\${uTime}')">\${uName.slice(0, 3)}</div>\`;
            }).join('');
        });

        socket.on('new-message', (m) => {
            const chat = document.getElementById('chat-box');
            chat.innerHTML += \`<div class="message"><b>\${m.user}:</b> \${m.text}</div>\`;
            chat.scrollTop = chat.scrollHeight;
        });

        function sendMessage() {
            const user = document.getElementById('username').value || 'Anonim';
            const text = document.getElementById('message-input').value;
            if (text.trim()) {
                socket.emit('send-message', { user, text });
                document.getElementById('message-input').value = '';
            }
        }

        function viewStatus(user, text, img, time) {
            alert(user + ': ' + text);
        }
    </script>
</body>
</html>
    `);
});

http.listen(PORT, () => {
    console.log("Server status: OK! Port: " + PORT);
});


