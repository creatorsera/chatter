const socket = io();
let currentUser = '';
let currentChatUser = '';

function login() {
  const username = document.getElementById('username-input').value.trim();
  if (username) {
    currentUser = username;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('chat-container').style.display = 'flex';
    socket.emit('login', username);
  }
}

// Update user list
socket.on('userList', (users) => {
  const userList = document.getElementById('user-list');
  userList.innerHTML = '';
  users.forEach((user) => {
    if (user !== currentUser) {
      const li = document.createElement('li');
      li.textContent = user;
      li.onclick = () => selectUser(user);
      userList.appendChild(li);
    }
  });
});

// Select a user to chat with
function selectUser(user) {
  currentChatUser = user;
  document.getElementById('chat-with').textContent = user;
  document.getElementById('messages').innerHTML = '';
  // Reload message history for this user
  socket.emit('login', currentUser); // Refresh history
}

// Receive message history
socket.on('messageHistory', (messages) => {
  messages.forEach((msg) => {
    if (
      (msg.from === currentUser && msg.to === currentChatUser) ||
      (msg.from === currentChatUser && msg.to === currentUser)
    ) {
      displayMessage(msg);
    }
  });
});

// Receive new message
socket.on('newMessage', (msg) => {
  if (
    (msg.from === currentUser && msg.to === currentChatUser) ||
    (msg.from === currentChatUser && msg.to === currentUser)
    ) {
    displayMessage(msg);
  }
});

// Display a message
function displayMessage({ from, text, timestamp }) {
  const messages = document.getElementById('messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${from === currentUser ? 'sent' : 'received'}`;
  messageDiv.innerHTML = `
    <div class="message-bubble">${text}</div>
    <div class="timestamp">${timestamp}</div>
  `;
  messages.appendChild(messageDiv);
  messages.scrollTop = messages.scrollHeight;
}

// Send a message
function sendMessage() {
  const input = document.getElementById('message-input');
  const text = input.value.trim();
  if (text && currentChatUser) {
    socket.emit('sendMessage', { to: currentChatUser, text });
    input.value = '';
  }
}

// Typing indicator
document.getElementById('message-input').addEventListener('input', () => {
  if (currentChatUser) {
    socket.emit('typing', { to: currentChatUser });
  }
});

socket.on('typing', (username) => {
  if (username === currentChatUser) {
    const typingIndicator = document.getElementById('typing-indicator');
    typingIndicator.textContent = `${username} is typing...`;
    setTimeout(() => {
      typingIndicator.textContent = '';
    }, 2000);
  }
});

// Send message on Enter key
document.getElementById('message-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});
