// Sample Data - Government Civic Portal
const appData = {
    issues: [
        // Your existing issues array remains unchanged
    ],
    tenders: [
        // Your existing tenders array remains unchanged
    ],
    companies: [
        // Your existing companies array remains unchanged
    ],
    news: [
        // Your existing news array remains unchanged
    ],
    departments: [
        // Your existing departments array remains unchanged
    ]
};

// Global state
let currentUserRole = 'Citizen';
let filteredIssues = [...appData.issues];

// Make functions global for onclick handlers
window.showSection = showSection;
window.toggleUserRole = toggleUserRole;
window.selectIssueType = selectIssueType;
window.showIssueDetails = showIssueDetails;
window.updateIssueStatus = updateIssueStatus;
window.participateInTender = participateInTender;
window.closeModal = closeModal;
window.closeNotification = closeNotification;

// Fetch all complaints from backend API
async function fetchComplaints() {
    try {
        const res = await fetch('/api/complaints');
        if (res.ok) {
            const complaints = await res.json();
            appData.issues = complaints;
            filteredIssues = [...appData.issues];
            loadIssuesData();
            renderDashboard();
            renderAdminTable();
            return complaints;
        } else {
            console.error('Failed to fetch complaints:', res.statusText);
            return [];
        }
    } catch (error) {
        console.error('Error fetching complaints:', error);
        return [];
    }
}

// Update a complaint (add budget, tender, status, etc.) via backend API
async function updateComplaint(id, data) {
    try {
        const res = await fetch(`/api/complaints/${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            // Refresh complaints after update
            await fetchComplaints();
            return true;
        } else {
            console.error('Failed to update complaint:', res.statusText);
            return false;
        }
    } catch (error) {
        console.error('Error updating complaint:', error);
        return false;
    }
}

// Override your existing updateIssueStatus function to call updateComplaint API
function updateIssueStatus(issueId, newStatus) {
    if (currentUserRole === 'Citizen') {
        showNotification('Access denied. Admin privileges required.', 'error');
        return;
    }
    updateComplaint(issueId, { status: newStatus, updatedDate: new Date().toISOString().split('T')[0] })
        .then(success => {
            if (success) {
                showNotification(`Issue ${issueId} status updated to: ${newStatus}`, 'success');
                closeModal();
            } else {
                showNotification('Failed to update issue status.', 'error');
            }
        });
}

// You can call fetchComplaints() when the admin panel loads or the page refreshes to display latest data
document.addEventListener('DOMContentLoaded', () => {
    fetchComplaints();
    initializeApp();
});

// Keep rest of your existing functions (showSection, toggleUserRole, loadIssuesData, etc.) unchanged

// Example function for updating budget/tender info for an issue (admin only)
async function assignBudgetAndTender(issueId, budget, tender) {
    if (currentUserRole !== 'Citizen') {
        const updateData = { budget, tender };
        const success = await updateComplaint(issueId, updateData);
        if (success) {
            showNotification(`Budget and tender info updated for ${issueId}`, 'success');
        } else {
            showNotification('Failed to update budget and tender info.', 'error');
        }
    } else {
        showNotification('Access denied. Admin privileges required.', 'error');
    }
}
