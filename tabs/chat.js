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
