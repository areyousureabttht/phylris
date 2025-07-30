let notesUnsubscribe;

function initNotes(gc) {
    const uploadBtn = document.getElementById('upload-btn');
    const noteUpload = document.getElementById('note-upload');

    uploadBtn.addEventListener('click', async () => {
        const file = noteUpload.files[0];
        if (file) {
            try {
                const compressedImage = await compressImage(file);
                uploadNote(compressedImage);
            } catch (error) {
                console.error("Error compressing image:", error);
                alert(error.message);
            }
        }
    });

    listenForNotes();
}

function uploadNote(base64Image) {
    const user = auth.currentUser;
    if (!user) return;

    db.collection('groups').doc(currentGroupCode).collection('notes').add({
        imageData: base64Image,
        uploaderName: user.displayName,
        uploaderEmail: user.email,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
}

function listenForNotes() {
    const notesGallery = document.getElementById('notes-gallery');
    notesUnsubscribe = db.collection('groups').doc(currentGroupCode).collection('notes')
        .orderBy('timestamp', 'desc')
        .onSnapshot(snapshot => {
            notesGallery.innerHTML = '';
            snapshot.forEach(doc => {
                const note = doc.data();
                const noteEl = document.createElement('div');
                noteEl.classList.add('note');
                noteEl.innerHTML = `
                    <img src="${note.imageData}" alt="Note">
                    <div class="note-info">
                        Created by ${note.uploaderName} at ${new Date(note.timestamp?.toDate()).toLocaleTimeString()}
                    </div>
                `;

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
