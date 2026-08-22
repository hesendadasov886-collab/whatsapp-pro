// status.js
const statuses = [];

function initStatusSystem(io, socket, users) {
  socket.emit('update statuses', statuses);

  // Status paylaşma hadisəsi (mətn və opsional şəkil URL-i)
  socket.on('post status', (data) => {
    if (users[socket.id]) {
      // data obyekt kimi və ya sadə mətn kimi gələ bilər
      const text = typeof data === 'object' ? data.text : data;
      const imageUrl = typeof data === 'object' ? data.imageUrl : null;

      const newStatus = {
        userName: users[socket.id].name,
        text: text,
        imageUrl: imageUrl || null,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      statuses.unshift(newStatus);
      if (statuses.length > 20) statuses.pop();

      io.emit('update statuses', statuses);
    }
  });
}

module.exports = { initStatusSystem };
