// Your existing appData and all functions as before remain unchanged ...

// Approve Complaint API Call - Added globally
async function approveComplaint(id) {
    try {
        const response = await fetch(`/api/complaints/${id}/approve`, {
            method: 'PUT',
        });
        const result = await response.json();
        // Update local state when approved
        const issueIndex = appData.issues.findIndex(i => i.id === id);
        if (issueIndex !== -1) {
            appData.issues[issueIndex].status = 'Approved';
            appData.issues[issueIndex].updatedDate = new Date().toISOString().split('T')[0];
            // Also update filteredIssues array
            const filteredIndex = filteredIssues.findIndex(i => i.id === id);
            if (filteredIndex !== -1) {
                filteredIssues[filteredIndex].status = 'Approved';
                filteredIssues[filteredIndex].updatedDate = new Date().toISOString().split('T')[0];
            }
            loadIssuesData();
            showNotification(`Issue ${id} approved successfully`, 'success');
            closeModal();
        }
        return result;
    } catch (err) {
        showNotification(`Error approving issue: ${err.message}`, 'error');
        console.error(err);
    }
}

// Modified showIssueDetails to call approveComplaint instead of updateIssueStatus("Approved")
function showIssueDetails(issueId) {
    console.log('Showing issue details for:', issueId);
    const issue = appData.issues.find(i => i.id === issueId);
    if (!issue) return;

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="issue-details">
            <div class="detail-row" style="margin-bottom: 12px;">
                <strong>Issue ID:</strong> ${issue.id}
            </div>
            <div class="detail-row" style="margin-bottom: 12px;">
                <strong>Type:</strong> ${issue.type}
            </div>
            <div class="detail-row" style="margin-bottom: 12px;">
                <strong>Location:</strong> ${issue.location}
            </div>
            <div class="detail-row" style="margin-bottom: 12px;">
                <strong>Description:</strong> ${issue.description}
            </div>
            <div class="detail-row" style="margin-bottom: 12px;">
                <strong>Priority:</strong> <span class="issue-priority ${issue.priority.toLowerCase()}">${issue.priority}</span>
            </div>
            <div class="detail-row" style="margin-bottom: 12px;">
                <strong>Status:</strong> <span class="status status--${issue.status.toLowerCase().replace(' ', '-')}">${issue.status}</span>
            </div>
            <div class="detail-row" style="margin-bottom: 12px;">
                <strong>Submitted Date:</strong> ${formatDate(issue.submittedDate)}
            </div>
            <div class="detail-row" style="margin-bottom: 12px;">
                <strong>Last Updated:</strong> ${formatDate(issue.updatedDate)}
            </div>
            <div class="detail-row" style="margin-bottom: 12px;">
                <strong>Assigned To:</strong> ${issue.assignedTo}
            </div>
            <div class="detail-row" style="margin-bottom: 12px;">
                <strong>Estimated Resolution:</strong> ${formatDate(issue.estimatedResolution)}
            </div>
            <div class="detail-row" style="margin-bottom: 12px;">
                <strong>Contact Person:</strong> ${issue.contactPerson}
            </div>
            <div class="detail-row" style="margin-bottom: 12px;">
                <strong>Contact Number:</strong> ${issue.contactNumber}
            </div>
            ${currentUserRole !== 'Citizen' ? `
                <div class="admin-actions" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--color-border);">
                    <h4>Admin Actions</h4>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button class="btn btn--primary btn--sm" onclick="updateIssueStatus('${issue.id}', 'Under Review')">Mark Under Review</button>
                        <button class="btn btn--primary btn--sm" onclick="approveComplaint('${issue.id}')">Approve</button>
                        <button class="btn btn--primary btn--sm" onclick="updateIssueStatus('${issue.id}', 'In Progress')">Mark In Progress</button>
                        <button class="btn btn--primary btn--sm" onclick="updateIssueStatus('${issue.id}', 'Resolved')">Mark Resolved</button>
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    document.getElementById('modalTitle').textContent = `Issue Details - ${issue.type}`;
    document.getElementById('issueModal').classList.remove('hidden');
}

// The rest of your existing functions/code are unchanged and remain after this section.
