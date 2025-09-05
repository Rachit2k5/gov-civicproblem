// Your existing app.js content including app data, utilities, renderers, etc., remain as is.

// Add this constant to use consistent API base URL
const API_BASE = '/api/complaints';

// New async function to submit a complaint to backend API
async function submitComplaint(complaint) {
  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(complaint)
    });
    return res.ok;
  } catch (error) {
    console.error('Error submitting complaint:', error);
    return false;
  }
}

// Update the form submit handler to use submitComplaint
function handleComplaintSubmit(event) {
  event.preventDefault();

  const title = document.getElementById('issueTitle').value.trim();
  const category = document.getElementById('issueCategory').value;
  const priority = document.getElementById('issuePriority').value;
  const description = document.getElementById('issueDescription').value.trim();
  const location = document.getElementById('issueLocation').value.trim();

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
    reportedBy: (typeof currentUser !== 'undefined') ? currentUser.name : 'Anonymous'
  };

  submitComplaint(complaint).then(success => {
    if (success) {
      event.target.reset();
      showToast('Complaint submitted successfully!', 'success');
      // Optionally reload or refresh complaints data here
    } else {
      showToast('Failed to submit complaint. Please try again.', 'error');
    }
  });
}

// Initialize form events to attach the submit handler and others
function initFormEvents() {
  const form = document.getElementById('reportForm');
  if (form) {
    form.removeEventListener('submit', handleComplaintSubmit);
    form.addEventListener('submit', handleComplaintSubmit);
  }

  const locButton = document.getElementById('useCurrentLocation');
  if (locButton) {
    locButton.addEventListener('click', () => {
      const locInput = document.getElementById('issueLocation');
      if (locInput) {
        locInput.value = "Current location (simulated)";
        showToast('Location captured', 'success');
      }
    });
  }

  const voiceButton = document.getElementById('voiceNoteBtn');
  if (voiceButton) {
    voiceButton.addEventListener('click', () => {
      const statusElem = document.getElementById('voiceStatus');
      if (statusElem) {
        statusElem.textContent = 'Recording...';
        setTimeout(() => {
          statusElem.textContent = 'Voice note recorded (simulated)';
          showToast('Voice note recorded', 'success');
        }, 3000);
      }
    });
  }
}

// On DOM content loaded, initialize the app and bind events
document.addEventListener('DOMContentLoaded', () => {
  if (typeof currentUser === 'undefined') {
    currentUser = { name: 'Anonymous', reports: [] };
  }

  initFormEvents();
  // Call other init functions like initTabNavigation(), renderDashboard(), etc.
  initTabNavigation();
  renderDashboard();
  showToast('Application ready!');
});

// Expose globally used functions to window scope
window.showDetails = function (id) { /* your existing implementation */ };
window.assign = function (id) { /* your existing implementation */ };
window.updateStatus = function (id) { /* your existing implementation */ };
