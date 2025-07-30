let groupCode;
let messagesUnsubscribe;

function initChat(gc) {
    groupCode = gc;
    const chatForm = document.getElementById('chat-input-container');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');

    sendBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (message) {
            sendMessage(message);
            chatInput.value = '';
        }
    });

    listenForMessages();
    listenForTyping();

    let typingTimer;
    chatInput.addEventListener('input', () => {
        const user = auth.currentUser;
        if (!user) return;

        if (!typingTimer) {
            db.collection('groups').doc(groupCode).collection('typing').doc(user.uid).set({
                name: user.displayName
            });
        }

        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
            db.collection('groups').doc(groupCode).collection('typing').doc(user.uid).delete();
            typingTimer = null;
        }, 3000);
    });
}

function sendMessage(message) {
    const user = auth.currentUser;
    if (!user) return;

    db.collection('groups').doc(groupCode).collection('messages').add({
        text: message,
        senderName: user.displayName,
        senderPhoto: user.photoURL,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Clear typing indicator
    db.collection('groups').doc(groupCode).collection('typing').doc(user.uid).delete();
}

function listenForMessages() {
    const chatMessages = document.getElementById('chat-messages');
    messagesUnsubscribe = db.collection('groups').doc(groupCode).collection('messages')
        .orderBy('timestamp')
        .onSnapshot(snapshot => {
            chatMessages.innerHTML = '';
            snapshot.forEach(doc => {
                const message = doc.data();
                const messageEl = document.createElement('div');
                messageEl.classList.add('message');
                if (message.senderName === auth.currentUser.displayName) {
                    messageEl.classList.add('own');
                } else {
                    messageEl.classList.add('other');
                }

                messageEl.innerHTML = `
                    <img class="message-avatar" src="${message.senderPhoto}" alt="${message.senderName}">
                    <div class="message-content">
                        <div class="message-sender">${message.senderName}</div>
                        <div>${message.text}</div>
                    </div>
                `;
                chatMessages.appendChild(messageEl);
            });
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
}

function stopListeningForMessages() {
    if (messagesUnsubscribe) {
        messagesUnsubscribe();
    }
}

function listenForTyping() {
    const typingIndicator = document.getElementById('typing-indicator');
    db.collection('groups').doc(groupCode).collection('typing')
        .onSnapshot(snapshot => {
            const typingUsers = [];
            snapshot.forEach(doc => {
                if (doc.id !== auth.currentUser.uid) {
                    typingUsers.push(doc.data().name);
                }
            });

            if (typingUsers.length > 0) {
                typingIndicator.textContent = `${typingUsers.join(', ')} is typing...`;
            } else {
                typingIndicator.textContent = '';
            }
        });
}
