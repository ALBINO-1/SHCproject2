(function () {
  "use strict";

  const D = window.LONGOS_DATA;
  const app = document.getElementById("app");

  const icons = {
    grid: "▦", users: "♙", queue: "▤", records: "▣", info: "ⓘ",
    settings: "⚙", logout: "↪", doctor: "✚", patient: "●", display: "▥",
    search: "⌕", add: "+", check: "✓", edit: "✎", calendar: "□"
  };

  const roleConfig = {
    patient: {
      label: "Patient",
      name: "Maria Santos",
      nav: [
        ["dashboard", "Dashboard", icons.grid],
        ["profile", "My Profile", icons.patient],
        ["records", "My Health Records", icons.records],
        ["queue", "My Queue", icons.queue],
        ["information", "Health Center Information", icons.info]
      ]
    },
    staff: {
      label: "Staff / Front Desk",
      name: "Rina Bautista",
      nav: [
        ["dashboard", "Dashboard", icons.grid],
        ["registration", "Patient Registration", icons.add],
        ["patients", "Patient Management", icons.users],
        ["queue", "Queue Management", icons.queue],
        ["initial-health", "Initial Health Information", icons.records],
        ["information", "Information Management", icons.info]
      ]
    },
    doctor: {
      label: "Doctor",
      name: "Dr. Angela Ramos",
      nav: [
        ["dashboard", "Dashboard", icons.grid],
        ["patients", "Patient Records", icons.users],
        ["consultation", "Consultation / Clinical Record", icons.doctor],
        ["queue", "Queue View", icons.queue]
      ]
    },
    admin: {
      label: "Administrator",
      name: "Mark Villanueva",
      nav: [
        ["dashboard", "Dashboard", icons.grid],
        ["users", "User Management", icons.users],
        ["providers", "Staff & Doctor Management", icons.doctor],
        ["information", "Information Management", icons.info],
        ["settings", "System Settings", icons.settings]
      ]
    }
  };

  const state = {
    role: null,
    page: "dashboard",
    selectedPatient: null,
    modal: null,
    search: "",
    toast: "",
    sidebarOpen: false
  };

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[c]));
  }

  function initials(name) {
    return name.split(" ").filter(Boolean).slice(0, 2).map(x => x[0]).join("").toUpperCase();
  }

  function roleKey(role) {
    return role === "Staff / Front Desk" ? "staff" :
      role === "Administrator" ? "admin" :
      role === "Doctor" ? "doctor" : "patient";
  }

  function showToast(message) {
    state.toast = message;
    render();
    clearTimeout(window.__toast);
    window.__toast = setTimeout(() => { state.toast = ""; render(); }, 2200);
  }

  function queueServing() {
    return D.queue.find(q => q.status === "Serving");
  }

  function waitingQueue() {
    return D.queue.filter(q => q.status === "Waiting");
  }

  function nextQueueNumber() {
    const nums = D.queue.map(q => Number(q.number.replace(/\D/g, ""))).filter(Boolean);
    return `Q-${String(Math.max(...nums, 0) + 1).padStart(3, "0")}`;
  }

  function badge(status) {
    const map = {
      Serving: "badge-success", Waiting: "badge-warning", Completed: "badge-neutral",
      Active: "badge-success", Available: "badge-success", Scheduled: "badge-info",
      Inactive: "badge-danger"
    };
    return `<span class="badge ${map[status] || "badge-neutral"}">${esc(status)}</span>`;
  }

  function pageTitle() {
    const cfg = roleConfig[state.role];
    const found = cfg?.nav.find(x => x[0] === state.page);
    return found ? found[1] : "Dashboard";
  }

  function layout(content) {
    const cfg = roleConfig[state.role];
    return `
      <div class="app-shell">
        <aside class="sidebar ${state.sidebarOpen ? "open" : ""}" id="sidebar">
          <div class="sidebar-brand">
            <div class="brand-lockup">
              <img class="brand-logo-img" src="assets/city-health-department.png" alt="City Health Department logo">
              <div><strong>Longos Super Health Center</strong><span>Information Management System</span></div>
            </div>
          </div>
          <div class="nav-label">${esc(cfg.label)}</div>
          ${cfg.nav.map(([id, label, icon]) => `
            <button class="nav-item ${state.page === id ? "active" : ""}" data-action="navigate" data-page="${id}">
              <span class="icon">${icon}</span><span>${esc(label)}</span>
            </button>`).join("")}
          <div class="nav-label">System</div>
          <button class="nav-item" data-action="digital-display"><span class="icon">${icons.display}</span><span>Public Display</span></button>
          <button class="nav-item" data-action="logout"><span class="icon">${icons.logout}</span><span>Sign out</span></button>
        </aside>

        <main class="main">
          <header class="topbar">
            <div style="display:flex;align-items:center;gap:10px">
              <button class="mobile-menu" data-action="toggle-sidebar">☰</button>
              <div class="topbar-title">
                <h2>${esc(pageTitle())}</h2>
                <p>Barangay Longos Super Health Center • Malabon City</p>
              </div>
            </div>
            <div class="user-menu">
              <div class="user-text">
                <strong>${esc(cfg.name)}</strong><br>
                <span class="small muted">${esc(cfg.label)}</span>
              </div>
              <div class="avatar">${initials(cfg.name)}</div>
            </div>
          </header>
          <section class="content">${content}</section>
        </main>
      </div>
      ${state.modal ? modal(state.modal) : ""}
      ${state.toast ? `<div class="toast">${esc(state.toast)}</div>` : ""}
    `;
  }

  function dashboardHeader(title, subtitle, actions = "") {
    return `<div class="page-heading"><div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div><div class="actions">${actions}</div></div>`;
  }

  function stat(label, value, note, icon) {
    return `<div class="stat-card"><div class="stat-top"><span class="stat-label">${esc(label)}</span><span class="stat-icon">${icon}</span></div><div class="stat-value">${esc(value)}</div><div class="stat-note">${esc(note)}</div></div>`;
  }

  function patientDashboard() {
    const patient = D.patients[0];
    const serving = queueServing();
    const own = D.queue.find(q => q.patientId === patient.id);
    return dashboardHeader("Good day, Maria", "Here is your current health-center information.", `
      <button class="btn btn-primary" data-action="navigate" data-page="queue">View My Queue</button>
    `) + `
      <div class="cards">
        ${stat("My Queue Number", own?.number || "—", own?.status || "No active queue", icons.queue)}
        ${stat("Currently Serving", serving?.number || "—", serving?.nickname || "—", icons.check)}
        ${stat("Available Services", D.services.length, "Health-center services", icons.info)}
        ${stat("My Records", D.clinicalRecords[patient.id]?.length || 0, "Recorded consultations", icons.records)}
      </div>
      <div class="grid-2">
        <div class="panel">
          <div class="panel-head"><h3>Queue Status</h3><button class="btn btn-sm btn-outline" data-action="navigate" data-page="queue">Open</button></div>
          <div class="panel-body">
            <div class="kpi-queue">
              <small>Current Queue</small>
              <div class="big-number">${esc(own?.number || "—")}</div>
              <div class="sub">${esc(own?.status || "No active queue entry")}</div>
            </div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head"><h3>Health Center Today</h3></div>
          <div class="panel-body">
            <div class="info-list">
              <div class="info-row"><span>Hours</span><span>8:00 AM – 4:00 PM</span></div>
              <div class="info-row"><span>Location</span><span>Longos, Malabon City</span></div>
              <div class="info-row"><span>Services</span><span>${D.services.length} available</span></div>
              <div class="info-row"><span>Providers</span><span>${D.providers.length} listed</span></div>
            </div>
          </div>
        </div>
      </div>
      <div class="panel" style="margin-top:18px">
        <div class="panel-head"><h3>Available Services</h3><button class="btn btn-sm btn-outline" data-action="navigate" data-page="information">View all</button></div>
        <div class="panel-body"><div class="service-grid">${D.services.slice(0,3).map(serviceCard).join("")}</div></div>
      </div>`;
  }

  function staffDashboard() {
    const waiting = waitingQueue();
    return dashboardHeader("Staff Dashboard", "Front-desk operations and patient flow for today.", `
      <button class="btn btn-secondary" data-action="navigate" data-page="registration">Register Patient</button>
      <button class="btn btn-primary" data-action="navigate" data-page="queue">Manage Queue</button>
    `) + `
      <div class="cards">
        ${stat("Waiting", waiting.length, "Patients in queue", icons.queue)}
        ${stat("Now Serving", queueServing()?.number || "—", queueServing()?.nickname || "—", icons.check)}
        ${stat("Registered Patients", D.patients.length, "Sample patient registry", icons.users)}
        ${stat("Providers Today", D.providers.filter(p=>p.status !== "Inactive").length, "Listed for today", icons.doctor)}
      </div>
      <div class="grid-2">
        <div class="panel">
          <div class="panel-head"><h3>Current Queue</h3><button class="btn btn-sm btn-primary" data-action="navigate" data-page="queue">Manage</button></div>
          <div class="panel-body">
            <div class="kpi-queue">
              <small>Now Serving</small>
              <div class="big-number">${esc(queueServing()?.number || "—")}</div>
              <div class="sub">${esc(queueServing()?.nickname || "No patient being served")}</div>
            </div>
            <div style="margin-top:15px" class="stack">
              ${waiting.slice(0,4).map(q => `<div class="patient-card"><div class="patient-main"><div class="patient-avatar">${esc(q.number.replace("Q-",""))}</div><div><strong>${esc(q.nickname)}</strong><small>${esc(q.number)} • ${esc(q.purpose)}</small></div></div>${badge(q.status)}</div>`).join("")}
            </div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head"><h3>Today's Providers</h3></div>
          <div class="panel-body stack">${D.providers.map(p => `<div class="patient-card"><div class="patient-main"><div class="patient-avatar">${initials(p.name)}</div><div><strong>${esc(p.name)}</strong><small>${esc(p.role)}</small></div></div>${badge(p.status)}</div>`).join("")}</div>
        </div>
      </div>`;
  }

  function doctorDashboard() {
    const waiting = waitingQueue();
    return dashboardHeader("Doctor Dashboard", "Patient consultation and clinical record workspace.", `
      <button class="btn btn-primary" data-action="navigate" data-page="patients">Open Patient Records</button>
    `) + `
      <div class="cards">
        ${stat("Waiting for Consultation", waiting.length, "Current queue", icons.queue)}
        ${stat("Now Serving", queueServing()?.number || "—", queueServing()?.nickname || "—", icons.check)}
        ${stat("Patient Records", D.patients.length, "Accessible sample records", icons.records)}
        ${stat("Today's Provider", "You", "Dr. Angela Ramos", icons.doctor)}
      </div>
      <div class="grid-2">
        <div class="panel">
          <div class="panel-head"><h3>Consultation Queue</h3><button class="btn btn-sm btn-outline" data-action="navigate" data-page="queue">View Queue</button></div>
          <div class="panel-body">
            ${waiting.map(q => `<div class="patient-card" style="margin-bottom:9px"><div class="patient-main"><div class="patient-avatar">${esc(q.number.replace("Q-",""))}</div><div><strong>${esc(q.nickname)}</strong><small>${esc(q.number)} • ${esc(q.purpose)}</small></div></div><button class="btn btn-sm btn-primary" data-action="open-patient" data-id="${q.patientId}">Open</button></div>`).join("") || `<div class="empty">No patients waiting.</div>`}
          </div>
        </div>
        <div class="panel">
          <div class="panel-head"><h3>Clinical Access Reminder</h3></div>
          <div class="panel-body">
            <div class="alert alert-info">Clinical fields such as diagnosis and prescription are editable through the doctor consultation workflow only.</div>
            <div class="info-list" style="margin-top:15px">
              <div class="info-row"><span>Role</span><span>Doctor</span></div>
              <div class="info-row"><span>Clinical records</span><span>View / Update</span></div>
              <div class="info-row"><span>Queue</span><span>View only</span></div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function adminDashboard() {
    return dashboardHeader("Administrator Dashboard", "Manage system users, providers, information, and settings.", `
      <button class="btn btn-primary" data-action="navigate" data-page="users">Manage Users</button>
    `) + `
      <div class="cards">
        ${stat("User Accounts", D.users.length, "Sample system users", icons.users)}
        ${stat("Providers", D.providers.length, "Staff and providers listed", icons.doctor)}
        ${stat("Services", D.services.length, "Public information entries", icons.info)}
        ${stat("Queue Entries", D.queue.length, "Current sample queue", icons.queue)}
      </div>
      <div class="grid-2">
        <div class="panel">
          <div class="panel-head"><h3>System Access</h3></div>
          <div class="panel-body">
            <div class="info-list">
              <div class="info-row"><span>Patient</span><span>Own information and queue</span></div>
              <div class="info-row"><span>Staff / Front Desk</span><span>Registration and queue operations</span></div>
              <div class="info-row"><span>Doctor</span><span>Clinical records</span></div>
              <div class="info-row"><span>Administrator</span><span>System administration</span></div>
            </div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head"><h3>Administrative Tasks</h3></div>
          <div class="panel-body stack">
            <button class="btn btn-outline full" data-action="navigate" data-page="users">User Management</button>
            <button class="btn btn-outline full" data-action="navigate" data-page="providers">Staff & Doctor Management</button>
            <button class="btn btn-outline full" data-action="navigate" data-page="information">Information Management</button>
            <button class="btn btn-outline full" data-action="navigate" data-page="settings">System Settings</button>
          </div>
        </div>
      </div>`;
  }

  function serviceCard(s) {
    return `<div class="service-card"><div class="service-icon">+</div><h4>${esc(s.name)}</h4><p>${esc(s.description)}</p><p style="margin-top:8px"><strong>${esc(s.schedule)}</strong></p></div>`;
  }

  function profilePage() {
    const p = D.patients[0];
    return dashboardHeader("My Profile", "View and update selected basic personal information.", `<button class="btn btn-primary" data-action="open-profile-edit">Edit Profile</button>`) + `
      <div class="grid-2">
        <div class="panel"><div class="panel-head"><h3>Personal Information</h3></div><div class="panel-body">
          <div class="info-list">
            <div class="info-row"><span>Patient ID</span><span>${esc(p.id)}</span></div>
            <div class="info-row"><span>Full Name</span><span>${esc(p.name)}</span></div>
            <div class="info-row"><span>Nickname</span><span>${esc(p.nickname)}</span></div>
            <div class="info-row"><span>Sex</span><span>${esc(p.sex)}</span></div>
            <div class="info-row"><span>Birthdate</span><span>${esc(p.birthdate)}</span></div>
            <div class="info-row"><span>Address</span><span>${esc(p.address)}</span></div>
            <div class="info-row"><span>Phone</span><span>${esc(p.phone)}</span></div>
            <div class="info-row"><span>Family No.</span><span>${esc(p.familyNo)}</span></div>
          </div>
        </div></div>
        <div class="panel"><div class="panel-head"><h3>Account Information</h3></div><div class="panel-body">
          <div class="alert alert-info">Only selected basic personal details are editable from the patient interface. Clinical information remains read-only here.</div>
          <div class="info-list" style="margin-top:14px">
            <div class="info-row"><span>Account</span><span>Active</span></div>
            <div class="info-row"><span>Role</span><span>Patient</span></div>
            <div class="info-row"><span>Last Visit</span><span>${esc(p.lastVisit)}</span></div>
          </div>
        </div></div>
      </div>`;
  }

  function patientRecordsPage() {
    const p = D.patients[0];
    const records = D.clinicalRecords[p.id] || [];
    return dashboardHeader("My Health Records", "Your available health information and recorded consultations.") + `
      <div class="grid-2">
        <div class="panel"><div class="panel-head"><h3>Initial Health Information</h3></div><div class="panel-body">
          <div class="info-list">
            <div class="info-row"><span>Blood Pressure</span><span>${esc(p.bp)}</span></div>
            <div class="info-row"><span>Oxygen Level</span><span>${esc(p.oxygen)}</span></div>
            <div class="info-row"><span>Last Recorded Visit</span><span>${esc(p.lastVisit)}</span></div>
          </div>
        </div></div>
        <div class="panel"><div class="panel-head"><h3>Patient Details</h3></div><div class="panel-body">
          <div class="info-list">
            <div class="info-row"><span>Patient ID</span><span>${esc(p.id)}</span></div>
            <div class="info-row"><span>Family No.</span><span>${esc(p.familyNo)}</span></div>
            <div class="info-row"><span>Status</span><span>${badge(p.status)}</span></div>
          </div>
        </div></div>
      </div>
      <div class="panel" style="margin-top:18px">
        <div class="panel-head"><h3>Clinical History</h3></div>
        <div class="table-wrap"><table><thead><tr><th>Date</th><th>Provider</th><th>Diagnosis</th><th>Prescription</th><th>Notes</th></tr></thead><tbody>
          ${records.map(r => `<tr><td>${esc(r.date)}</td><td>${esc(r.provider)}</td><td>${esc(r.diagnosis)}</td><td>${esc(r.prescription)}</td><td>${esc(r.notes)}</td></tr>`).join("") || `<tr><td colspan="5"><div class="empty">No clinical records available.</div></td></tr>`}
        </tbody></table></div>
      </div>`;
  }

  function patientQueuePage() {
    const p = D.patients[0], own = D.queue.find(q => q.patientId === p.id), serving = queueServing();
    return dashboardHeader("My Queue", "Monitor your queue position and the current patient being served.") + `
      <div class="grid-2">
        <div class="kpi-queue"><small>Your Queue Number</small><div class="big-number">${esc(own?.number || "—")}</div><div class="sub">${esc(own?.status || "No active queue entry")}</div></div>
        <div class="panel"><div class="panel-head"><h3>Current Serving</h3></div><div class="panel-body center"><div style="font-size:3rem;font-weight:900;color:var(--primary)">${esc(serving?.number || "—")}</div><div class="muted">${esc(serving?.nickname || "")}</div></div></div>
      </div>
      <div class="panel" style="margin-top:18px"><div class="panel-head"><h3>Upcoming Queue</h3></div><div class="panel-body">
        <div class="grid-3">${waitingQueue().slice(0,3).map(q => `<div class="patient-card"><div><strong>${esc(q.number)}</strong><small class="muted">${esc(q.nickname)}</small></div>${badge(q.status)}</div>`).join("")}</div>
      </div></div>`;
  }

  function informationPage(adminMode = false) {
    const title = adminMode ? "Information Management" : "Health Center Information";
    const subtitle = adminMode ? "Manage information presented to patients and the public display." : "Services, schedules, providers, and facility navigation information.";
    const action = adminMode ? `<button class="btn btn-primary" data-action="add-service">Add Service</button>` : "";
    return dashboardHeader(title, subtitle, action) + `
      <div class="panel">
        <div class="tabs">
          <button class="tab active" data-action="info-tab" data-tab="services">Services</button>
          <button class="tab" data-action="info-tab" data-tab="providers">Providers & Schedules</button>
          <button class="tab" data-action="info-tab" data-tab="facility">Facility Guide</button>
        </div>
        <div class="panel-body" id="info-panel">
          <div class="service-grid">${D.services.map(serviceCard).join("")}</div>
        </div>
      </div>`;
  }

  function registrationPage() {
    return dashboardHeader("Patient Registration", "Register a patient using the health center's required basic information.") + `
      <div class="panel"><div class="panel-body">
        <form id="registration-form">
          <div class="section-title">Patient Information</div>
          <div class="form-grid">
            <div class="form-group"><label>Full Name *</label><input class="input" name="name" required placeholder="e.g. Jose Santos"></div>
            <div class="form-group"><label>Nickname</label><input class="input" name="nickname" placeholder="Preferred name"></div>
            <div class="form-group"><label>Sex *</label><select name="sex" required><option value="">Select</option><option>Female</option><option>Male</option></select></div>
            <div class="form-group"><label>Birthdate *</label><input class="input" type="date" name="birthdate" required></div>
            <div class="form-group"><label>Phone</label><input class="input" name="phone" placeholder="09XXXXXXXXX"></div>
            <div class="form-group"><label>Family Number</label><input class="input" name="familyNo" placeholder="Family record number"></div>
            <div class="form-group span-2"><label>Address</label><input class="input" name="address" value="Longos, Malabon City"></div>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px"><button class="btn btn-primary" type="submit">Register Patient</button></div>
        </form>
      </div></div>`;
  }

  function patientsPage(mode) {
    const isDoctor = mode === "doctor";
    const query = state.search.toLowerCase();
    const list = D.patients.filter(p => `${p.name} ${p.id} ${p.familyNo}`.toLowerCase().includes(query));
    return dashboardHeader(isDoctor ? "Patient Records" : "Patient Management", isDoctor ? "Search and open patient records available for clinical care." : "Search registered patients and open their information.", `
      ${!isDoctor ? `<button class="btn btn-primary" data-action="navigate" data-page="registration">Register Patient</button>` : ""}
    `) + `
      <div class="panel"><div class="panel-body">
        <div class="search-row"><input id="patient-search" class="input" value="${esc(state.search)}" placeholder="Search by patient name, ID, or family number"><button class="btn btn-outline" data-action="clear-search">Clear</button></div>
        <div class="table-wrap"><table><thead><tr><th>Patient</th><th>Patient ID</th><th>Family No.</th><th>Age / Sex</th><th>Last Visit</th><th>Status</th><th></th></tr></thead><tbody>
          ${list.map(p => `<tr>
            <td><strong>${esc(p.name)}</strong><br><span class="small muted">${esc(p.nickname)}</span></td>
            <td>${esc(p.id)}</td><td>${esc(p.familyNo)}</td><td>${esc(p.age)} / ${esc(p.sex)}</td><td>${esc(p.lastVisit)}</td><td>${badge(p.status)}</td>
            <td><button class="btn btn-sm btn-primary" data-action="open-patient" data-id="${p.id}">Open</button></td>
          </tr>`).join("") || `<tr><td colspan="7"><div class="empty">No matching patients.</div></td></tr>`}
        </tbody></table></div>
      </div></div>`;
  }

  function queueManagementPage(mode) {
    const isDoctor = mode === "doctor";
    return dashboardHeader(isDoctor ? "Queue View" : "Queue Management", isDoctor ? "View consultation queue status. Queue controls remain with the front desk." : "Manage the patient queue and advance the current patient.", `
      ${!isDoctor ? `<button class="btn btn-primary" data-action="add-queue">Add to Queue</button>` : ""}
    `) + `
      <div class="cards">
        ${stat("Now Serving", queueServing()?.number || "—", queueServing()?.nickname || "—", icons.check)}
        ${stat("Waiting", waitingQueue().length, "Patients", icons.queue)}
        ${stat("Next", waitingQueue()[0]?.number || "—", waitingQueue()[0]?.nickname || "—", icons.patient)}
        ${stat("Total Entries", D.queue.length, "Current sample queue", icons.records)}
      </div>
      <div class="panel">
        <div class="panel-head"><h3>Queue</h3>${!isDoctor ? `<button class="btn btn-sm btn-secondary" data-action="advance-queue">Call Next Patient</button>` : ""}</div>
        <div class="table-wrap"><table><thead><tr><th>Queue No.</th><th>Patient</th><th>Purpose</th><th>Status</th>${!isDoctor ? "<th>Action</th>" : ""}</tr></thead><tbody>
          ${D.queue.map(q => `<tr><td><strong>${esc(q.number)}</strong></td><td>${esc(q.nickname)}</td><td>${esc(q.purpose)}</td><td>${badge(q.status)}</td>${!isDoctor ? `<td>${q.status === "Waiting" ? `<button class="btn btn-sm btn-outline" data-action="serve-one" data-number="${q.number}">Serve</button>` : ""}</td>` : ""}</tr>`).join("")}
        </tbody></table></div>
      </div>`;
  }

  function initialHealthPage() {
    return dashboardHeader("Initial Health Information", "Record basic assessment information collected by the front desk.") + `
      <div class="panel"><div class="panel-body">
        <div class="search-row"><input id="health-search" class="input" placeholder="Search patient by name or ID"><button class="btn btn-outline" data-action="clear-health-search">Clear</button></div>
        <div class="table-wrap"><table><thead><tr><th>Patient</th><th>Patient ID</th><th>Blood Pressure</th><th>Oxygen</th><th>Last Visit</th><th></th></tr></thead><tbody>
          ${D.patients.map(p => `<tr><td>${esc(p.name)}</td><td>${esc(p.id)}</td><td>${esc(p.bp)}</td><td>${esc(p.oxygen)}</td><td>${esc(p.lastVisit)}</td><td><button class="btn btn-sm btn-primary" data-action="edit-health" data-id="${p.id}">Record / Edit</button></td></tr>`).join("")}
        </tbody></table></div>
      </div></div>`;
  }

  function usersPage() {
    return dashboardHeader("User Management", "Manage system accounts and role assignments.", `<button class="btn btn-primary" data-action="add-user">Add User</button>`) + `
      <div class="panel"><div class="table-wrap"><table><thead><tr><th>User</th><th>Username</th><th>Role</th><th>Status</th><th></th></tr></thead><tbody>
      ${D.users.map(u => `<tr><td><strong>${esc(u.name)}</strong><br><span class="small muted">${esc(u.id)}</span></td><td>${esc(u.username)}</td><td>${esc(u.role)}</td><td>${badge(u.status)}</td><td><button class="btn btn-sm btn-outline" data-action="edit-user" data-id="${u.id}">Edit</button></td></tr>`).join("")}
      </tbody></table></div></div>`;
  }

  function providersPage() {
    return dashboardHeader("Staff & Doctor Management", "Manage provider information and schedules shown by the system.", `<button class="btn btn-primary" data-action="add-provider">Add Provider</button>`) + `
      <div class="panel"><div class="table-wrap"><table><thead><tr><th>Provider</th><th>Role</th><th>Schedule</th><th>Status</th><th></th></tr></thead><tbody>
      ${D.providers.map(p => `<tr><td><strong>${esc(p.name)}</strong></td><td>${esc(p.role)}</td><td>${esc(p.schedule)}</td><td>${badge(p.status)}</td><td><button class="btn btn-sm btn-outline" data-action="edit-provider" data-id="${p.id}">Edit</button></td></tr>`).join("")}
      </tbody></table></div></div>`;
  }

  function settingsPage() {
    return dashboardHeader("System Settings", "Frontend-only configuration placeholders for the future backend-connected system.") + `
      <div class="grid-2">
        <div class="panel"><div class="panel-head"><h3>Health Center</h3></div><div class="panel-body">
          <div class="form-group"><label>Facility Name</label><input class="input" value="${esc(D.facility.name)}"></div>
          <div class="form-group"><label>Address</label><input class="input" value="${esc(D.facility.address)}"></div>
          <div class="form-group"><label>Operating Hours</label><input class="input" value="${esc(D.facility.hours)}"></div>
          <button class="btn btn-primary" data-action="save-settings">Save Settings</button>
        </div></div>
        <div class="panel"><div class="panel-head"><h3>Public Display</h3></div><div class="panel-body">
          <div class="info-list">
            <div class="info-row"><span>Queue display</span><span>Enabled</span></div>
            <div class="info-row"><span>Services</span><span>Enabled</span></div>
            <div class="info-row"><span>Provider schedules</span><span>Enabled</span></div>
            <div class="info-row"><span>Facility guide</span><span>Enabled</span></div>
          </div>
          <button class="btn btn-secondary full" style="margin-top:15px" data-action="digital-display">Open Public Display</button>
        </div></div>
      </div>`;
  }

  function publicDisplay() {
    const serving = queueServing(), waiting = waitingQueue();
    return `<div class="display-page">
      <div class="display-header">
        <div><h1>Barangay Longos Super Health Center</h1><p>Patient Information & Queue Display • ${esc(D.facility.address)}</p></div>
        <div class="display-clock" id="display-clock"></div>
      </div>
      <div class="display-grid">
        <div class="now-serving"><small>Now Serving</small><div class="queue-number">${esc(serving?.number || "—")}</div><div class="label">${esc(serving?.nickname || "Please wait for the next call")}</div></div>
        <div class="display-side">
          <div class="display-card"><h3>Next Patients</h3>${waiting.slice(0,5).map(q => `<div class="display-queue-row"><strong>${esc(q.number)}</strong><span>${esc(q.nickname)}</span></div>`).join("") || `<p>No waiting patients.</p>`}</div>
          <div class="display-card"><h3>Today's Providers</h3>${D.providers.map(p => `<div class="display-queue-row"><span>${esc(p.name)}</span><span>${esc(p.status)}</span></div>`).join("")}</div>
        </div>
      </div>
      <div class="display-bottom">
        <div class="display-card"><h3>Available Services</h3>${D.services.slice(0,4).map(s => `<p>• ${esc(s.name)}</p>`).join("")}</div>
        <div class="display-card"><h3>Service Schedule</h3>${D.services.slice(0,4).map(s => `<p><strong>${esc(s.name)}</strong><br>${esc(s.schedule)}</p>`).join("")}</div>
        <div class="display-card"><h3>Facility Guide</h3>${D.facility.guide.slice(0,4).map(x => `<p><strong>${esc(x[0])}</strong><br>${esc(x[1])}</p>`).join("")}</div>
      </div>
      <div style="display:flex;justify-content:center;margin-top:22px"><button class="btn btn-secondary" data-action="close-display">Return to System</button></div>
    </div>`;
  }

  function modal(type) {
    let body = "", title = "", foot = "";
    if (type === "profile") {
      const p = D.patients[0]; title = "Edit Basic Profile";
      body = `<form id="profile-form"><div class="form-grid">
        <div class="form-group"><label>Nickname</label><input class="input" name="nickname" value="${esc(p.nickname)}"></div>
        <div class="form-group"><label>Phone</label><input class="input" name="phone" value="${esc(p.phone)}"></div>
        <div class="form-group span-2"><label>Address</label><input class="input" name="address" value="${esc(p.address)}"></div>
      </div></form>`;
      foot = `<button class="btn btn-outline" data-action="close-modal">Cancel</button><button class="btn btn-primary" data-action="save-profile">Save Changes</button>`;
    }
    if (type === "patient") {
      const p = D.patients.find(x => x.id === state.selectedPatient); title = p ? `${p.name} — Patient Record` : "Patient Record";
      const records = D.clinicalRecords[p?.id] || [];
      body = p ? `<div class="grid-2">
        <div><h4 class="section-title" style="margin-top:0">Patient Information</h4><div class="info-list">
          <div class="info-row"><span>Patient ID</span><span>${esc(p.id)}</span></div><div class="info-row"><span>Name</span><span>${esc(p.name)}</span></div><div class="info-row"><span>Sex / Age</span><span>${esc(p.sex)} / ${esc(p.age)}</span></div><div class="info-row"><span>Birthdate</span><span>${esc(p.birthdate)}</span></div><div class="info-row"><span>Family No.</span><span>${esc(p.familyNo)}</span></div><div class="info-row"><span>Phone</span><span>${esc(p.phone)}</span></div><div class="info-row"><span>Address</span><span>${esc(p.address)}</span></div>
        </div></div>
        <div><h4 class="section-title" style="margin-top:0">Initial Health Information</h4><div class="info-list">
          <div class="info-row"><span>Blood Pressure</span><span>${esc(p.bp)}</span></div><div class="info-row"><span>Oxygen</span><span>${esc(p.oxygen)}</span></div><div class="info-row"><span>Last Visit</span><span>${esc(p.lastVisit)}</span></div>
        </div></div>
        <div style="grid-column:1/-1"><h4 class="section-title">Clinical History</h4>${records.map(r => `<div class="patient-card" style="margin-bottom:8px"><div><strong>${esc(r.date)} • ${esc(r.diagnosis)}</strong><small>${esc(r.provider)}<br>${esc(r.prescription)}<br>${esc(r.notes)}</small></div></div>`).join("") || `<div class="empty">No clinical records.</div>`}</div>
      </div>` : `<div class="empty">Patient not found.</div>`;
      foot = `<button class="btn btn-outline" data-action="close-modal">Close</button>${state.role === "doctor" && p ? `<button class="btn btn-primary" data-action="open-consultation" data-id="${p.id}">Open Consultation</button>` : ""}`;
    }
    if (type === "consultation") {
      const p = D.patients.find(x => x.id === state.selectedPatient); const latest = (D.clinicalRecords[p.id] || [])[0] || {};
      title = `Consultation — ${p.name}`;
      body = `<form id="consultation-form">
        <div class="alert alert-info">Only the doctor workflow can edit diagnosis and prescription in this prototype.</div>
        <div class="form-grid" style="margin-top:15px">
          <div class="form-group"><label>Patient</label><input class="input" value="${esc(p.name)}" disabled></div>
          <div class="form-group"><label>Date</label><input class="input" type="date" name="date" value="${new Date().toISOString().slice(0,10)}"></div>
          <div class="form-group span-2"><label>Diagnosis *</label><input class="input" name="diagnosis" value="${esc(latest.diagnosis || "")}" required></div>
          <div class="form-group span-2"><label>Prescription</label><textarea name="prescription">${esc(latest.prescription || "")}</textarea></div>
          <div class="form-group span-2"><label>Clinical Notes</label><textarea name="notes">${esc(latest.notes || "")}</textarea></div>
        </div>
      </form>`;
      foot = `<button class="btn btn-outline" data-action="close-modal">Cancel</button><button class="btn btn-primary" data-action="save-consultation">Save Clinical Record</button>`;
    }
    if (type === "health") {
      const p = D.patients.find(x => x.id === state.selectedPatient); title = `Initial Health Information — ${p.name}`;
      body = `<form id="health-form"><div class="form-grid">
        <div class="form-group"><label>Patient</label><input class="input" value="${esc(p.name)}" disabled></div>
        <div class="form-group"><label>Patient ID</label><input class="input" value="${esc(p.id)}" disabled></div>
        <div class="form-group"><label>Blood Pressure</label><input class="input" name="bp" value="${esc(p.bp)}" placeholder="e.g. 120/80"></div>
        <div class="form-group"><label>Oxygen Level</label><input class="input" name="oxygen" value="${esc(p.oxygen)}" placeholder="e.g. 98%"></div>
      </div></form>`;
      foot = `<button class="btn btn-outline" data-action="close-modal">Cancel</button><button class="btn btn-primary" data-action="save-health">Save Information</button>`;
    }
    if (type === "queue") {
      title = "Add Patient to Queue";
      body = `<form id="queue-form"><div class="form-grid">
        <div class="form-group span-2"><label>Patient *</label><select name="patientId" required>${D.patients.map(p => `<option value="${p.id}">${esc(p.name)} (${esc(p.id)})</option>`).join("")}</select></div>
        <div class="form-group span-2"><label>Purpose</label><select name="purpose"><option>Consultation</option><option>Health Screening</option><option>Other Health Center Service</option></select></div>
      </div></form>`;
      foot = `<button class="btn btn-outline" data-action="close-modal">Cancel</button><button class="btn btn-primary" data-action="save-queue">Generate Queue Number</button>`;
    }
    if (type === "service") {
      title = "Add Service";
      body = `<form id="service-form"><div class="form-grid"><div class="form-group"><label>Service Name *</label><input class="input" name="name" required></div><div class="form-group"><label>Schedule</label><input class="input" name="schedule"></div><div class="form-group span-2"><label>Description</label><textarea name="description"></textarea></div></div></form>`;
      foot = `<button class="btn btn-outline" data-action="close-modal">Cancel</button><button class="btn btn-primary" data-action="save-service">Add Service</button>`;
    }
    return `<div class="modal-backdrop"><div class="modal"><div class="modal-head"><h3>${title}</h3><button class="icon-btn" data-action="close-modal">✕</button></div><div class="modal-body">${body}</div><div class="modal-foot">${foot}</div></div></div>`;
  }

  function login() {
    return `<div class="login-page">
      <section class="login-brand">
        <div class="login-branding-logos">
          <img src="assets/city-of-malabon.png" alt="City of Malabon logo">
          <img src="assets/city-health-department.png" alt="City Health Department logo">
          <img class="ahon" src="assets/malabon-ahon.png" alt="Malabon Ahon logo">
          <img src="assets/barangay-logo.png" alt="Barangay Longos logo">
        </div>
        <h1>LONGOS<br>SUPER HEALTH CENTER</h1>
        <p>Web Based Patient Queue, Information Display and Health Information Management System.</p>
        <div class="login-features">
          <div class="login-feature">✓ Patient queue management</div>
          <div class="login-feature">✓ Health information management</div>
          <div class="login-feature">✓ Health-center information display</div>
          <div class="login-feature">✓ Role-based system interfaces</div>
        </div>
      </section>
      <section class="login-panel"><div class="login-card">
        <div class="brand-lockup" style="margin-bottom:24px"><img class="brand-logo-img" src="assets/city-health-department.png" alt="City Health Department logo"><div><strong>Longos Super Health Center</strong><span class="muted">Health Information Management System</span></div></div>
        <h2>Sign in</h2><p>Use a sample role to preview the system interfaces.</p>
        <form id="login-form">
          <div class="form-group"><label>Role</label><select id="login-role" required>
            <option value="staff">Staff / Front Desk</option><option value="doctor">Doctor</option><option value="admin">Administrator</option><option value="patient">Patient</option>
          </select></div>
          <div class="form-group"><label>Username</label><input class="input" id="login-user" value="staff01" required></div>
          <div class="form-group"><label>Password</label><input class="input" type="password" value="prototype" required></div>
          <button class="btn btn-primary btn-block" type="submit">Sign in to prototype</button>
        </form>
        <p class="small muted" style="margin-top:18px">Prototype only — authentication is simulated locally and does not connect to a server.</p>
      </div></section>
    </div>`;
  }

  function renderPage() {
    if (!state.role) return login();
    if (state.page === "__display") return publicDisplay();

    if (state.role === "patient") {
      if (state.page === "dashboard") return layout(patientDashboard());
      if (state.page === "profile") return layout(profilePage());
      if (state.page === "records") return layout(patientRecordsPage());
      if (state.page === "queue") return layout(patientQueuePage());
      if (state.page === "information") return layout(informationPage(false));
    }
    if (state.role === "staff") {
      if (state.page === "dashboard") return layout(staffDashboard());
      if (state.page === "registration") return layout(registrationPage());
      if (state.page === "patients") return layout(patientsPage("staff"));
      if (state.page === "queue") return layout(queueManagementPage("staff"));
      if (state.page === "initial-health") return layout(initialHealthPage());
      if (state.page === "information") return layout(informationPage(true));
    }
    if (state.role === "doctor") {
      if (state.page === "dashboard") return layout(doctorDashboard());
      if (state.page === "patients") return layout(patientsPage("doctor"));
      if (state.page === "consultation") return layout(queueManagementPage("doctor"));
      if (state.page === "queue") return layout(queueManagementPage("doctor"));
    }
    if (state.role === "admin") {
      if (state.page === "dashboard") return layout(adminDashboard());
      if (state.page === "users") return layout(usersPage());
      if (state.page === "providers") return layout(providersPage());
      if (state.page === "information") return layout(informationPage(true));
      if (state.page === "settings") return layout(settingsPage());
    }
    state.page = "dashboard";
    return renderPage();
  }

  function render() {
    app.innerHTML = renderPage();
    bindEvents();
    if (state.page === "__display") startDisplayClock();
  }

  function bindEvents() {
    app.querySelectorAll("[data-action]").forEach(el => {
      el.addEventListener("click", handleAction);
    });

    const loginForm = document.getElementById("login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", e => {
        e.preventDefault();
        state.role = document.getElementById("login-role").value;
        state.page = "dashboard";
        render();
      });
      const roleSelect = document.getElementById("login-role");
      roleSelect.addEventListener("change", () => {
        const defaults = { staff: "staff01", doctor: "doctor01", admin: "admin01", patient: "patient01" };
        document.getElementById("login-user").value = defaults[roleSelect.value];
      });
    }

    const search = document.getElementById("patient-search");
    if (search) search.addEventListener("input", e => { state.search = e.target.value; render(); });

    const reg = document.getElementById("registration-form");
    if (reg) reg.addEventListener("submit", e => {
      e.preventDefault();
      const fd = new FormData(reg);
      const birthdate = fd.get("birthdate");
      const age = birthdate ? Math.max(0, Math.floor((Date.now() - new Date(birthdate)) / 31557600000)) : 0;
      const id = `P-${1000 + D.patients.length + 1}`;
      D.patients.push({ id, name: fd.get("name"), nickname: fd.get("nickname") || fd.get("name").split(" ")[0], sex: fd.get("sex"), age, birthdate, phone: fd.get("phone"), address: fd.get("address") || "Longos, Malabon City", familyNo: fd.get("familyNo") || "Pending", status: "Active", bp: "Not recorded", oxygen: "Not recorded", lastVisit: new Date().toISOString().slice(0,10) });
      D.clinicalRecords[id] = [];
      showToast(`Patient ${id} registered successfully.`);
      state.page = "patients";
      state.search = "";
    });
  }

  function handleAction(e) {
    const el = e.currentTarget, action = el.dataset.action;
    if (action === "navigate") { state.page = el.dataset.page; state.search = ""; state.sidebarOpen = false; render(); }
    if (action === "toggle-sidebar") { state.sidebarOpen = !state.sidebarOpen; render(); }
    if (action === "logout") { state.role = null; state.page = "dashboard"; render(); }
    if (action === "digital-display") { state.page = "__display"; render(); }
    if (action === "close-display") { state.page = "dashboard"; render(); }
    if (action === "close-modal") { state.modal = null; render(); }
    if (action === "open-profile-edit") { state.modal = "profile"; render(); }
    if (action === "open-patient") { state.selectedPatient = el.dataset.id; state.modal = "patient"; render(); }
    if (action === "open-consultation") { state.selectedPatient = el.dataset.id; state.modal = "consultation"; render(); }
    if (action === "edit-health") { state.selectedPatient = el.dataset.id; state.modal = "health"; render(); }
    if (action === "add-queue") { state.modal = "queue"; render(); }
    if (action === "add-service") { state.modal = "service"; render(); }
    if (action === "clear-search") { state.search = ""; render(); }
    if (action === "clear-health-search") { render(); }
    if (action === "save-profile") saveProfile();
    if (action === "save-health") saveHealth();
    if (action === "save-consultation") saveConsultation();
    if (action === "save-queue") saveQueue();
    if (action === "save-service") saveService();
    if (action === "advance-queue") advanceQueue();
    if (action === "serve-one") serveOne(el.dataset.number);
    if (action === "save-settings") showToast("Settings saved in prototype state.");
    if (action === "add-user") showToast("User creation form can be connected to the future account API.");
    if (action === "edit-user") showToast("User editing is represented in this prototype.");
    if (action === "add-provider") showToast("Provider creation form can be connected to the future provider API.");
    if (action === "edit-provider") showToast("Provider editing is represented in this prototype.");
    if (action === "info-tab") infoTab(el.dataset.tab);
  }

  function saveProfile() {
    const form = document.getElementById("profile-form"); if (!form) return;
    const fd = new FormData(form), p = D.patients[0];
    p.nickname = fd.get("nickname"); p.phone = fd.get("phone"); p.address = fd.get("address");
    state.modal = null; showToast("Profile updated in prototype state.");
  }

  function saveHealth() {
    const form = document.getElementById("health-form"); if (!form) return;
    const p = D.patients.find(x => x.id === state.selectedPatient), fd = new FormData(form);
    p.bp = fd.get("bp"); p.oxygen = fd.get("oxygen"); p.lastVisit = new Date().toISOString().slice(0,10);
    state.modal = null; showToast("Initial health information saved.");
  }

  function saveConsultation() {
    const form = document.getElementById("consultation-form"); if (!form) return;
    const p = D.patients.find(x => x.id === state.selectedPatient), fd = new FormData(form);
    const record = { date: fd.get("date"), provider: "Dr. Angela Ramos", diagnosis: fd.get("diagnosis"), prescription: fd.get("prescription"), notes: fd.get("notes") };
    D.clinicalRecords[p.id] ||= [];
    D.clinicalRecords[p.id].unshift(record);
    state.modal = null; showToast("Clinical record saved in prototype state.");
  }

  function saveQueue() {
    const form = document.getElementById("queue-form"); if (!form) return;
    const fd = new FormData(form), p = D.patients.find(x => x.id === fd.get("patientId"));
    if (D.queue.some(q => q.patientId === p.id && q.status !== "Completed")) {
      state.modal = null; showToast("This patient already has an active queue entry."); return;
    }
    D.queue.push({ number: nextQueueNumber(), patientId: p.id, patientName: p.name, nickname: p.nickname, status: "Waiting", purpose: fd.get("purpose") });
    state.modal = null; showToast(`${p.nickname} added to the queue.`);
  }

  function advanceQueue() {
    const serving = queueServing();
    if (serving) serving.status = "Completed";
    const next = waitingQueue()[0];
    if (next) next.status = "Serving";
    showToast(next ? `${next.number} is now being served.` : "No waiting patients.");
  }

  function serveOne(number) {
    const target = D.queue.find(q => q.number === number);
    const serving = queueServing();
    if (serving) serving.status = "Completed";
    if (target) target.status = "Serving";
    showToast(`${number} is now being served.`);
  }

  function infoTab(tab) {
    const panel = document.getElementById("info-panel");
    if (!panel) return;
    app.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === tab));
    if (tab === "services") panel.innerHTML = `<div class="service-grid">${D.services.map(serviceCard).join("")}</div>`;
    if (tab === "providers") panel.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Provider</th><th>Role</th><th>Schedule</th><th>Status</th></tr></thead><tbody>${D.providers.map(p => `<tr><td><strong>${esc(p.name)}</strong></td><td>${esc(p.role)}</td><td>${esc(p.schedule)}</td><td>${badge(p.status)}</td></tr>`).join("")}</tbody></table></div>`;
    if (tab === "facility") panel.innerHTML = `<div class="timeline">${D.facility.guide.map((x,i) => `<div class="timeline-item"><div class="timeline-time">${i+1}. ${esc(x[0])}</div><div>${esc(x[1])}</div></div>`).join("")}</div>`;
  }

  function startDisplayClock() {
    const tick = () => {
      const el = document.getElementById("display-clock");
      if (el) el.textContent = new Date().toLocaleTimeString([], {hour: "2-digit", minute: "2-digit", second: "2-digit"});
    };
    tick();
    clearInterval(window.__displayClock);
    window.__displayClock = setInterval(tick, 1000);
  }

  render();
})();
