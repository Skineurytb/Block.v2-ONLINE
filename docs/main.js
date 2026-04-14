// ============ AVATAR RENDERER ============
function renderCharMugshot() {
  return `<div class="char-mugshot"></div>`;
}

// ============ FRIEND SYSTEM (Using Backend API) ============

async function getFriendships() {
  try {
    const result = await apiFetch('/api/friends');
    return result.friends || [];
  } catch (e) {
    console.error('Get friendships error:', e);
    return [];
  }
}

async function getFriendRequests() {
  try {
    const result = await apiFetch('/api/friend-requests');
    return {
      incoming: result.incoming || [],
      outgoing: result.outgoing || []
    };
  } catch (e) {
    console.error('Get friend requests error:', e);
    return { incoming: [], outgoing: [] };
  }
}

async function sendFriendRequest(toEmail) {
  try {
    const result = await apiFetch('/api/send-friend-request', {
      method: 'POST',
      body: { to: toEmail }
    });
    return result;
  } catch (e) {
    console.error('Send friend request error:', e);
    return { success: false, error: e.message };
  }
}

async function acceptFriendRequest(fromEmail) {
  try {
    const result = await apiFetch('/api/accept-friend-request', {
      method: 'POST',
      body: { from: fromEmail }
    });
    return result;
  } catch (e) {
    console.error('Accept friend request error:', e);
    return { success: false, error: e.message };
  }
}

async function declineFriendRequest(fromEmail) {
  try {
    const result = await apiFetch('/api/decline-friend-request', {
      method: 'POST',
      body: { from: fromEmail }
    });
    return result;
  } catch (e) {
    console.error('Decline friend request error:', e);
    return { success: false, error: e.message };
  }
}

async function removeFriend(otherEmail) {
  try {
    const result = await apiFetch('/api/remove-friend', {
      method: 'POST',
      body: { other: otherEmail }
    });
    return result;
  } catch (e) {
    console.error('Remove friend error:', e);
    return { success: false, error: e.message };
  }
}

async function getFriendshipStatus(otherEmail) {
  const friends = await getFriendships();
  if (friends.some(f => f.email === otherEmail)) return 'accepted';
  
  const requests = await getFriendRequests();
  if (requests.incoming.some(r => r.email === otherEmail)) return 'received';
  if (requests.outgoing.some(r => r.email === otherEmail)) return 'sent';
  return null;
}

// ============ MESSAGING (Using Backend API) ============

async function loadMessagesTab() {
  const friendsList = document.getElementById('messages-friends-list');
  try {
    const result = await apiFetch('/api/friends');
    const friends = result.friends || [];
    
    friendsList.innerHTML = '';
    if (friends.length === 0) {
      friendsList.innerHTML = '<div class="messages-empty">No friends to message.</div>';
      return;
    }
    
    for (const friend of friends) {
      const item = document.createElement('div');
      item.className = 'messages-friend-item';
      item.addEventListener('click', (event) => openChat(event, friend.email));
      item.innerHTML = `
        <div class="messages-friend-avatar">${renderCharMugshot()}</div>
        <div class="messages-friend-name">${escapeHtml(friend.username || friend.email.split('@')[0])}</div>
      `;
      friendsList.appendChild(item);
    }
  } catch (e) {
    console.error('Load messages tab error:', e);
    friendsList.innerHTML = '<div class="messages-empty">Error loading friends.</div>';
  }
}

async function openChat(event, friendEmail) {
  const status = await getFriendshipStatus(friendEmail);
  if (status !== 'accepted') {
    alert('You can only message friends.');
    return;
  }
  
  currentChatFriend = friendEmail;
  document.querySelectorAll('.messages-friend-item').forEach(item => item.classList.remove('active'));
  if (event && event.currentTarget) {
    event.currentTarget.classList.add('active');
  }
  
  const username = friendEmail.split('@')[0];
  document.getElementById('messages-chat-header').textContent = `Chatting with ${username}`;
  await loadMessages(friendEmail);
}

