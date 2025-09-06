document.addEventListener("DOMContentLoaded", () => {
  // Data stores (simulate backend)
  let reports = [
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

  let userReports = []; // stores reports submitted by current user (simulate user scope)

  // Elements
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

  // ------- Helper Functions --------
  function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
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

  // ------- Tab Navigation --------
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      // Remove active from all tabs and tab contents
      tabs.forEach(t => t.classList.remove("active"));
      tabContents.forEach(tc => tc.classList.remove("active"));

      tab.classList.add("active");
      const target = tab.getAttribute("data-tab");
      document.getElementById(target).classList.add("active");

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
  });

  // ------- Dashboard --------
  function loadDashboard() {
    // KPIs
    totalReportsEl.textContent = reports.length.toLocaleString();
    const resolvedCount = reports.filter(r => r.status === "Resolved").length;
    resolvedIssuesEl.textContent = resolvedCount.toLocaleString();
    // Average resolution time simulated as 5.8 days +/- small random for demo
    avgResolutionTimeEl.textContent = (5.5 + Math.random() * 0.6).toFixed(1);
    satisfactionEl.textContent = (4 + Math.random() * 0.4).toFixed(1);

    // Recent Issues - show latest 5 by date descending
    const sorted = reports.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    recentIssuesEl.innerHTML = "";
    sorted.slice(0, 5).forEach(issue => {
      const div = document.createElement("div");
      div.className = "issue-item";
      div.textContent = `${issue.title} (${issue.category}) - ${issue.status}`;
      div.style.cursor = "pointer";
      div.addEventListener("click", () => openIssueModal(issue));
      recentIssuesEl.appendChild(div);
    });

    // Department Status - count statuses per department (demo)
    const departmentMap = {};
    reports.forEach(r => {
      const dept = r.department || "Unknown";
      if (!departmentMap[dept]) departmentMap[dept] = { total: 0, resolved: 0 };
      departmentMap[dept].total++;
      if (r.status === "Resolved") departmentMap[dept].resolved++;
    });

    departmentStatusEl.innerHTML = "";
    Object.entries(departmentMap).forEach(([dept, stats]) => {
      const div = document.createElement("div");
      div.className = "department-card";
      div.innerHTML = `<h4>${dept}</h4>
        <div>Total: ${stats.total}</div>
        <div>Resolved: ${stats.resolved}</div>`;
      departmentStatusEl.appendChild(div);
    });
  }

  // ------- Report Issue Form --------
  reportForm.addEventListener("submit", e => {
    e.preventDefault();
    // Validate required fields are present
    const title = reportForm.issueTitle.value.trim();
    const category = reportForm.issueCategory.value;
    const priority = reportForm.issuePriority.value;
    const description = reportForm.issueDescription.value.trim();
    const location = reportForm.issueLocation.value.trim();

    if (!title || !category || !priority || !location) {
      showToast("Please fill in all required fields.", "error");
      return;
    }
    // Prepare new report object
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

    // Handle photos from file input
    const files = photoUploadInput.files;
    for (let i = 0; i < files.length; i++) {
      newReport.photos.push(files[i].name);
    }

    reports.push(newReport);
    userReports.push(newReport);
    showToast("Issue report submitted successfully!", "success");
    reportForm.reset();
    voiceStatus.textContent = "";
    delete voiceStatus.dataset.voiceNote;
    renderMyReports();

  });

  function mapCategoryToDepartment(category) {
    switch (category) {
      case "Infrastructure": return "Public Works";
      case "Sanitation": return "Sanitation Department";
      case "Utilities": return "Water & Utilities";
      case "Public Safety": return "Electrical Department";
      case "Environment": return "Parks & Recreation";
      default: return "General";
    }
  }

  // Use current location button
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

  // Voice note simulation (start/stop)
  let recording = false;
  voiceNoteBtn.addEventListener("click", () => {
    if (!recording) {
      recording = true;
      voiceStatus.textContent = "Recording... Click again to stop.";
      voiceNoteBtn.textContent = "⏹ Stop Recording";
      // For demo simulate voice note content
      voiceStatus.dataset.voiceNote = "voice_note_demo_data";
    } else {
      recording = false;
      voiceStatus.textContent = "Voice note recorded.";
      voiceNoteBtn.textContent = "🎤 Record Voice Note";
    }
  });

  // Render My Reports section
  function renderMyReports() {
    myReportsEl.innerHTML = "";
    if (userReports.length === 0) {
      myReportsEl.textContent = "No reports submitted yet.";
      return;
    }
    userReports.slice().reverse().forEach(r => {
      const div = document.createElement("div");
      div.className = "my-report-item";
      div.innerHTML = `<strong>${r.title}</strong> - ${r.status} <br> <small>${formatDate(r.date)} at ${r.location}</small>`;
      myReportsEl.appendChild(div);
    });
  }

  // ------- Map View --------
  function renderMapMarkers() {
    // Clear existing markers
    mapMarkersContainer.innerHTML = "";
    // Filter by category and status
    const catFilterVal = mapCategoryFilter.value;
    const statFilterVal = mapStatusFilter.value;

    // Filtered issues
    const filteredIssues = reports.filter(r => {
      return (catFilterVal === "" || r.category === catFilterVal)
        && (statFilterVal === "" || r.status === statFilterVal);
    });
    if (filteredIssues.length === 0) {
      mapMarkersContainer.textContent = "No issues to display on map.";
      return;
    }

    filteredIssues.forEach(issue => {
      // Create marker element - simple div with tooltip for demo
      const marker = document.createElement("div");
      marker.className = `map-marker legend-marker ${issue.category.toLowerCase().replace(/ /g, "")}`;
      marker.title = `${issue.title} - ${issue.status}`;
      marker.style.margin = "5px";
      marker.style.padding = "5px";
      marker.style.borderRadius = "50%";
      marker.style.width = "20px";
      marker.style.height = "20px";
      marker.style.display = "inline-block";
      marker.style.backgroundColor = categoryColor(issue.category);
      marker.style.cursor = "pointer";
      marker.addEventListener("click", () => openIssueModal(issue));
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

  // ------- Admin Panel --------
  function renderAdminTable() {
    adminIssuesTableBody.innerHTML = "";

    // Filter issues by admin filter dropdowns
    const deptFilter = adminDepartmentFilter.value;
    const statusFilter = adminStatusFilter.value;
    const priorityFilter = adminPriorityFilter.value;

    const filtered = reports.filter(r => {
      return (deptFilter === "" || r.department === deptFilter)
        && (statusFilter === "" || r.status === statusFilter)
        && (priorityFilter === "" || r.priority === priorityFilter);
    });

    if (filtered.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="9" style="text-align:center;">No issues found.</td>`;
      adminIssuesTableBody.appendChild(tr);
      return;
    }

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
        <td><button class="btn btn--sm btn--primary view-btn" data-id="${issue.id}">View</button></td>
      `;
      adminIssuesTableBody.appendChild(tr);
    });

    // Add event listener for view buttons
    adminIssuesTableBody.querySelectorAll(".view-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        const issue = reports.find(r => r.id === id);
        openIssueModal(issue);
      });
    });

    // Reset select all checkbox
    selectAllCheckbox.checked = false;
  }

  adminDepartmentFilter.addEventListener("change", renderAdminTable);
  adminStatusFilter.addEventListener("change", renderAdminTable);
  adminPriorityFilter.addEventListener("change", renderAdminTable);

  selectAllCheckbox.addEventListener("change", () => {
    const checked = selectAllCheckbox.checked;
    adminIssuesTableBody.querySelectorAll(".row-checkbox").forEach(cb => {
      cb.checked = checked;
    });
  });

  bulkAssignBtn.addEventListener("click", () => {
    const selectedIds = Array.from(adminIssuesTableBody.querySelectorAll(".row-checkbox:checked")).map(cb => Number(cb.dataset.id));
    if (selectedIds.length === 0) {
      showToast("No issues selected for bulk assign.", "error");
      return;
    }
    // Simulate assignment to "Admin User"
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

  exportDataBtn.addEventListener("click", () => {
    if (reports.length === 0) {
      showToast("No data to export.", "error");
      return;
    }
    // Export CSV of reports data
    const header = ["ID", "Title", "Category", "Priority", "Status", "AssignedTo", "Date", "Location", "Department"];
    const rows = reports.map(r => [
      r.id,
      `"${r.title}"`,
      r.category,
      r.priority,
      r.status,
      r.assignedTo || "",
      r.date,
      `"${r.location}"`,
      r.department || ""
    ]);
    let csvContent = header.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "municipal_issues_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  });

  // ------- Modal --------
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

    // Store current issue in modal dataset
    issueModal.dataset.issueId = issue.id;
    issueModal.classList.remove("hidden");
  }

  function closeModal() {
    issueModal.classList.add("hidden");
    delete issueModal.dataset.issueId;
  }

  closeModalBtn.addEventListener("click", closeModal);
  closeModalXBtn.addEventListener("click", closeModal);

  updateIssueBtn.addEventListener("click", () => {
    const id = Number(issueModal.dataset.issueId);
    if (!id) return;
    const issue = reports.find(r => r.id === id);
    if (issue) {
      // Cycle status for demo: New -> Assigned -> In Progress -> Resolved -> New
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

  // ------- Analytics Charts --------
  let charts = {};
  function renderAnalyticsCharts() {
    // Monthly Report Trends - Bar chart example
    const ctxMonthly = document.getElementById("monthlyTrendsChart").getContext("2d");
    if (charts.monthly) charts.monthly.destroy();
    charts.monthly = new Chart(ctxMonthly, {
      type: "bar",
      data: {
        labels: ["Apr", "May", "Jun", "Jul", "Aug", "Sep"],
        datasets: [{
          label: "Reports",
          data: [120, 135, 150, 160, 180, reports.length],
          backgroundColor: "#007bff"
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } }
      }
    });

    // Issue Categories - Pie chart
    const ctxCategories = document.getElementById("categoryChart").getContext("2d");
    if (charts.category) charts.category.destroy();
    const categoryCounts = {};
    reports.forEach(r => {
      categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
    });
    charts.category = new Chart(ctxCategories, {
      type: "pie",
      data: {
        labels: Object.keys(categoryCounts),
        datasets: [{
          data: Object.values(categoryCounts),
          backgroundColor: ["#007bff", "#28a745", "#ffc107", "#dc3545", "#17a2b8"]
        }]
      },
      options: {
        responsive: true,
      }
    });

    // Priority Distribution - Doughnut chart
    const ctxPriority = document.getElementById("priorityChart").getContext("2d");
    if (charts.priority) charts.priority.destroy();
    const priorityCounts = {};
    reports.forEach(r => {
      priorityCounts[r.priority] = (priorityCounts[r.priority] || 0) + 1;
    });
    charts.priority = new Chart(ctxPriority, {
      type: "doughnut",
      data: {
        labels: Object.keys(priorityCounts),
        datasets: [{
          data: Object.values(priorityCounts),
          backgroundColor: ["#dc3545", "#ff5733", "#ffc107", "#28a745"]
        }]
      },
      options: {
        responsive: true,
      }
    });

    // Department Performance - Horizontal Bar chart
    const ctxDepartment = document.getElementById("departmentChart").getContext("2d");
    if (charts.department) charts.department.destroy();
    const deptResolved = {};
    const deptTotal = {};
    reports.forEach(r => {
      const d = r.department || "Unknown";
      deptTotal[d] = (deptTotal[d] || 0) + 1;
      if (r.status === "Resolved") deptResolved[d] = (deptResolved[d] || 0) + 1;
    });
    const deptLabels = Object.keys(deptTotal);
    const performanceData = deptLabels.map(d => {
      const resolved = deptResolved[d] || 0;
      return ((resolved / deptTotal[d]) * 100).toFixed(1);
    });
    charts.department = new Chart(ctxDepartment, {
      type: "bar",
      data: {
        labels: deptLabels,
        datasets: [{
          label: "Resolved (%)",
          data: performanceData,
          backgroundColor: "#17a2b8"
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        scales: { x: { beginAtZero: true, max: 100 } }
      }
    });
  }

  // ------- Initialization --------
  loadDashboard();
  renderMyReports();

});
