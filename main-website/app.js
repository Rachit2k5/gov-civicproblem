document.addEventListener("DOMContentLoaded", () => {
  // Data stores (simulate backend)
  const reports = [
    {
      id: 1247,
      title: "Broken streetlight on 5th Ave",
      category: "Infrastructure",
      priority: "High",
      status: "Resolved",
      assignedTo: "John Doe",
      date: "2025-09-01",
      description: "The streetlight near the park is broken and causing darkness at night.",
      location: "5th Avenue and Park St",
      photos: [],
      voiceNote: null,
      department: "Electrical Department",
    },
    // more demo reports can be added here
  ];

  const userReports = [];

  // Cache elements
  const tabs = document.querySelectorAll(".nav-tab");
  const tabContents = document.querySelectorAll(".tab-content");
  const totalReportsEl = document.getElementById("totalReports");
  const resolvedIssuesEl = document.getElementById("resolvedIssues");
  const avgResolutionTimeEl = document.getElementById("avgResolutionTime");
  const satisfactionEl = document.getElementById("satisfaction");
  const recentIssuesEl = document.getElementById("recentIssues");
  const departmentStatusEl = document.getElementById("departmentStatus");
  const reportForm = document.getElementById("reportForm");
  const myReportsEl = document.getElementById("myReports");
  const useCurrentLocationBtn = document.getElementById("useCurrentLocation");
  const photoUploadInput = document.getElementById("photoUpload");
  const voiceNoteBtn = document.getElementById("voiceNoteBtn");
  const voiceStatus = document.getElementById("voiceStatus");
  const mapCategoryFilter = document.getElementById("mapCategoryFilter");
  const mapStatusFilter = document.getElementById("mapStatusFilter");
  const mapMarkersContainer = document.getElementById("mapMarkers");
  const adminDepartmentFilter = document.getElementById("adminDepartmentFilter");
  const adminStatusFilter = document.getElementById("adminStatusFilter");
  const adminPriorityFilter = document.getElementById("adminPriorityFilter");
  const adminIssuesTableBody = document.getElementById("adminIssuesTable");
  const selectAllCheckbox = document.getElementById("selectAll");
  const bulkAssignBtn = document.getElementById("bulkAssignBtn");
  const exportDataBtn = document.getElementById("exportDataBtn");
  const issueModal = document.getElementById("issueModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const closeModalXBtn = document.getElementById("closeModal");
  const updateIssueBtn = document.getElementById("updateIssueBtn");
  const toastContainer = document.getElementById("toastContainer");

  // Helper: Show toast with optional max to avoid stacking
  function showToast(message, type = "info") {
    if (toastContainer.children.length > 5) {
      toastContainer.firstElementChild.remove();
    }
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", type === "error" ? "assertive" : "polite");
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("fade-out");
      toast.addEventListener("transitionend", () => toast.remove());
    }, 3000);
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function generateUniqueId() {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  // Accessibility: update aria-selected on tabs
  function activateTab(selectedTab) {
    tabs.forEach(tab => {
      const isActive = tab === selectedTab;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
      tab.setAttribute("tabindex", isActive ? "0" : "-1");
    });
    tabContents.forEach(tc => tc.classList.remove("active"));
    const target = selectedTab.getAttribute("data-tab");
    document.getElementById(target).classList.add("active");
    return target;
  }

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const target = activateTab(tab);
      if (target === "dashboard") {
        loadDashboard();
      } else if (target === "map") {
        renderMapMarkers();
      } else if (target === "admin") {
        renderAdminTable();
      } else if (target === "analytics") {
        renderAnalyticsCharts();
      }
    });
    // Keyboard support for tabs
    tab.addEventListener("keydown", e => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const index = Array.prototype.indexOf.call(tabs, e.target);
        let nextIndex;
        if (e.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
        else nextIndex = (index - 1 + tabs.length) % tabs.length;
        tabs[nextIndex].focus();
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.target.click();
      }
    });
  });

  // Dashboard load KPI and lists
  function loadDashboard() {
    totalReportsEl.textContent = reports.length.toLocaleString();
    const resolvedCount = reports.filter(r => r.status === "Resolved").length;
    resolvedIssuesEl.textContent = resolvedCount.toLocaleString();
    avgResolutionTimeEl.textContent = (5.5 + Math.random() * 0.6).toFixed(1);
    satisfactionEl.textContent = (4 + Math.random() * 0.4).toFixed(1);

    // Recent issues clickable with keyboard access
    const sorted = reports.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    recentIssuesEl.innerHTML = "";
    sorted.slice(0, 5).forEach(issue => {
      const div = document.createElement("div");
      div.className = "issue-item";
      div.textContent = `${issue.title} (${issue.category}) - ${issue.status}`;
      div.tabIndex = 0;
      div.setAttribute("role", "button");
      div.setAttribute("aria-label", `Open details for ${issue.title}`);
      div.style.cursor = "pointer";
      div.addEventListener("click", () => openIssueModal(issue));
      div.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openIssueModal(issue);
        }
      });
      recentIssuesEl.appendChild(div);
    });

    // Department status cards
    const departmentMap = {};
    reports.forEach(r => {
      const dept = r.department || "Unknown";
      if (!departmentMap[dept]) departmentMap[dept] = { total: 0, resolved: 0 };
      departmentMap[dept].total++;
      if (r.status === "Resolved") departmentMap[dept].resolved++;
    });

    departmentStatusEl.innerHTML = "";
    for (const [dept, stats] of Object.entries(departmentMap)) {
      const div = document.createElement("div");
      div.className = "department-card";
      div.innerHTML = `<h4>${dept}</h4><div>Total: ${stats.total}</div><div>Resolved: ${stats.resolved}</div>`;
      departmentStatusEl.appendChild(div);
    }
  }

  // Report form submit
  reportForm.addEventListener("submit", e => {
    e.preventDefault();
    const title = reportForm.issueTitle.value.trim();
    const category = reportForm.issueCategory.value;
    const priority = reportForm.issuePriority.value;
    const description = reportForm.issueDescription.value.trim();
    const location = reportForm.issueLocation.value.trim();

    if (!title || !category || !priority || !location) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    const newReport = {
      id: generateUniqueId(),
      title,
      category,
      priority,
      description,
      status: "New",
      assignedTo: "",
      date: new Date().toISOString().slice(0, 10),
      location,
      photos: [],
      voiceNote: voiceStatus.dataset.voiceNote || null,
      department: mapCategoryToDepartment(category),
    };

    // Add file names to photos array
    Array.from(photoUploadInput.files).forEach(file => {
      newReport.photos.push(file.name);
    });

    reports.push(newReport);
    userReports.push(newReport);
    showToast("Issue report submitted successfully!", "success");

    reportForm.reset();
    voiceStatus.textContent = "";
    delete voiceStatus.dataset.voiceNote;

    renderMyReports();
  });

  function mapCategoryToDepartment(category) {
    const map = {
      Infrastructure: "Public Works",
      Sanitation: "Sanitation Department",
      Utilities: "Water & Utilities",
      "Public Safety": "Electrical Department",
      Environment: "Parks & Recreation",
    };
    return map[category] || "General";
  }

  // Use current location
  useCurrentLocationBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser", "error");
      return;
    }
    useCurrentLocationBtn.disabled = true;
    useCurrentLocationBtn.textContent = "Fetching location...";
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        reportForm.issueLocation.value = `Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`;
        useCurrentLocationBtn.textContent = "📍 Use Current Location";
        useCurrentLocationBtn.disabled = false;
      },
      error => {
        showToast("Unable to retrieve location: " + error.message, "error");
        useCurrentLocationBtn.textContent = "📍 Use Current Location";
        useCurrentLocationBtn.disabled = false;
      }
    );
  });

  // Voice note toggle
  let recording = false;
  voiceNoteBtn.addEventListener("click", () => {
    if (!recording) {
      recording = true;
      voiceStatus.textContent = "Recording... Click again to stop.";
      voiceNoteBtn.textContent = "⏹ Stop Recording";
      voiceStatus.dataset.voiceNote = "voice_note_demo_data";
    } else {
      recording = false;
      voiceStatus.textContent = "Voice note recorded.";
      voiceNoteBtn.textContent = "🎤 Record Voice Note";
    }
  });

  function renderMyReports() {
    if (userReports.length === 0) {
      myReportsEl.textContent = "No reports submitted yet.";
      return;
    }
    // Use fragment for performance
    const fragment = document.createDocumentFragment();
    [...userReports].reverse().forEach(r => {
      const div = document.createElement("div");
      div.className = "my-report-item";
      div.innerHTML = `<strong>${r.title}</strong> - ${r.status}<br><small>${formatDate(r.date)} at ${r.location}</small>`;
      fragment.appendChild(div);
    });
    myReportsEl.innerHTML = "";
    myReportsEl.appendChild(fragment);
  }

  // Map markers with accessible clickable elements
  function renderMapMarkers() {
    mapMarkersContainer.innerHTML = "";
    const catFilterVal = mapCategoryFilter.value;
    const statFilterVal = mapStatusFilter.value;

    const filteredIssues = reports.filter(r => 
      (catFilterVal === "" || r.category === catFilterVal) &&
      (statFilterVal === "" || r.status === statFilterVal)
    );

    if (filteredIssues.length === 0) {
      mapMarkersContainer.textContent = "No issues to display on map.";
      return;
    }

    filteredIssues.forEach(issue => {
      const marker = document.createElement("div");
      marker.className = `map-marker legend-marker ${issue.category.toLowerCase().replace(/ /g, "")}`;
      marker.title = `${issue.title} - ${issue.status}`;
      marker.tabIndex = 0;
      marker.setAttribute("role", "button");
      marker.style.cssText = `
        margin: 5px; padding: 5px; border-radius: 50%;
        width: 20px; height: 20px; display: inline-block; cursor: pointer;
        background-color: ${categoryColor(issue.category)};
      `;
      marker.addEventListener("click", () => openIssueModal(issue));
      marker.addEventListener("keydown", e => {
        if(e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openIssueModal(issue);
        }
      });
      mapMarkersContainer.appendChild(marker);
    });
  }

  function categoryColor(category) {
    switch (category) {
      case "Infrastructure": return "#007bff";
      case "Sanitation": return "#28a745";
      case "Utilities": return "#ffc107";
      case "Public Safety": return "#dc3545";
      case "Environment": return "#17a2b8";
      default: return "#6c757d";
    }
  }

  mapCategoryFilter.addEventListener("change", renderMapMarkers);
  mapStatusFilter.addEventListener("change", renderMapMarkers);

  // Admin table rendering with event delegation for view buttons
  function renderAdminTable() {
    adminIssuesTableBody.innerHTML = "";
    const deptFilter = adminDepartmentFilter.value;
    const statusFilter = adminStatusFilter.value;
    const priorityFilter = adminPriorityFilter.value;

    const filtered = reports.filter(r =>
      (deptFilter === "" || r.department === deptFilter) &&
      (statusFilter === "" || r.status === statusFilter) &&
      (priorityFilter === "" || r.priority === priorityFilter)
    );

    if (filtered.length === 0) {
      adminIssuesTableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;">No issues found.</td></tr>';
      return;
    }

    const fragment = document.createDocumentFragment();
    filtered.forEach(issue => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><input type="checkbox" class="row-checkbox" data-id="${issue.id}"></td>
        <td>${issue.id}</td>
        <td>${issue.title}</td>
        <td>${issue.category}</td>
        <td>${issue.priority}</td>
        <td>${issue.status}</td>
        <td>${issue.assignedTo || "-"}</td>
        <td>${formatDate(issue.date)}</td>
        <td><button class="btn btn--sm btn--primary view-btn" data-id="${issue.id}" aria-label="View details for ${issue.title}">View</button></td>
      `;
      fragment.appendChild(tr);
    });
    adminIssuesTableBody.appendChild(fragment);
    selectAllCheckbox.checked = false;
  }

  // Event delegation for view buttons inside admin table
  adminIssuesTableBody.addEventListener("click", e => {
    if (e.target.classList.contains("view-btn")) {
      const id = Number(e.target.dataset.id);
      const issue = reports.find(r => r.id === id);
      openIssueModal(issue);
    }
  });

  // Select all checkbox handler
  selectAllCheckbox.addEventListener("change", () => {
    const checked = selectAllCheckbox.checked;
    adminIssuesTableBody.querySelectorAll(".row-checkbox").forEach(cb => cb.checked = checked);
  });

  // Bulk assign action
  bulkAssignBtn.addEventListener("click", () => {
    const selectedIds = Array.from(adminIssuesTableBody.querySelectorAll(".row-checkbox:checked")).map(cb => Number(cb.dataset.id));
    if (selectedIds.length === 0) {
      showToast("No issues selected for bulk assign.", "error");
      return;
    }
    selectedIds.forEach(id => {
      const issue = reports.find(r => r.id === id);
      if (issue) {
        issue.status = "Assigned";
        issue.assignedTo = "Admin User";
      }
    });
    showToast(`Assigned ${selectedIds.length} issues to Admin User.`, "success");
    renderAdminTable();
    loadDashboard();
  });

  // Export data to CSV
  exportDataBtn.addEventListener("click", () => {
    if (reports.length === 0) {
      showToast("No data to export.", "error");
      return;
    }
    const header = ["ID", "Title", "Category", "Priority", "Status", "AssignedTo", "Date", "Location", "Department"];
    const rows = reports.map(r => [
      r.id,
      `"${r.title.replace(/"/g, '""')}"`,
      r.category,
      r.priority,
      r.status,
      r.assignedTo || "",
      r.date,
      `"${r.location.replace(/"/g, '""')}"`,
      r.department || ""
    ]);
    let csvContent = header.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "municipal_issues_export.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  // Modal open/close with keyboard support
  function openIssueModal(issue) {
    if (!issue) return;
    modalTitle.textContent = `Issue Details - ID: ${issue.id}`;
    modalBody.innerHTML = `
      <p><strong>Title:</strong> ${issue.title}</p>
      <p><strong>Category:</strong> ${issue.category}</p>
      <p><strong>Priority:</strong> ${issue.priority}</p>
      <p><strong>Status:</strong> ${issue.status}</p>
      <p><strong>Assigned To:</strong> ${issue.assignedTo || "-"}</p>
      <p><strong>Date:</strong> ${formatDate(issue.date)}</p>
      <p><strong>Location:</strong> ${issue.location}</p>
      <p><strong>Description:</strong><br>${issue.description || "No description provided."}</p>
      ${issue.photos.length > 0 ? `<p><strong>Photos:</strong> ${issue.photos.join(", ")}</p>` : ""}
      ${issue.voiceNote ? `<p><strong>Voice Note:</strong> Available</p>` : ""}
    `;

    issueModal.dataset.issueId = issue.id;
    issueModal.classList.remove("hidden");
    issueModal.focus();
  }

  function closeModal() {
    issueModal.classList.add("hidden");
    delete issueModal.dataset.issueId;
  }

  closeModalBtn.addEventListener("click", closeModal);
  closeModalXBtn.addEventListener("click", closeModal);

  // Close modal on Escape key
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !issueModal.classList.contains("hidden")) {
      closeModal();
    }
  });

  // Status update cycling
  updateIssueBtn.addEventListener("click", () => {
    const id = Number(issueModal.dataset.issueId);
    if (!id) return;
    const issue = reports.find(r => r.id === id);
    if (issue) {
      const statuses = ["New", "Assigned", "In Progress", "Resolved"];
      let currentIndex = statuses.indexOf(issue.status);
      currentIndex = (currentIndex + 1) % statuses.length;
      issue.status = statuses[currentIndex];
      showToast(`Issue status updated to "${issue.status}".`, "success");
      openIssueModal(issue);
      loadDashboard();
      renderAdminTable();
      renderMapMarkers();
      renderMyReports();
    }
  });

  // Analytics charts (unchanged), deferred with deletion of old charts and re-creation

  // Initial load
  activateTab(tabs[0]);
  loadDashboard();
  renderMyReports();
});
