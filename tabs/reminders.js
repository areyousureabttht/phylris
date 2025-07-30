let remindersUnsubscribe;

function initReminders(gc) {
    groupCode = gc;
    const addReminderBtn = document.getElementById('add-reminder-btn');
    const reminderTitleInput = document.getElementById('reminder-title');
    const reminderDateInput = document.getElementById('reminder-date');

    addReminderBtn.addEventListener('click', () => {
        const title = reminderTitleInput.value.trim();
        const dueDate = reminderDateInput.value;
        if (title && dueDate) {
            addReminder(title, dueDate, groupCode);
            reminderTitleInput.value = '';
            reminderDateInput.value = '';
        }
    });

    listenForReminders(groupCode);
}

function addReminder(title, dueDate, groupCode) {
    const user = auth.currentUser;
    if (!user) return;

    db.collection('groups').doc(groupCode).collection('reminders').add({
        title: title,
        dueDate: dueDate,
        creator: user.displayName,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
}

function listenForReminders(groupCode) {
    const remindersList = document.getElementById('reminders-list');
    remindersUnsubscribe = db.collection('groups').doc(groupCode).collection('reminders')
        .orderBy('dueDate')
        .onSnapshot(snapshot => {
            remindersList.innerHTML = '';
            snapshot.forEach(doc => {
                const reminder = doc.data();
                const reminderEl = document.createElement('div');
                reminderEl.classList.add('reminder');
                reminderEl.innerHTML = `
                    <input type="checkbox" ${reminder.completed ? 'checked' : ''} onchange="toggleReminder('${doc.id}', this.checked)">
                    <span class="reminder-title ${reminder.completed ? 'completed' : ''}">${reminder.title}</span>
                    <span class="reminder-due-date">${reminder.dueDate}</span>
                    <button class="delete-reminder-btn" onclick="deleteReminder('${doc.id}')">🗑️</button>
                `;
                remindersList.appendChild(reminderEl);
            });
        });
}

function stopListeningForReminders() {
    if (remindersUnsubscribe) {
        remindersUnsubscribe();
    }
}

function toggleReminder(reminderId, completed) {
    db.collection('groups').doc(groupCode).collection('reminders').doc(reminderId).update({
        completed: completed
    });
}

function deleteReminder(reminderId) {
    if (confirm('Are you sure you want to delete this reminder?')) {
        db.collection('groups').doc(groupCode).collection('reminders').doc(reminderId).delete();
    }
}
