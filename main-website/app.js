// Base API endpoint
const API_BASE = '/api/complaints';

// Global app state
const appState = {
  complaints: [],
  currentUser: { name: 'Anonymous', reports: [] },
  activeTab: 'dashboard',
  selectedIssueId: null,
};

// Toast notification system
function showToast(message, type = 'success', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fadeout');
    toast.addEventListener('transitionend', () => toast.remove());
  }, duration);
}

// Close modal
function closeModal() {
  const modal = document.getElementById('issueModal');
  if (modal) modal.classList.add('hidden');
  appState.selectedIssueId = null;
}

// Open modal with given content and title
function openModal(title, bodyHTML) {
  const modal = document.getElementById('issueModal');
  if (!modal) return;
  modal.querySelector('#modalTitle').textContent = title;
  modal.querySelector('#modalBody').innerHTML = bodyHTML;
  modal.classList.remove('hidden');
}

// Fetch complaints from API
async function fetchComplaints() {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    appState.complaints = data;
    renderDashboard();
    renderRecentIssues();
    renderAdminTable();
  } catch (err) {
    showToast('Failed to load complaints: ' + err.message, 'error');
  }
}

// Submit new complaint
async function submitComplaint(complaint) {
  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(complaint),
    });
    return res.ok;
  } catch (err) {
    console.error('Error submitting complaint:', err);
    return false;
  }
}

// Handle form submission for reporting issue
async function handleComplaintSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const title = form.querySelector('#issueTitle').value.trim();
  const category = form.querySelector('#issueCategory').value;
  const priority = form.querySelector('#issuePriority').value;
  const description = form.querySelector('#issueDescription').value.trim();
  const location = form.querySelector('#issueLocation').value.trim();

  if (!title || !category || !priority || !location) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  const complaint = {
    title,
    category,
    priority,
    description,
    location,
    reportedBy: appState.currentUser.name || 'Anonymous',
    status: 'New',
    dateReported: new Date().toISOString(),
  };

  const success = await submitComplaint(complaint);
  if (success) {
    showToast('Complaint submitted successfully!', 'success');
    form.reset();
    fetchComplaints();
    switchTab('dashboard');
  } else {
    showToast('Failed to submit complaint. Please try again.', 'error');
  }
}

// Render dashboard KPIs and statistics
function renderDashboard() {
  const totalReportsElem = document.getElementById('totalReports');
  const resolvedIssuesElem = document.getElementById('resolvedIssues');
  const avgResolutionElem = document.getElementById('avgResolutionTime');
  const satisfactionElem = document.getElementById('satisfaction');

  const complaints = appState.complaints;

  if (!complaints.length) {
    totalReportsElem.textContent = 0;
    resolvedIssuesElem.textContent = 0;
    avgResolutionElem.textContent = '-';
    satisfactionElem.textContent = '-';
    return;
  }

  totalReportsElem.textContent = complaints.length.toLocaleString();

  // Sample logic: count resolved issues
  const resolvedCount = complaints.filter(c => c.status && ['Resolved', 'Closed'].includes(c.status)).length;
  resolvedIssuesElem.textContent = resolvedCount.toLocaleString();

  // Compute average resolution days (dummy calculation)
  let totalDays = 0;
  let resolvedWithDates = 0;
  complaints.forEach(c => {
    if (c.status && ['Resolved', 'Closed'].includes(c.status) && c.dateReported && c.dateResolved) {
      let start = new Date(c.dateReported);
      let end = new Date(c.dateResolved);
      if (!isNaN(start) && !isNaN(end)) {
        totalDays += (end - start) / (1000 * 60 * 60 * 24);
        resolvedWithDates++;
      }
    }
  });
  avgResolutionElem.textContent = resolvedWithDates ? (totalDays / resolvedWithDates).toFixed(1) : '-';

  // Placeholder for satisfaction rating (you can update logic as needed)
  satisfactionElem.textContent = '4.2';
}

// Render recent issues on dashboard
function renderRecentIssues() {
  const container = document.getElementById('recentIssues');
  if (!container) return;

  container.innerHTML = '';

  // Sort by date descending and take up to 5 recent
  const recent = [...appState.complaints]
    .sort((a, b) => new Date(b.dateReported) - new Date(a.dateReported))
    .slice(0, 5);

  if (!recent.length) {
    container.textContent = 'No recent issues reported.';
    return;
  }

  recent.forEach(issue => {
    const div = document.createElement('div');
    div.className = 'issue-item';
    div.innerHTML = `
      <h4>${issue.title}</h4>
      <p><b>Status:</b> ${issue.status || 'New'} | <b>Category:</b> ${issue.category}</p>
      <button class="btn btn--small" onclick="showIssueDetails('${issue.id}')">View Details</button>
    `;
    container.appendChild(div);
  });
}

