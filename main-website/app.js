// app.js

// Tab navigation logic
document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', function () {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');

        const selectedTab = this.getAttribute('data-tab');
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            if (content.id === selectedTab) {
                content.classList.add('active');
            }
        });

        if (selectedTab === 'dashboard') {
            loadDashboardData();
        } else if (selectedTab === 'admin') {
            loadAdminIssuesTable();
        }
    });
});

// Load Dashboard Data including recent issues and department status
function loadDashboardData() {
    loadRecentIssues();
    loadDepartmentStatus();
}

// Example: Load recent issues dynamically (replace with real data or API)
function loadRecentIssues() {
    const recentIssuesContainer = document.getElementById('recentIssues');
    if (!recentIssuesContainer) return;

    // Placeholder: You can replace this with API fetched data
    recentIssuesContainer.innerHTML = `
        <p>No recent issues to show.</p>
    `;
}

// Example: Load department status dynamically (replace with real data or API)
function loadDepartmentStatus() {
    const deptStatusContainer = document.getElementById('departmentStatus');
    if (!deptStatusContainer) return;

    // Placeholder: You can replace this with API fetched data
    deptStatusContainer.innerHTML = `
        <p>No department data available.</p>
    `;
}

// Modal controls
const issueModal = document.getElementById('issueModal');
const closeModalButtons = [document.getElementById('closeModal'), document.getElementById('closeModalBtn')];
closeModalButtons.forEach(btn => {
    if (btn) {
        btn.addEventListener('click', () => closeModal());
    }
});
function closeModal() {
    issueModal.classList.add('hidden');
}

// Toast notifications container
const toastContainer = document.getElementById('toastContainer');
function showToast(message, type = 'info') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3500);
}

// Your requested functions to fetch and display approved complaints via backend API:

async function getApprovedComplaints() {
    try {
        const response = await fetch('/api/complaints?status=approved');
        if (!response.ok) throw new Error('Failed to fetch approved complaints');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching approved complaints:', error);
        showToast('Failed to load approved complaints', 'error');
        return [];
    }
}
async function displayComplaints() {
    const complaints = await getApprovedComplaints();
    const container = document.getElementById('complaints-container');
    if (!container) return;

    container.innerHTML = '';
    if (complaints.length === 0) {
        container.innerHTML = '<p>No approved complaints found.</p>';
        return;
    }

    complaints.forEach(comp => {
        const div = document.createElement('div');
        div.className = 'complaint-item';
        div.innerHTML = `
            <strong>${comp.title || comp.type || comp.id}</strong>: ${comp.description || 'No description'}
        `;
        container.appendChild(div);
    });
}

// Automatically display approved complaints after DOM content loads
window.addEventListener('DOMContentLoaded', () => {
    displayComplaints();
    loadDashboardData();
});

// Additional features like form submission, admin panels, charts, map interactions etc.
// would be implemented here as per your full application needs.

// Example: Attach form submit event if you have a report form with id #reportForm
const reportForm = document.getElementById('reportForm');
if (reportForm) {
    reportForm.addEventListener('submit', e => {
        e.preventDefault();
        // Implement form submission logic here
        showToast('Report submitted (functionality not implemented here)', 'success');
        // Optionally reset form
        reportForm.reset();
    });
}
