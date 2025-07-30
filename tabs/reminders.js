let remindersUnsubscribe;

function initReminders(gc) {
    const addReminderBtn = document.getElementById('add-reminder-btn');
    const reminderTitleInput = document.getElementById('reminder-title');
    const reminderDateInput = document.getElementById('reminder-date');

    addReminderBtn.addEventListener('click', () => {
        const title = reminderTitleInput.value.trim();
        const dueDate = reminderDateInput.value;
        if (title && dueDate) {
            addReminder(title, dueDate);
            reminderTitleInput.value = '';
            reminderDateInput.value = '';
        }
    });

    listenForReminders();
}

function addReminder(title, dueDate) {
    const user = auth.currentUser;
    if (!user) return;

    db.collection('groups').doc(currentGroupCode).collection('reminders').add({
        title: title,
        dueDate: dueDate,
        creator: user.displayName,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
}

function listenForReminders() {
    const remindersList = document.getElementById('reminders-list');
    remindersUnsubscribe = db.collection('groups').doc(currentGroupCode).collection('reminders')
        .orderBy('dueDate')
        .onSnapshot(snapshot => {
            remindersList.innerHTML = '';
            snapshot.forEach(doc => {
                const reminder = doc.data();
                const reminderEl = document.createElement('div');
                reminderEl.classList.add('reminder');
                reminderEl.innerHTML = `
                    <span>${reminder.title}</span>
                    <span>${reminder.dueDate}</span>
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