async function loadMessages(friendEmail) {
  const messagesDiv = document.getElementById('messages-chat-messages');
  messagesDiv.innerHTML = '<div style="text-align:center; color:var(--muted);">Loading...</div>';
  
  if (messagesUnsub) {
    messagesUnsub();
    messagesUnsub = null;
  }
  
  try {
    const result = await apiFetch(`/api/messages?friend=${encodeURIComponent(friendEmail)}`);
    renderMessages(result.messages || []);
    
    // Set up polling for new messages (every 3 seconds)
    const pollMessages = async () => {
      try {
        const result = await apiFetch(`/api/messages?friend=${encodeURIComponent(friendEmail)}`);
        renderMessages(result.messages || []);
      } catch (e) {
        console.error('Poll messages error:', e);
      }
    };
    
    messagesUnsub = setInterval(pollMessages, 3000);
    
  } catch (e) {
    console.error('Load messages error:', e);
    messagesDiv.innerHTML = '<div style="text-align:center; color:var(--red);">Failed to load messages.</div>';
  }
}

function renderMessages(messages) {
  const messagesDiv = document.getElementById('messages-chat-messages');
  messagesDiv.innerHTML = '';
  
  if (!messages || messages.length === 0) {
    messagesDiv.innerHTML = '<div style="text-align:center; color:var(--muted); font-size:0.85rem;">No messages yet. Say hi! 👋</div>';
    return;
  }
  
  messages.forEach(msg => {
    const item = document.createElement('div');
    item.className = `message-item ${msg.from === currentUser ? 'sent' : 'received'}`;
    item.innerHTML = `<div class="message-bubble">${escapeHtml(msg.text)}</div>`;
    messagesDiv.appendChild(item);
  });
  
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById('messages-input');
  const text = input.value.trim();
  
  if (!text || !currentChatFriend) return;
  
  try {
    await apiFetch('/api/send-message', {
      method: 'POST',
      body: { friend: currentChatFriend, text }
    });
    input.value = '';
  } catch (e) {
    console.error('Send message error:', e);
    alert('Failed to send message. Please try again.');
  }
}

// ============ LOAD FRIENDS TAB ============

async function loadFriendsTab() {
  const reqList = document.getElementById('friends-requests-list');
  const fList = document.getElementById('friends-list');
  const badge = document.getElementById('friends-req-badge');
  
  try {
    // Load requests
    const { incoming } = await getFriendRequests();
    reqList.innerHTML = '';
    
    if (incoming.length === 0) {
      reqList.innerHTML = '<div class="friends-empty">No pending requests.</div>';
    } else {
      for (const req of incoming) {
        const row = document.createElement('div');
        row.className = 'friend-row';
        row.innerHTML = `
          <div class="friend-row-info">
            <div class="friend-row-name">${renderCharMugshot()} ${escapeHtml(req.username || req.email.split('@')[0])}</div>
          </div>
          <div class="friend-row-actions">
            <button class="btn-sm btn-sm-green" onclick="window.handleAccept('${escapeHtml(req.email)}')">Accept</button>
            <button class="btn-sm btn-sm-red" onclick="window.handleDecline('${escapeHtml(req.email)}')">Decline</button>
          </div>
        `;
        reqList.appendChild(row);
      }
    }
    
    if (badge) {
      badge.textContent = incoming.length > 0 ? incoming.length : '';
      badge.style.display = incoming.length > 0 ? 'inline-flex' : 'none';
    }

    // Load friends
    const result = await apiFetch('/api/friends');
    const friends = result.friends || [];
    fList.innerHTML = '';
    
    if (friends.length === 0) {
      fList.innerHTML = '<div class="friends-empty">No friends yet. Search for a user and add them!</div>';
    } else {
      for (const friend of friends) {
        const row = document.createElement('div');
        row.className = 'friend-row';
        row.innerHTML = `
          <div class="friend-row-info">
            <div class="friend-row-name">${renderCharMugshot()} ${escapeHtml(friend.username || friend.email.split('@')[0])}</div>
            <div class="friend-row-stats">
              <span>Email: ${escapeHtml(friend.email)}</span>
            </div>
          </div>
          <div class="friend-row-actions">
            <button class="btn-sm btn-sm-red" onclick="window.handleRemove('${escapeHtml(friend.email)}')">Remove</button>
          </div>
        `;
        fList.appendChild(row);
      }
    }
  } catch (e) {
    console.error('Load friends tab error:', e);
    reqList.innerHTML = '<div class="friends-empty">Error loading requests.</div>';
    fList.innerHTML = '<div class="friends-empty">Error loading friends.</div>';
    if (badge) badge.style.display = 'none';
  }
}

async function handleAccept(fromEmail) {
  const result = await acceptFriendRequest(fromEmail);
  if (result.success) {
    await loadFriendsTab();
    if (document.getElementById('tab-messages').classList.contains('active')) {
      loadMessagesTab();
    }
  } else {
    alert('Failed to accept: ' + (result.error || 'Unknown error'));
  }
}

