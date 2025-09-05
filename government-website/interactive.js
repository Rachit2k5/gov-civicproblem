const API_BASE = "/api/complaints";

// Fetch all complaints from backend API
async function fetchComplaints() {
    try {
        const res = await fetch(API_BASE);
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

// Update complaint with given ID and data
async function updateComplaint(id, data) {
    try {
        const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
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

// Override existing updateIssueStatus to use API update
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

// Assign budget and tender info to complaint (admin only)
async function assignBudgetAndTender(issueId, budget, tender) {
    if (currentUserRole === 'Citizen') {
        showNotification('Access denied. Admin privileges required.', 'error');
        return;
    }
    const updateData = { budget, tender };
    const success = await updateComplaint(issueId, updateData);
    if (success) {
        showNotification(`Budget and tender info updated for ${issueId}`, 'success');
    } else {
        showNotification('Failed to update budget and tender info.', 'error');
    }
}

// Initialize app and load complaints on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchComplaints().then(() => {
        initializeApp();
    });
});
