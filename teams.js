// teams.js

// --- IMPORTS ---
// Import shared Firebase services and specific functions
import { auth, db } from './firebase-init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { 
    collection, addDoc, query, where, getDocs, serverTimestamp, 
    doc, getDoc, updateDoc, arrayUnion 
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// --- GLOBAL STATE ---
let currentUser = null;

// --- INITIALIZATION & AUTH ---
// This is the main entry point. It runs when the page loads.
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is authenticated
        currentUser = user;
        await fetchAndDisplayUserData();
        await fetchAndDisplayTeams();
    } else {
        // User is not authenticated, redirect to the login page
        window.location.replace('login.html');
    }
});

// Fetches the user's profile from your 'users' collection in Firestore
async function fetchAndDisplayUserData() {
    const userDocRef = doc(db, "users", currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        document.getElementById('user-name').textContent = userData.name || 'User';
        document.getElementById('menu-user-name').textContent = userData.name || 'User';
        document.getElementById('menu-user-email').textContent = userData.email || '';
    }
}

// Handles the sign-out process
async function handleSignOut() {
    try {
        await signOut(auth);
        showToast('Signed out successfully.', 'success');
        // The onAuthStateChanged listener will automatically redirect to login.html
    } catch (error) {
        console.error("Sign Out Error:", error);
        showToast("Error signing out.", "error");
    }
}

// --- TEAM DATA MANAGEMENT ---

