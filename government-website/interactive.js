const API_BASE = "/api/complaints";

const appData = {
    issues: [],
    filteredIssues: [],
};

let currentUserRole = 'Citizen'; // Default role

// Utility: Show notification
function showNotification(message, type = 'success') {
    const notif = document.getElementById('notification');
    const notifText = document.getElementById('notificationText');
    notifText.textContent = message;
    notif.className = 'notification ' + type;
    notif.classList.remove('hidden');
}

// Utility: Hide notification
function closeNotification() {
    document.getElementById('notification').classList.add('hidden');
}

// Toggle user role between Admin and Citizen
function toggleUserRole() {
    currentUserRole = currentUserRole === 'Citizen' ? 'Admin' : 'Citizen';
    document.getElementById('currentRole').textContent = currentUserRole;
    // Optional: update admin-visible UI here
    fetchComplaints();
}

// Section navigation logic
function showSection(sectionId) {
    document.querySelectorAll('.main-content .section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    if (sectionId === 'track') loadIssuesData(); // Refresh issues grid on view
}

// Modal logic
function openModal(html, title = 'Issue Details') {
    document.getElementById('modalBody').innerHTML = html;
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('issueModal').classList.remove('hidden');
}
function closeModal() {
    document.getElementById('issueModal').classList.add('hidden');
}

// Fetch all complaints
async function fetchComplaints() {
    try {
        const res = await fetch(API_BASE);
        if (res.ok) {
            const complaints = await res.json();
            appData.issues = complaints;
            appData.filteredIssues = [...complaints];
            loadIssuesData();
            renderDashboard();
            renderAdminTable();
            return complaints;
        } else {
            showNotification('Failed to fetch complaints: ' + res.statusText, 'error');
            return [];
        }
    } catch (error) {
        showNotification('Error fetching complaints: ' + error, 'error');
        return [];
    }
}

// Update a complaint
async function updateComplaint(id, data) {
    try {
        const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        if (res.ok) {
            await fetchComplaints();
            return true;
        } else {
            showNotification('Failed to update complaint: ' + res.statusText, 'error');
            return false;
        }
    } catch (error) {
        showNotification('Error updating complaint: ' + error, 'error');
        return false;
    }
}

// For admin: Update status
function updateIssueStatus(issueId, newStatus) {
    if (currentUserRole === 'Citizen') {
        showNotification('Access denied. Admin privileges required.', 'error');
        return;
    }
    updateComplaint(issueId, { status: newStatus, updatedDate: new Date().toISOString().split('T')[0] })
        .then(success => {
            if (success) {
                showNotification(`Issue ${issueId} status updated to: ${newStatus}`);
                closeModal();
            }
        });
}

// For admin: Assign budget/tender
async function assignBudgetAndTender(issueId, budget, tender) {
    if (currentUserRole === 'Citizen') {
        showNotification('Access denied. Admin privileges required.', 'error');
        return;
    }
    const updateData = { budget, tender };
    const success = await updateComplaint(issueId, updateData);
    if (success) {
        showNotification(`Budget and tender info updated for ${issueId}`);
    }
}


// -------- Section Renderers --------

// Populate issues in tracking grid
function loadIssuesData() {
    const grid = document.getElementById('issuesContainer');
    if (!grid) return;
    grid.innerHTML = '';
    appData.filteredIssues.forEach(issue => {
        const card = document.createElement('div');
        card.className = 'issue-card';
        card.innerHTML = `
            <h4>${issue.type} - ${issue.location}</h4>
            <p><b>Status:</b> ${issue.status}</p>
            <p><b>Priority:</b> ${issue.priority}</p>
            <button class="btn btn--small" onclick="viewIssueDetails('${issue.id}')">Details</button>
            ` + (currentUserRole === 'Admin' ? `<button class="btn btn--small btn--primary" onclick="updateIssueStatusPrompt('${issue.id}')">Update Status</button>` : '');
        grid.appendChild(card);
    });
}

// Render dashboard home (optional summary, fill as desired)
function renderDashboard() {
    // Populate home/summary stats or leave blank if not required.
}

// Render admin table for advanced management (call as needed or fill with desired content)
function renderAdminTable() {
    // Optionally implement advanced admin view.
}

// Search, filter for tracking
function filterIssues() {
    const search = document.getElementById('trackingSearch').value.trim().toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    appData.filteredIssues = appData.issues.filter(issue => {
        return (!search || [issue.id, issue.location, issue.type].some(f => (f||'').toLowerCase().includes(search)))
            && (!statusFilter || issue.status === statusFilter)
            && (!typeFilter || issue.type === typeFilter);
    });
    loadIssuesData();
}

// View issue details in modal
function viewIssueDetails(issueId) {
    const issue = appData.issues.find(i => i.id === issueId);
    if (!issue) return showNotification('Issue not found', 'error');
    openModal(`
        <p><b>ID:</b> ${issue.id}</p>
        <p><b>Type:</b> ${issue.type}</p>
        <p><b>Priority:</b> ${issue.priority}</p>
        <p><b>Location:</b> ${issue.location}</p>
        <p><b>Description:</b> ${issue.description}</p>
        <p><b>Status:</b> ${issue.status}</p>
        ` + (currentUserRole === 'Admin' ? `
            <button class="btn btn--primary" onclick="updateIssueStatusPrompt('${issue.id}')">Update Status</button>
            <button class="btn btn--secondary" onclick="assignBudgetPrompt('${issue.id}')">Assign Budget/Tender</button>
        ` : '')
    );
}

// Prompt admin to update status from modal
function updateIssueStatusPrompt(issueId) {
    openModal(`
        <h4>Update Status</h4>
        <select id="modalStatusSelect" class="form-control">
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
        </select>
        <button class="btn btn--primary" onclick="updateIssueStatus('${issueId}', document.getElementById('modalStatusSelect').value)">Save</button>
    `, 'Update Status');
}

// Prompt admin to assign budget/tender in modal
function assignBudgetPrompt(issueId) {
    openModal(`
        <h4>Assign Budget / Tender</h4>
        <input type="number" id="budgetInput" class="form-control" placeholder="Enter budget">
        <input type="text" id="tenderInput" class="form-control" placeholder="Enter tender details">
        <button class="btn btn--primary" onclick="assignBudgetAndTender('${issueId}', document.getElementById('budgetInput').value, document.getElementById('tenderInput').value)">Assign</button>
    `, 'Assign Budget/Tender');
}

// Category shortcut (home page)
function selectIssueType(type) {
    showSection('report');
    document.getElementById('issueType').value = type;
}

// Handle reporting form submission
document.addEventListener('DOMContentLoaded', () => {
    fetchComplaints().then(() => {
        initializeApp();
    });

    // Search fields in header/track
    document.getElementById('trackingSearch').addEventListener('input', filterIssues);
    document.getElementById('statusFilter').addEventListener('change', filterIssues);
    document.getElementById('typeFilter').addEventListener('change', filterIssues);

    // Role toggle
    document.getElementById('currentRole').textContent = currentUserRole;

    // Issue report form
    document.getElementById('issueReportForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        // Gather form data
        const issue = {
            type: document.getElementById('issueType').value,
            priority: document.getElementById('issuePriority').value,
            location: document.getElementById('issueLocation').value,
            description: document.getElementById('issueDescription').value,
            reporterPhone: document.getElementById('reporterPhone').value,
            status: 'Submitted',
            date: new Date().toISOString().split('T')[0],
        };
        // Send POST to API
        try {
            const res = await fetch(API_BASE, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(issue)
            });
            if (res.ok) {
                showNotification('Issue reported successfully.');
                fetchComplaints();
                e.target.reset();
            } else {
                showNotification('Failed to report issue.', 'error');
            }
        } catch (err) {
            showNotification('Error reporting issue: ' + err, 'error');
        }
    });
});

// Required global for section navigation
window.showSection = showSection;
window.viewIssueDetails = viewIssueDetails;
window.updateIssueStatus = updateIssueStatus;
window.updateIssueStatusPrompt = updateIssueStatusPrompt;
window.assignBudgetAndTender = assignBudgetAndTender;
window.assignBudgetPrompt = assignBudgetPrompt;
window.selectIssueType = selectIssueType;
window.toggleUserRole = toggleUserRole;
window.closeModal = closeModal;
window.showNotification = showNotification;
window.closeNotification = closeNotification;

// Dummy stub: if initializeApp exists elsewhere, it is called after first load.
function initializeApp() {
    // Optional: populate news, departments, companies, etc. as needed.
}