async function handleDecline(fromEmail) {
  await declineFriendRequest(fromEmail);
  await loadFriendsTab();
}

async function handleRemove(otherEmail) {
  await removeFriend(otherEmail);
  await loadFriendsTab();
  if (currentChatFriend === otherEmail) {
    currentChatFriend = null;
    document.getElementById('messages-chat-header').textContent = 'Select a friend to start chatting';
    document.getElementById('messages-chat-messages').innerHTML = '';
    if (messagesUnsub) {
      clearInterval(messagesUnsub);
      messagesUnsub = null;
    }
  }
}

// ============ SEARCH FRIEND ============

async function searchFriend() {
  const q = document.getElementById('friend-search-input').value.trim();
  const result = document.getElementById('friend-result');
  
  if (!q) {
    result.innerHTML = '<div class="search-err">Type a username to search.</div>';
    return;
  }
  
  if (q.toLowerCase() === (currentUsername || currentUser?.split('@')[0])?.toLowerCase()) {
    result.innerHTML = '<div class="search-err">That\'s you!</div>';
    return;
  }
  
  result.innerHTML = '<div class="search-loading">Searching...</div>';
  
  try {
    const doc = await db.collection('users').doc(q.toLowerCase()).get();
    if (!doc.exists) {
      result.innerHTML = '<div class="search-err">User not found.</div>';
      return;
    }
    
    const userData = doc.data();
    const email = userData.email;
    
    if (email === currentUser) {
      result.innerHTML = '<div class="search-err">That\'s you!</div>';
      return;
    }
    
    const userAvatar = userData.avatar || '👤';
    const avatarDisplay = userAvatar && userAvatar.includes('.png')
      ? `<img src="${userAvatar}" class="avatar-3d" alt="Avatar" style="width:20px;height:30px;image-rendering:pixelated;vertical-align:middle;"/>`
      : '👤';
    const displayUsername = userData.username || q;
    const snakeBest = userData.snake_best || 0;
    const tetrisBest = userData.tetris_best || 0;

    const status = await getFriendshipStatus(email);

    let buttonText = 'Add Friend';
    let buttonClass = 'btn-sm';
    let buttonDisabled = false;
    let clickHandler = () => handleAddFriend(email);

    if (status === 'accepted') {
      buttonText = '✓ Friends';
      buttonDisabled = true;
      clickHandler = null;
    } else if (status === 'sent') {
      buttonText = '⏳ Pending';
      buttonDisabled = true;
      clickHandler = null;
    } else if (status === 'received') {
      buttonText = '✓ Accept';
      buttonClass = 'btn-sm btn-sm-green';
      clickHandler = () => handleAccept(email);
    }

    result.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'friend-row';

    const info = document.createElement('div');
    info.className = 'friend-row-info';

    const name = document.createElement('div');
    name.className = 'friend-row-name';
    name.innerHTML = `${renderCharMugshot()} ${displayUsername}`;
    
    const stats = document.createElement('div');
    stats.className = 'friend-row-stats';
    stats.innerHTML = `<span>Snake: ${snakeBest}</span><span>Tetris: ${tetrisBest}</span>`;
    
    info.appendChild(name);
    info.appendChild(stats);
    
    const actions = document.createElement('div');
    actions.className = 'friend-row-actions';
    const button = document.createElement('button');
    button.className = buttonClass;
    button.textContent = buttonText;
    if (buttonDisabled) button.disabled = true;
    if (clickHandler) button.addEventListener('click', clickHandler);
    
    actions.appendChild(button);
    card.appendChild(info);
    card.appendChild(actions);
    result.appendChild(card);
    
  } catch (e) {
    console.error('Search error:', e);
    result.innerHTML = '<div class="search-err">Search failed. Try again.</div>';
  }
}

async function handleAddFriend(toEmail) {
  const result = await sendFriendRequest(toEmail);
  if (result.success) {
    searchFriend(); // Refresh to show updated status
  } else {
    alert('Failed to send request: ' + (result.error || 'Unknown error'));
  }
}

// ============ UTILITY ============

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============ EXPOSE FUNCTIONS TO WINDOW ============

window.handleAccept = handleAccept;
window.handleDecline = handleDecline;
window.handleRemove = handleRemove;
window.searchFriend = searchFriend;
window.handleAddFriend = handleAddFriend;
window.loadFriendsTab = loadFriendsTab;
window.loadMessagesTab = loadMessagesTab;
window.sendMessage = sendMessage;
window.openChat = openChat;