// Fetches and displays all teams the current user is a member of
async function fetchAndDisplayTeams() {
    const teamsList = document.getElementById('teams-list');
    const noTeamsMessage = document.getElementById('no-teams-message');
    
    // Query the 'teams' collection for documents where 'memberUIDs' array contains the user's ID
    const q = query(collection(db, "teams"), where("memberUIDs", "array-contains", currentUser.uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        teamsList.style.display = 'none';
        noTeamsMessage.style.display = 'block';
    } else {
        teamsList.style.display = 'grid';
        noTeamsMessage.style.display = 'none';
        teamsList.innerHTML = querySnapshot.docs.map(doc => renderTeamCard(doc.id, doc.data())).join('');
    }
    updateQuickStats(querySnapshot.docs);
    lucide.createIcons(); // Re-render any new icons
}

// Handles the "Create Team" form submission
async function handleCreateTeam(event) {
    event.preventDefault();
    const btn = document.getElementById('create-team-btn');
    btn.disabled = true;
    btn.querySelector('.btn-loading').classList.remove('hidden');
    btn.querySelector('.btn-text').classList.add('hidden');

    try {
        const newTeamData = {
            name: document.getElementById('team-name').value.trim(),
            description: document.getElementById('team-description').value.trim(),
            hackathon: document.getElementById('hackathon-name').value.trim(),
            teamSize: document.getElementById('team-size').value,
            category: document.getElementById('project-category').value,
            leaderUID: currentUser.uid,
            leaderName: currentUser.displayName,
            memberUIDs: [currentUser.uid], // The creator is the first member
            createdAt: serverTimestamp(),
            status: 'active',
            inviteCode: `HM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
        };

        const docRef = await addDoc(collection(db, "teams"), newTeamData);
        
        showToast(`Team "${newTeamData.name}" created!`, 'success');
        hideCreateTeamForm();
        await fetchAndDisplayTeams();

        setTimeout(() => window.location.href = `dashboard.html?team=${docRef.id}`, 1500);

    } catch (error) {
        console.error("Error creating team:", error);
        showToast("Failed to create team. Please try again.", "error");
    } finally {
        btn.disabled = false;
        btn.querySelector('.btn-loading').classList.add('hidden');
        btn.querySelector('.btn-text').classList.remove('hidden');
    }
}

// Handles the "Join Team" form submission
async function handleJoinTeam(event) {
    event.preventDefault();
    const inviteCode = document.getElementById('invite-code').value.trim();
    const btn = document.getElementById('join-team-btn');
    btn.disabled = true;
    btn.querySelector('.btn-loading').classList.remove('hidden');
    btn.querySelector('.btn-text').classList.add('hidden');

    try {
        const q = query(collection(db, "teams"), where("inviteCode", "==", inviteCode));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return showToast("Invalid invite code. Team not found.", "error");
        }

        const teamDoc = querySnapshot.docs[0];
        const teamData = teamDoc.data();

        if (teamData.memberUIDs.includes(currentUser.uid)) {
            return showToast("You are already a member of this team.", "info");
        }

        await updateDoc(doc(db, "teams", teamDoc.id), {
            memberUIDs: arrayUnion(currentUser.uid)
        });

        showToast(`Successfully joined "${teamData.name}"!`, 'success');
        hideJoinTeamForm();
        await fetchAndDisplayTeams();

    } catch (error) {
        console.error("Error joining team:", error);
        showToast("Failed to join team. Please try again.", "error");
    } finally {
        btn.disabled = false;
        btn.querySelector('.btn-loading').classList.add('hidden');
        btn.querySelector('.btn-text').classList.remove('hidden');
    }
}

// --- UI RENDERING ---
function renderTeamCard(id, team) {
    const memberCount = team.memberUIDs?.length || 1;
    const isLeader = team.leaderUID === currentUser.uid;
    
    return `
        <div class="card team-card" style="padding: 1.5rem; cursor: pointer; transition: all 0.2s ease;" onclick="openTeamDashboard('${id}')">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem;">
                        <h3 style="font-size: 1.25rem; font-weight: 600; margin: 0; color: var(--foreground);">${team.name}</h3>
                        ${isLeader ? '<span class="badge" style="background: var(--primary); color: var(--primary-foreground); font-size: 0.75rem;">Leader</span>' : ''}
                    </div>
                    <p style="color: var(--muted-foreground); margin-bottom: 1rem; line-height: 1.4;">${team.description || 'No description provided'}</p>
                    <div style="display: flex; align-items: center; gap: 1.5rem; font-size: 0.875rem; color: var(--muted-foreground);">
                        <span style="display: flex; align-items: center; gap: 0.25rem;"><i data-lucide="calendar" style="width: 1rem; height: 1rem;"></i> ${team.hackathon}</span>
                        <span style="display: flex; align-items: center; gap: 0.25rem;"><i data-lucide="users" style="width: 1rem; height: 1rem;"></i> ${memberCount} member${memberCount !== 1 ? 's' : ''}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function updateQuickStats(teamDocs) {
    document.getElementById('total-teams').textContent = teamDocs.length;
    document.getElementById('active-projects').textContent = teamDocs.filter(doc => doc.data().status === 'active').length;
    document.getElementById('team-members').textContent = teamDocs.reduce((sum, doc) => sum + (doc.data().memberUIDs?.length || 0), 0);
}


// --- UI HELPERS & EVENT LISTENERS ---
function showUserMenu() { const menu = document.getElementById('user-menu'); menu.style.display = menu.style.display === 'none' ? 'block' : 'none'; }
function showCreateTeamForm() { document.getElementById('create-team-modal').style.display = 'block'; }
function hideCreateTeamForm() { document.getElementById('create-team-modal').style.display = 'none'; document.getElementById('create-team-form').reset(); }
function showJoinTeamForm() { document.getElementById('join-team-modal').style.display = 'block'; }
function hideJoinTeamForm() { document.getElementById('join-team-modal').style.display = 'none'; document.getElementById('join-team-form').reset(); }
function showToast(message, type = 'info') { 
    // This is a placeholder for your actual toast notification function
    console.log(`Toast (${type}): ${message}`);
    alert(message); 
}
function openTeamDashboard(teamId) { window.location.href = `dashboard.html?team=${teamId}`; }

// Attach functions to the window object so your inline onclick attributes can access them
window.showUserMenu = showUserMenu;
window.logout = handleSignOut;
window.showCreateTeamForm = showCreateTeamForm;
window.hideCreateTeamForm = hideCreateTeamForm;
window.showJoinTeamForm = showJoinTeamForm;
window.hideJoinTeamForm = hideJoinTeamForm;
window.refreshTeams = fetchAndDisplayTeams;
window.openTeamDashboard = openTeamDashboard;

// Attach form submission event listeners
document.getElementById('create-team-form').addEventListener('submit', handleCreateTeam);
document.getElementById('join-team-form').addEventListener('submit', handleJoinTeam);

// Close dropdowns/modals when clicking outside of them
document.addEventListener('click', function(e) {
    const userMenu = document.getElementById('user-menu');
    if (userMenu && !userMenu.contains(e.target) && !e.target.closest('[onclick="showUserMenu()"]')) {
        userMenu.style.display = 'none';
    }
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// Initialize icons on first load
lucide.createIcons();