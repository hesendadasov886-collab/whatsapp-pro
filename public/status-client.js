// public/status-client.js

function setupStatusUI() {
  const header = document.querySelector('.header');
  if (header && !document.getElementById('status-btn')) {
    const btn = document.createElement('button');
    btn.id = 'status-btn';
    btn.innerText = '+ Status';
    btn.style.cssText = 'font-size: 12px; padding: 6px 10px; cursor: pointer; background: #00a884; border: none; border-radius: 6px; color: #fff; font-weight: bold;';
    btn.onclick = addStatus;
    header.appendChild(btn);
  }
}

function addStatus() {
  const text = prompt("Status mətninizi yazın:");
  if (!text || !text.trim()) return;

  const imageUrl = prompt("Varsa Şəkil URL-i daxil edin (boş saxlaya bilərsiniz):");

  if (window.socket) {
    window.socket.emit('post status', {
      text: text.trim(),
      imageUrl: imageUrl && imageUrl.trim() ? imageUrl.trim() : null
    });
  }
}

function renderStatuses(statuses) {
  let box = document.getElementById('status-container');
  
  if (!box) {
    box = document.createElement('div');
    box.id = 'status-container';
    box.style.cssText = 'background: #182229; padding: 10px; display: flex; gap: 10px; overflow-x: auto; border-bottom: 1px solid #222d34; align-items: flex-start;';
    
    const listSection = document.getElementById('list-section');
    if (listSection) {
      listSection.insertBefore(box, listSection.children[1]);
    }
  }

  if (!statuses || statuses.length === 0) {
    box.innerHTML = '<span style="font-size:12px; color:#8696a0; align-self:center;">Hələ status paylaşılmayıb</span>';
    return;
  }

  box.innerHTML = statuses.map(s => `
    <div style="background: #202c33; padding: 8px 10px; border-radius: 12px; min-width: 140px; max-width: 180px; border-left: 3px solid #00a884; flex-shrink: 0;">
      <div style="font-size:11px; color:#00a884; font-weight:bold; margin-bottom: 4px;">${s.userName}</div>
      ${s.imageUrl ? `<img src="${s.imageUrl}" alt="Status" style="width: 100%; max-height: 120px; object-fit: cover; border-radius: 6px; margin-bottom: 4px;" onerror="this.style.display='none'">` : ''}
      <div style="font-size:12px; color:#fff; word-break: break-word;">${s.text}</div>
      <div style="font-size:9px; color:#8696a0; text-align:right; margin-top: 4px;">${s.time}</div>
    </div>
  `).join('');
}

function listenStatusEvents(socket) {
  window.socket = socket;
  setupStatusUI();
  socket.on('update statuses', (statuses) => renderStatuses(statuses));
}
