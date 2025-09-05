// Application Data
const appData = {
  sampleIssues: [
    // Your existing issues data here...
  ],
  departments: [
    // Your existing departments data here...
  ],
  analytics: {
    // Your existing analytics data here...
  }
};

// Application state
let currentUser = { name: 'Citizen User', reports: [] };
let heatmapVisible = false;
let selectedIssues = [];
let chartsInitialized = false;

// Utility functions
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function generateId() {
  return 'ISS-' + String(Date.now());
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<div>${message}</div>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 5000);
}

// Tab navigation
function initTabNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const target = tab.dataset.tab;

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      contents.forEach(c => c.classList.remove('active'));

      const targetContent = document.getElementById(target);
      if (targetContent) {
        targetContent.classList.add('active');

        if (target === 'map') renderMap();
        else if (target === 'analytics' && !chartsInitialized) {
          setTimeout(renderCharts, 100);
          chartsInitialized = true;
        }
        else if (target === 'admin') renderAdminTable();
      }
    });
  });
}

// Dashboard rendering functions
function renderDashboard() {
  renderRecentIssues();
  renderDepartmentStatus();
}

function renderRecentIssues() {
  const container = document.getElementById('recentIssues');
  if (!container) return;

  const recentIssues = appData.sampleIssues.slice(0, 5);
  container.innerHTML = recentIssues.map(issue => `
    <div class="issue-item" onclick="showDetails('${issue.id}')">
      <div class="issue-header">
        <div>
          <div class="issue-title">${issue.title}</div>
          <div class="issue-meta">
            <span>${issue.category}</span>
            <span>${formatDate(issue.reportedDate)}</span>
            <span>${issue.location.address}</span>
          </div>
        </div>
        <div class="status-badge ${issue.status.toLowerCase().replace(' ', '-')}">${issue.status}</div>
      </div>
    </div>
  `).join("");
}

function renderDepartmentStatus() {
  const container = document.getElementById('departmentStatus');
  if (!container) return;

  container.innerHTML = appData.departments.map(dept => `
    <div class="department-card">
      <div class="department-name">${dept.name}</div>
      <div class="department-stats">
        <div class="stat-item">
          <div class="stat-value">${dept.activeIssues}</div>
          <div class="stat-label">Active Issues</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${dept.avgResponseTime}</div>
          <div class="stat-label">Avg Response</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${dept.resolutionRate}</div>
          <div class="stat-label">Resolution Rate</div>
        </div>
      </div>
    </div>
  `).join("");
}

// Async submit complaint to backend
async function submitComplaint(complaint) {
  try {
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(complaint)
    });
    return res.ok;
  } catch (e) {
    console.error(e);
    return false;
  }
}

// Event listener for complaint submission
function handleComplaintSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('issueTitle').value.trim();
  const category = document.getElementById('issueCategory').value;
  const priority = document.getElementById('issuePriority').value;
  const description = document.getElementById('issueDescription').value.trim();
  const location = document.getElementById('issueLocation').value.trim();

  if (!title || !category || !priority || !location) {
    showToast("Please fill in all required fields", "error");
    return;
  }

  const complaint = {
    title,
    category,
    priority,
    description,
    location,
    reportedBy: currentUser.name
  };

  submitComplaint(complaint).then(success => {
    if (success) {
      e.target.reset();
      showToast("Complaint submitted successfully!", "success");
      // Optionally refresh your data here by fetching latest complaints
    } else {
      showToast("Failed to submit complaint, please try again.", "error");
    }
  });
}

// Initialize form events
function initFormEvents() {
  const form = document.getElementById('reportForm');
  if (form) {
    form.removeEventListener('submit', handleComplaintSubmit);
    form.addEventListener('submit', handleComplaintSubmit);
  }

  const locBtn = document.getElementById('useCurrentLocation');
  if (locBtn) {
    locBtn.addEventListener('click', () => {
      const locInput = document.getElementById('issueLocation');
      if (locInput) {
        locInput.value = "Current location detected (simulated)";
        showToast("Location captured!", "success");
      }
    });
  }

  const voiceBtn = document.getElementById('voiceNoteBtn');
  if (voiceBtn) {
    voiceBtn.addEventListener('click', () => {
      const status = document.getElementById('voiceStatus');
      if (status) {
        status.textContent = "Recording voice note (simulated)...";
        setTimeout(() => {
          status.textContent = "Voice note recorded.";
          showToast("Voice note recorded.", "success");
        }, 3000);
      }
    });
  }
}

// Call initialization on page load
document.addEventListener("DOMContentLoaded", () => {
  currentUser = { name: "Citizen User", reports: [] };

  initTabNavigation();
  renderDashboard();
  initFormEvents();

  // ... initialize other things as needed

  showToast("Welcome! Ready to submit complaints.");
});

// Expose globally needed functions
window.showDetails = function(id) {
  /* implementation to show detail modal */
};
window.assignIssue = function(id) {
  /* implementation to assign issue */
};
window.updateStatus = function(id) {
  /* implementation to update status */
};
