const firebaseConfig = {
  apiKey: "AIzaSyDvdc1PclTwMf0-ZjXwacqnMumvIfp_U9U",
  authDomain: "studycircle-ff5e5.firebaseapp.com",
  projectId: "studycircle-ff5e5",
  storageBucket: "studycircle-ff5e5.appspot.com",
  messagingSenderId: "608155286662",
  appId: "1:608155286662:web:461b177c4abf5575882507",
  measurementId: "G-8N9PWSJC8E"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {
    const groupContainer = document.getElementById('group-container');
    const mainApp = document.getElementById('main-app');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const userInfo = document.getElementById('user-info');
    const userPhoto = document.getElementById('user-photo');
    const userName = document.getElementById('user-name');

    const provider = new firebase.auth.GoogleAuthProvider();

    loginBtn.addEventListener('click', () => {
        auth.signInWithPopup(provider)
            .then((result) => {
                const user = result.user;
                showApp(user);
            })
            .catch((error) => {
                console.error("Error during sign-in:", error);
            });
    });

    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            showLogin();
        });
    });

    auth.onAuthStateChanged((user) => {
        if (user) {
            showApp(user);
        } else {
            showLogin();
        }
    });

    function showApp(user) {
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';
        userPhoto.src = user.photoURL;
        userName.textContent = user.displayName;
        listenForGroups();
    }

    function showLogin() {
        authContainer.style.display = 'block';
        appContainer.style.display = 'none';
    }

    const joinGroupBtn = document.getElementById('join-group-btn');
    const groupCodeInput = document.getElementById('group-code-input');

    joinGroupBtn.addEventListener('click', () => {
        const groupCode = groupCodeInput.value.trim();
        if (groupCode) {
            joinOrCreateGroup(groupCode);
        }
    });

    let currentGroupCode = null;

    async function joinOrCreateGroup(groupCode) {
        const user = auth.currentUser;
        if (!user) return;

        currentGroupCode = groupCode;
        const groupRef = db.collection('groups').doc(groupCode);
        const groupDoc = await groupRef.get();

        if (groupDoc.exists) {
            // Group exists, join if not already a member
            const members = groupDoc.data().members;
            if (!members.includes(user.email)) {
                await groupRef.update({
                    members: firebase.firestore.FieldValue.arrayUnion(user.email)
                });
            }
        } else {
            // Group doesn't exist, create it
            await groupRef.set({
                members: [user.email]
            });
        }
        showMainApp();
        initChat(groupCode);
        initNotes(groupCode);
        initReminders(groupCode);
    }

    function showMainApp(groupCode) {
        groupContainer.style.display = 'none';
        mainApp.style.display = 'block';
        document.getElementById('group-name').textContent = groupCode;
    }

    function listenForGroups() {
        const user = auth.currentUser;
        if (!user) return;

        db.collection('groups').where('members', 'array-contains', user.email)
            .onSnapshot(snapshot => {
                const groupList = document.getElementById('group-list');
                const noGroupsMsg = document.getElementById('no-groups-msg');
                groupList.innerHTML = '';
                if (snapshot.empty) {
                    noGroupsMsg.style.display = 'block';
                } else {
                    noGroupsMsg.style.display = 'none';
                    snapshot.forEach(doc => {
                        const group = doc.data();
                        const groupEl = document.createElement('div');
                        groupEl.classList.add('group-item');
                        groupEl.textContent = doc.id;
                        groupEl.onclick = () => {
                            joinOrCreateGroup(doc.id);
                        };
                        groupList.appendChild(groupEl);
                    });
                }
            });
    }

    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.getAttribute('data-tab');

            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            tabPanes.forEach(pane => {
                if (pane.id === `${tab}-tab`) {
                    pane.classList.add('active');
                } else {
                    pane.classList.remove('active');
                }
            });
        });
    });
});
