let notesUnsubscribe;

function initNotes(gc) {
    groupCode = gc;
    const uploadBtn = document.getElementById('upload-btn');
    const noteUpload = document.getElementById('note-upload');
    const noteTextInput = document.getElementById('note-text-input');

    uploadBtn.addEventListener('click', async () => {
        const file = noteUpload.files[0];
        const text = noteTextInput.value.trim();

        if (file) {
            try {
                const compressedImage = await compressImage(file);
                uploadNote({ imageData: compressedImage, text: text }, groupCode);
            } catch (error) {
                console.error("Error compressing image:", error);
                alert(error.message);
            }
        } else if (text) {
            uploadNote({ text: text }, groupCode);
        }
        noteTextInput.value = '';
        noteUpload.value = '';
    });

    listenForNotes(groupCode);
}

function uploadNote(noteData, groupCode) {
    const user = auth.currentUser;
    if (!user) return;

    const data = {
        ...noteData,
        uploaderName: user.displayName,
        uploaderEmail: user.email,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection('groups').doc(groupCode).collection('notes').add(data);
}

function listenForNotes(groupCode) {
    const notesGallery = document.getElementById('notes-gallery');
    notesUnsubscribe = db.collection('groups').doc(groupCode).collection('notes')
        .orderBy('timestamp', 'desc')
        .onSnapshot(snapshot => {
            notesGallery.innerHTML = '';
            snapshot.forEach(doc => {
                const note = doc.data();
                const noteEl = document.createElement('div');
                noteEl.classList.add('note');
                if (note.imageData) {
                    noteEl.innerHTML = `
                        <img src="${note.imageData}" alt="Note">
                    `;
                }
                if (note.text) {
                    const textEl = document.createElement('p');
                    textEl.textContent = note.text;
                    noteEl.appendChild(textEl);
                }

                const infoEl = document.createElement('div');
                infoEl.classList.add('note-info');
                infoEl.innerHTML = `
                    Created by ${note.uploaderName} at ${new Date(note.timestamp?.toDate()).toLocaleTimeString()}
                `;
                noteEl.appendChild(infoEl);

                if (note.uploaderEmail === auth.currentUser.email) {
                    const deleteBtn = document.createElement('button');
                    deleteBtn.classList.add('delete-note-btn');
                    deleteBtn.innerHTML = '🗑️';
                    deleteBtn.onclick = () => deleteNote(doc.id);
                    noteEl.appendChild(deleteBtn);
                }

                notesGallery.appendChild(noteEl);
            });
        });
}

function deleteNote(noteId) {
    if (confirm('Are you sure you want to delete this note?')) {
        db.collection('groups').doc(currentGroupCode).collection('notes').doc(noteId).delete();
    }
}

function stopListeningForNotes() {
    if (notesUnsubscribe) {
        notesUnsubscribe();
    }
}