// Render admin issues table
function renderAdminTable() {
  const tbody = document.getElementById('adminIssuesTable');
  if (!tbody) return;

  tbody.innerHTML = '';

  appState.complaints.forEach(issue => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td><input type="checkbox" class="select-issue" data-id="${issue.id}"></td>
      <td>${issue.id || '-'}</td>
      <td>${issue.title || '-'}</td>
      <td>${issue.category || '-'}</td>
      <td>${issue.priority || '-'}</td>
      <td>${issue.status || 'New'}</td>
      <td>${issue.assignedTo || '-'}</td>
      <td>${issue.dateReported ? new Date(issue.dateReported).toLocaleDateString() : '-'}</td>
      <td>
        <button class="btn btn--small" onclick="showIssueDetails('${issue.id}')">Details</button>
        <button class="btn btn--small btn--primary" onclick="openUpdateStatusModal('${issue.id}')">Update</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// Show detailed issue info in modal
function showIssueDetails(issueId) {
  const issue = appState.complaints.find(c => c.id === issueId);
  if (!issue) {
    showToast('Issue not found', 'error');
    return;
  }

  const bodyHtml = `
    <p><strong>Title:</strong> ${issue.title}</p>
    <p><strong>Category:</strong> ${issue.category}</p>
    <p><strong>Priority:</strong> ${issue.priority}</p>
    <p><strong>Status:</strong> ${issue.status || 'New'}</p>
    <p><strong>Location:</strong> ${issue.location}</p>
    <p><strong>Reported By:</strong> ${issue.reportedBy || 'Anonymous'}</p>
    <p><strong>Description:</strong><br>${issue.description || '-'}</p>
  `;
  openModal(`Issue Details (ID: ${issue.id || 'N/A'})`, bodyHtml);

  appState.selectedIssueId = issueId;
}

// Open modal to update status
function openUpdateStatusModal(issueId) {
  const issue = appState.complaints.find(c => c.id === issueId);
  if (!issue) {
    showToast('Issue not found', 'error');
    return;
  }

  const options = ['New', 'Assigned', 'In Progress', 'Resolved', 'Closed']
    .map(status => `<option value="${status}" ${issue.status === status ? 'selected' : ''}>${status}</option>`)
    .join('');

  const bodyHtml = `
    <label for="updateStatusSelect">Select New Status:</label>
    <select id="updateStatusSelect" class="form-control">
      ${options}
    </select>
  `;

  openModal(`Update Status for Issue ID: ${issueId}`, bodyHtml);

  // Setup update button logic
  const updateBtn = document.getElementById('updateIssueBtn');
  if (updateBtn) {
    updateBtn.onclick = async () => {
      const select = document.getElementById('updateStatusSelect');
      if (!select) return;
      const newStatus = select.value;

      try {
        const res = await fetch(`${API_BASE}/${encodeURIComponent(issueId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) {
          showToast('Status updated successfully', 'success');
          fetchComplaints();
          closeModal();
        } else {
          showToast('Failed to update status', 'error');
        }
      } catch (err) {
        showToast('Error updating status: ' + err.message, 'error');
      }
    };
  }
}

// Switch active tab
function switchTab(tabId) {
  appState.activeTab = tabId;
  document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

  // Activate selected nav button and content
  const activeBtn = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);
  const activeContent = document.getElementById(tabId);
  if (activeBtn) activeBtn.classList.add('active');
  if (activeContent) activeContent.classList.add('active');
}

// Attach event listeners on page load
document.addEventListener('DOMContentLoaded', () => {
  // Initialize tabs
  document.querySelectorAll('.nav-tab').forEach(button => {
    button.addEventListener('click', () => {
      switchTab(button.getAttribute('data-tab'));
    });
  });

  // Setup form submission
  const reportForm = document.getElementById('reportForm');
  if (reportForm) {
    reportForm.addEventListener('submit', handleComplaintSubmit);
  }

  // Close modal controls
  const closeModalEls = [document.getElementById('closeModal'), document.getElementById('closeModalBtn')];
  closeModalEls.forEach(el => {
    if (el) el.addEventListener('click', closeModal);
  });

  // Initially load complaints and default tab
  fetchComplaints();
  switchTab(appState.activeTab);
});
