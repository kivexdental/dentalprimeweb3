// Dental CRM - Unified Application Controller
let statusPieChartInstance = null;
let monthlyBarChartInstance = null;
let paymentModePieInstance = null;
let currentToken = null;
let currentUser = null;
let currentUserRole = 'admin';
let allBookingsList = [];
let allBillingQueueBookings = [];

// Clinical Consultation & Doctor's Note State
let currentConsultationPatient = null;
let selectedToothTreatments = {}; // { '16': [{ service: 'Filling', price: 1500, category: 'Restorative' }] }
let prescribedMedicinesList = [];  // [{ name: 'Amoxicillin 500mg', category: 'Dental', dosage: '1-0-1', duration: '5 Days' }]
let availableDentalServices = [];
let paymentLineItems = [];

// Canvas Drawing State
let rxCanvas = null;
let rxCtx = null;
let isDrawing = false;
let currentPenColor = '#03090D';
let currentPenWidth = 4;
let isEraserMode = false;

// 32 Adult Teeth Definition (FDI Two-Digit Notation)
const ADULT_TEETH = {
  Q1: [ // Upper Right
    { num: 18, name: 'Third Molar (Wisdom)', loc: 'Upper Right' },
    { num: 17, name: 'Second Molar', loc: 'Upper Right' },
    { num: 16, name: 'First Molar', loc: 'Upper Right' },
    { num: 15, name: 'Second Premolar', loc: 'Upper Right' },
    { num: 14, name: 'First Premolar', loc: 'Upper Right' },
    { num: 13, name: 'Canine', loc: 'Upper Right' },
    { num: 12, name: 'Lateral Incisor', loc: 'Upper Right' },
    { num: 11, name: 'Central Incisor', loc: 'Upper Right' }
  ],
  Q2: [ // Upper Left
    { num: 21, name: 'Central Incisor', loc: 'Upper Left' },
    { num: 22, name: 'Lateral Incisor', loc: 'Upper Left' },
    { num: 23, name: 'Canine', loc: 'Upper Left' },
    { num: 24, name: 'First Premolar', loc: 'Upper Left' },
    { num: 25, name: 'Second Premolar', loc: 'Upper Left' },
    { num: 26, name: 'First Molar', loc: 'Upper Left' },
    { num: 27, name: 'Second Molar', loc: 'Upper Left' },
    { num: 28, name: 'Third Molar (Wisdom)', loc: 'Upper Left' },
    { num: 'EXTRA_U', isExtra: true, name: 'Extra Tooth (Supernumerary)', loc: 'Upper Jaw (Extra)' }
  ],
  Q4: [ // Lower Right
    { num: 48, name: 'Third Molar (Wisdom)', loc: 'Lower Right' },
    { num: 47, name: 'Second Molar', loc: 'Lower Right' },
    { num: 46, name: 'First Molar', loc: 'Lower Right' },
    { num: 45, name: 'Second Premolar', loc: 'Lower Right' },
    { num: 44, name: 'First Premolar', loc: 'Lower Right' },
    { num: 43, name: 'Canine', loc: 'Lower Right' },
    { num: 42, name: 'Lateral Incisor', loc: 'Lower Right' },
    { num: 41, name: 'Central Incisor', loc: 'Lower Right' }
  ],
  Q3: [ // Lower Left
    { num: 31, name: 'Central Incisor', loc: 'Lower Left' },
    { num: 32, name: 'Lateral Incisor', loc: 'Lower Left' },
    { num: 33, name: 'Canine', loc: 'Lower Left' },
    { num: 34, name: 'First Premolar', loc: 'Lower Left' },
    { num: 35, name: 'Second Premolar', loc: 'Lower Left' },
    { num: 36, name: 'First Molar', loc: 'Lower Left' },
    { num: 37, name: 'Second Molar', loc: 'Lower Left' },
    { num: 38, name: 'Third Molar (Wisdom)', loc: 'Lower Left' },
    { num: 'EXTRA_L', isExtra: true, name: 'Extra Tooth (Supernumerary)', loc: 'Lower Jaw (Extra)' }
  ]
};

// ========================================================
// INITIALIZATION
// ========================================================
document.addEventListener('DOMContentLoaded', async () => {
  currentToken = checkAuthToken();
  initUserRoleUI();

  // Navigation Links
  const navLinks = document.querySelectorAll('.nav-item-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = link.getAttribute('data-view');
      switchView(targetView);
    });
  });

  // Global Search input handler
  const globalSearchInput = document.getElementById('globalSearchInput');
  if (globalSearchInput) {
    globalSearchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (q.length > 0) {
        switchView('patients');
        const pSearch = document.getElementById('patientSearchInput');
        if (pSearch) { pSearch.value = q; fetchPatientsList(); }
      }
    });
  }

  // Filter event listeners
  document.getElementById('patientSearchInput')?.addEventListener('input', fetchPatientsList);
  document.getElementById('onlineSearchInput')?.addEventListener('input', fetchOnlineBookings);
  document.getElementById('onlineStatusFilter')?.addEventListener('change', fetchOnlineBookings);
  document.getElementById('walkinSearchInput')?.addEventListener('input', fetchWalkinBookings);
  document.getElementById('walkinStatusFilter')?.addEventListener('change', fetchWalkinBookings);
  document.getElementById('paymentSearchInput')?.addEventListener('input', renderFinancePayments);
  document.getElementById('serviceSearchInput')?.addEventListener('input', filterServicesCatalog);

  // Sidebar mobile toggle
  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', () => {
      document.getElementById('appSidebar').classList.toggle('d-none');
    });
  }

  // Auto Refresh (30s)
  setInterval(() => {
    const isChecked = document.getElementById('autoRefreshToggle')?.checked;
    if (isChecked) {
      loadDashboardStats();
      if (!document.getElementById('onlineBookingsView').classList.contains('d-none')) fetchOnlineBookings();
      if (!document.getElementById('walkinBookingsView').classList.contains('d-none')) fetchWalkinBookings();
    }
  }, 30000);

  // Initialize Modules
  await loadDentalServicesData();
  initTeethChart();
  initPrescriptionCanvas();
  initNextAppointmentDate();
  renderQuickMedicines();
  renderMedicineSettings();
  initClinicalNotesCharCount();
  renderQuickProcedures();
  renderQuickProceduresSettings();
  recalculateDoctorBilling();
  setupFormHandlers();
  initIndianPhoneSanitizer();


  // Initial Data Load
  await loadDashboardStats();
  await fetchOnlineBookings();
  await fetchWalkinBookings();
  await loadDoctorsDropdown();
  await loadClinicSettings();
  await loadSystemUsers();
  await updateBillingDeskBadge();
});

function initUserRoleUI() {
  const userStr = localStorage.getItem('dental_user');
  let user = null;
  if (userStr) {
    try { user = JSON.parse(userStr); } catch (e) {}
  }
  if (user) {
    currentUser = user;
    currentUserRole = user.role || 'admin';
    const adminNameEl = document.getElementById('headerAdminName');
    const adminRoleEl = document.getElementById('headerAdminRole');
    if (adminNameEl) {
      adminNameEl.innerText = user.name || user.username || 'Administrator';
    }
    if (adminRoleEl) {
      if (currentUserRole === 'admin') adminRoleEl.innerText = 'CRM Admin';
      else if (currentUserRole === 'doctor') adminRoleEl.innerText = 'Consulting Dental Surgeon';
      else adminRoleEl.innerText = 'Clinic Staff';
    }

    // Auto-update attending doctor in banner & workspace immediately
    updateAttendingDoctorDisplay();

    // Admin, doctor, and staff all have access to all tabs and features
    const tabDeleted = document.getElementById('tabDeletedPatients');
    const btnProfileDel = document.getElementById('btnProfileSoftDelete');
    if (tabDeleted) tabDeleted.classList.remove('d-none');
    if (btnProfileDel) btnProfileDel.classList.remove('d-none');

    // Finance section is accessible to all roles
    const navFinance = document.getElementById('navItemFinance') || document.querySelector('[data-view="finance"]');
    if (navFinance) navFinance.classList.remove('d-none');

    // Auto-switch to Doctor's Note if requested by URL hash
    if (window.location.hash === '#doctors-note') {
      setTimeout(() => switchView('doctors-note'), 60);
    }
  } else {
    updateAttendingDoctorDisplay();
  }
}

function getAttendingDoctorName(bookingDoctor, isPrint = false) {
  // Whoever is logged in, their login name is dynamically attributed on prescriptions, diagnosis, and receipts
  if (currentUser) {
    const uName = (currentUser.name || currentUser.username || '').trim();
    if (uName) return uName;
  }
  if (bookingDoctor && bookingDoctor !== 'Unassigned' && bookingDoctor !== 'Any Doctor' && bookingDoctor !== 'Doctor') {
    return bookingDoctor;
  }
  return 'Attending Practitioner';
}

function updateAttendingDoctorDisplay(bookingDoctor) {
  const docEl = document.getElementById('dn_banner_doctor');
  const badgeEl = document.getElementById('dn_banner_doctor_badge');
  const docName = getAttendingDoctorName(bookingDoctor);

  if (docEl) {
    docEl.innerHTML = `<i class="fa-solid fa-user-doctor text-primary me-1"></i>${escapeHtml(docName)}`;
  }
  if (badgeEl) {
    const roleLabel = currentUser?.role === 'doctor' ? 'Doctor' : (currentUser?.role === 'staff' ? 'Staff' : 'Admin');
    badgeEl.className = 'badge bg-primary-subtle text-primary border border-primary-subtle ms-1';
    badgeEl.innerHTML = `<i class="fa-solid fa-circle-check me-1"></i>Logged-in ${roleLabel}`;
  }
}

// ========================================================
// 1. NAVIGATION & VIEW ROUTING
// ========================================================
function switchView(viewName) {
  const allViews = document.querySelectorAll('.app-view');

  allViews.forEach(v => v.classList.add('d-none'));

  const navLinks = document.querySelectorAll('.nav-item-link');
  navLinks.forEach(l => l.classList.remove('active'));

  const activeLink = document.querySelector(`.nav-item-link[data-view="${viewName}"]`);
  if (activeLink) activeLink.classList.add('active');

  if (viewName === 'dashboard') {
    document.getElementById('dashboardView')?.classList.remove('d-none');
    loadDashboardStats();
  } else if (viewName === 'patients') {
    document.getElementById('patientsView')?.classList.remove('d-none');
    fetchPatientsList();
  } else if (viewName === 'online') {
    document.getElementById('onlineBookingsView')?.classList.remove('d-none');
    fetchOnlineBookings();
  } else if (viewName === 'walkin') {
    document.getElementById('walkinBookingsView')?.classList.remove('d-none');
    fetchWalkinBookings();
  } else if (viewName === 'doctors-note') {
    document.getElementById('doctorsNoteView')?.classList.remove('d-none');
    populateDoctorPatientSelector();
    renderQuickMedicines();
    initMultiDateCalendar();
    initClinicalNotesCharCount();
    recalculateDoctorBilling();
    setTimeout(() => { resizeCanvas(); }, 150);
  } else if (viewName === 'payment-desk') {
    document.getElementById('paymentDeskView')?.classList.remove('d-none');
    loadPaymentDesk();
  } else if (viewName === 'services') {
    document.getElementById('servicesView')?.classList.remove('d-none');
    loadServicesCatalog();
  } else if (viewName === 'finance') {
    document.getElementById('financeView')?.classList.remove('d-none');
    loadFinanceOverview();
    renderFinancePayments();
    renderFinanceExpenses();
    renderOutstandingBalances();
  } else if (viewName === 'notifications') {
    document.getElementById('notificationsView')?.classList.remove('d-none');
    loadNotificationCenter();
  } else if (viewName === 'settings') {
    document.getElementById('settingsView')?.classList.remove('d-none');
    loadClinicSettings();
    renderMedicineSettings();
    loadSystemUsers();
  }
}

// ========================================================
// 2. DASHBOARD OVERVIEW & STATS
// ========================================================
async function loadDashboardStats() {
  try {
    const res = await fetch('/api/reports/stats', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const data = await res.json();
    if (data.success && data.stats) {
      const s = data.stats;
      const todayWalkin = document.getElementById('cardTodayWalkin');
      const todayOnline = document.getElementById('cardTodayOnline');
      const totalPatients = document.getElementById('cardTotalPatients');
      const totalRev = document.getElementById('cardTotalRevenue');

      if (todayWalkin) todayWalkin.innerText = s.todayWalkIn;
      if (todayOnline) todayOnline.innerText = s.todayOnline;
      if (totalPatients) totalPatients.innerText = s.monthlyPatients || 0;
      if (totalRev) totalRev.innerText = formatINR(s.totalRevenue);

      // Render Status Pie Chart
      const pieCtx = document.getElementById('statusPieChart')?.getContext('2d');
      if (pieCtx && data.charts?.statusPie) {
        if (statusPieChartInstance) statusPieChartInstance.destroy();
        statusPieChartInstance = new Chart(pieCtx, {
          type: 'doughnut',
          data: {
            labels: data.charts.statusPie.labels,
            datasets: [{
              data: data.charts.statusPie.data,
              backgroundColor: ['#779580', '#C2644F', '#83A9D0'],
              borderWidth: 2
            }]
          },
          options: { responsive: true, maintainAspectRatio: false }
        });
      }

      // Render Monthly Bar Chart
      const barCtx = document.getElementById('monthlyBarChart')?.getContext('2d');
      if (barCtx && data.charts?.monthlyBar) {
        if (monthlyBarChartInstance) monthlyBarChartInstance.destroy();
        monthlyBarChartInstance = new Chart(barCtx, {
          type: 'bar',
          data: {
            labels: data.charts.monthlyBar.labels,
            datasets: [{
              label: 'Consultations',
              data: data.charts.monthlyBar.data,
              backgroundColor: '#C2644F',
              borderRadius: 6
            }]
          },
          options: { responsive: true, maintainAspectRatio: false }
        });
      }
    }
  } catch (e) {
    console.error('Error loading dashboard stats:', e);
  }
}

// ========================================================
// 3. WORKFLOW: ONLINE BOOKINGS & STAFF APPROVAL
// ========================================================
async function fetchOnlineBookings() {
  const search = document.getElementById('onlineSearchInput')?.value || '';
  const status = document.getElementById('onlineStatusFilter')?.value || '';

  try {
    const query = new URLSearchParams({ search, status, type: 'Online' }).toString();
    const res = await fetch(`/api/bookings?${query}`, {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const data = await res.json();
    if (data.success && data.bookings) {
      renderOnlineBookingsTable(data.bookings);
      
      const pendingCount = data.bookings.filter(b => b.status === 'Pending').length;
      const badge = document.getElementById('onlinePendingBadge');
      if (badge) badge.innerText = `${pendingCount} Pending Approval`;
      const sideBadge = document.getElementById('sidebarOnlineBadge');
      if (sideBadge) sideBadge.innerText = pendingCount;
    }
  } catch (e) {
    console.error('Error fetching online bookings:', e);
  }
}

function renderOnlineBookingsTable(bookings) {
  const tbody = document.getElementById('onlineBookingsTbody');
  if (!tbody) return;

  if (bookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">No online appointments found.</td></tr>`;
    return;
  }

  tbody.innerHTML = bookings.map(b => {
    const isPending = b.status === 'Pending';
    const statusBadge = isPending 
      ? '<span class="badge bg-warning text-dark px-2 py-1"><i class="fa-solid fa-clock me-1"></i>Awaiting Approval</span>'
      : '<span class="badge bg-success text-white px-2 py-1"><i class="fa-solid fa-check me-1"></i>Approved</span>';

    return `
      <tr class="online-booking-row" style="cursor: context-menu;"
          oncontextmenu="openOnlineContextMenu(event, ${b.id}, '${escapeHtml(b.patient_name)}', '${escapeHtml(b.doctor_name || '')}', '${escapeHtml(b.service_name || '')}', '${escapeHtml(b.phone || '')}', '${escapeHtml(b.booking_for || 'Self')}')">
        <td><strong class="text-dark">${b.booking_code}</strong></td>
        <td>
          <div class="fw-semibold text-dark">${escapeHtml(b.patient_name)}</div>
          <small class="text-muted">${b.email || 'No email'}</small>
        </td>
        <td><a href="tel:${b.phone}" class="text-decoration-none text-muted">${b.phone}</a></td>
        <td><span class="badge bg-light text-dark border">${escapeHtml(b.service_name)}</span></td>
        <td>
          <div class="small fw-semibold">${b.booking_date}</div>
          <small class="text-muted">${b.booking_time}</small>
        </td>
        <td>
          <span class="badge bg-primary-subtle text-primary border border-primary-subtle">
            ${b.booking_for || 'Self'}
          </span>
        </td>
        <td>${statusBadge}</td>
        <td class="text-center">
          ${isPending ? `
            <div class="d-flex justify-content-center gap-1">
              <button class="btn btn-sm btn-success px-2 py-1 fw-bold rounded-pill" onclick="openConvertWalkinModal(${b.id}, '${escapeHtml(b.patient_name)}', '${escapeHtml(b.doctor_name || '')}', '${escapeHtml(b.service_name || '')}', '${escapeHtml(b.phone || '')}', '${escapeHtml(b.booking_for || 'Self')}')" title="Right-click row or click here to transfer to Walk-In Queue with Concerned Doctor">
                <i class="fa-solid fa-person-walking-arrow-right me-1"></i> Check In
              </button>
              <button class="btn btn-sm btn-outline-secondary px-2 py-1 rounded-pill" onclick="approveOnlineBooking(${b.id}, '${escapeHtml(b.patient_name)}')" title="Quick Approve">
                <i class="fa-solid fa-check"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger px-2 py-1 rounded-pill" onclick="cancelBookingAction(${b.id}, '${escapeHtml(b.patient_name)}')" title="Cancel Appointment">
                <i class="fa-solid fa-xmark me-1"></i> Cancel
              </button>
            </div>
          ` : `
            <div class="d-flex justify-content-center gap-1">
              <button class="btn btn-sm btn-outline-primary rounded-pill" onclick="startConsultationForBooking(${b.id})">
                <i class="fa-solid fa-stethoscope me-1"></i> Doctor's Note
              </button>
              <button class="btn btn-sm btn-outline-danger px-2 py-1 rounded-pill" onclick="cancelBookingAction(${b.id}, '${escapeHtml(b.patient_name)}')" title="Cancel Appointment">
                <i class="fa-solid fa-xmark me-1"></i> Cancel
              </button>
            </div>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

async function cancelBookingAction(bookingId, patientName) {
  if (!confirm(`Are you sure you want to cancel the appointment for ${patientName}?`)) return;
  try {
    const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      }
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Appointment for ${patientName} has been cancelled.`, 'info');
      fetchOnlineBookings();
      fetchWalkinBookings();
      loadDashboardStats();
    } else {
      showToast(data.message || 'Failed to cancel appointment.', 'danger');
    }
  } catch (e) {
    showToast('Failed to cancel appointment.', 'danger');
  }
}
window.cancelBookingAction = cancelBookingAction;


async function approveOnlineBooking(bookingId, patientName) {
  try {
    const res = await fetch(`/api/bookings/${bookingId}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      }
    });
    const data = await res.json();
    if (data.success) {
      const token = data.booking?.visual_token || 'Assigned';
      document.getElementById('approveModalMessage').innerText =
        `Online booking for ${patientName} is approved! Token ${token} assigned and moved to Patient Queue.`;
      new bootstrap.Modal(document.getElementById('approveModal')).show();
      fetchOnlineBookings();
      fetchWalkinBookings();
      populateDoctorPatientSelector();
    } else {
      showToast(data.message || 'Error approving booking.', 'danger');
    }
  } catch (e) {
    showToast('Failed to approve online booking.', 'danger');
  }
}

// ========================================================
// 3b. ONLINE-TO-WALKIN CONVERSION & CONTEXT MENU
// ========================================================
let activeContextMenuBooking = null;

function openOnlineContextMenu(e, bookingId, patientName, doctorName, service, phone, relation) {
  e.preventDefault();
  activeContextMenuBooking = { id: bookingId, name: patientName, doctor: doctorName, service, phone, relation };
  
  const menu = document.getElementById('bookingContextMenu');
  if (!menu) return;

  const label = document.getElementById('ctxMenuBookingLabel');
  if (label) label.innerText = `${patientName} (${relation || 'Self'})`;

  const btnConvert = document.getElementById('ctxConvertWalkin');
  if (btnConvert) {
    btnConvert.onclick = () => {
      closeContextMenu();
      openConvertWalkinModal(bookingId, patientName, doctorName, service, phone, relation);
    };
  }

  const btnAssign = document.getElementById('ctxAssignDoctor');
  if (btnAssign) {
    btnAssign.onclick = () => {
      closeContextMenu();
      openConvertWalkinModal(bookingId, patientName, doctorName, service, phone, relation);
    };
  }

  const btnNote = document.getElementById('ctxDoctorNote');
  if (btnNote) {
    btnNote.onclick = () => {
      closeContextMenu();
      startConsultationForBooking(bookingId);
    };
  }



  const btnCancel = document.getElementById('ctxCancelBooking');
  if (btnCancel) {
    btnCancel.onclick = () => {
      closeContextMenu();
      cancelBookingFromList(bookingId);
    };
  }

  menu.style.display = 'block';
  const x = Math.min(e.clientX, window.innerWidth - 240);
  const y = Math.min(e.clientY, window.innerHeight - 220);
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
}

function closeContextMenu() {
  const menu = document.getElementById('bookingContextMenu');
  if (menu) menu.style.display = 'none';
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('#bookingContextMenu')) {
    closeContextMenu();
  }
});

function openConvertWalkinModal(bookingId, patientName, docName, service, phone, relation) {
  document.getElementById('cwModalBookingId').value = bookingId;
  document.getElementById('cwModalPatientName').innerText = patientName || 'Patient';
  document.getElementById('cwModalPhone').innerText = phone || '-';
  document.getElementById('cwModalRelation').innerText = relation || 'Self';
  document.getElementById('cwModalService').innerText = service || 'General Dental Service';

  const docSelect = document.getElementById('cwModalDoctorSelect');
  if (docSelect && docName) {
    for (let opt of docSelect.options) {
      if (opt.value === docName) opt.selected = true;
    }
  }

  const modalEl = document.getElementById('convertWalkinModal');
  if (modalEl) {
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }
}

async function executeConvertWalkin() {
  const bookingId = document.getElementById('cwModalBookingId')?.value;
  const doctorName = document.getElementById('cwModalDoctorSelect')?.value || 'Dr. Alexander Wright';

  if (!bookingId) return;

  try {
    const res = await fetch(`/api/bookings/${bookingId}/convert-walkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify({ doctor_name: doctorName })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`✔ Check-in Success! Token ${data.booking?.visual_token || 'Assigned'} assigned to ${doctorName}`, 'success');
      const modalEl = document.getElementById('convertWalkinModal');
      if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();
      fetchOnlineBookings();
      fetchWalkinBookings();
      loadDashboardStats();
    } else {
      showToast(data.message || 'Failed to convert to walk-in.', 'danger');
    }
  } catch (err) {
    console.error('Error converting to walk-in:', err);
    showToast('Network error converting booking to walk-in queue.', 'danger');
  }
}

// ========================================================
// 4. WORKFLOW: WALK-IN BOOKINGS & PATIENT QUEUE
// ========================================================
async function fetchWalkinBookings() {
  const search = document.getElementById('walkinSearchInput')?.value || '';
  const status = document.getElementById('walkinStatusFilter')?.value || '';

  try {
    const query = new URLSearchParams({ search, status, type: 'Walk-In' }).toString();
    const res = await fetch(`/api/bookings?${query}`, {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const data = await res.json();
    if (data.success && data.bookings) {
      renderWalkinBookingsTable(data.bookings);
      
      const waitingCount = data.bookings.filter(b => b.status !== 'Completed').length;
      const badge = document.getElementById('walkinWaitingBadge');
      if (badge) badge.innerText = `${waitingCount} Waiting in Queue`;
      const sideBadge = document.getElementById('sidebarWalkinBadge');
      if (sideBadge) sideBadge.innerText = waitingCount;

      // Also refresh recent mini queue in dashboard
      renderRecentBookingsTable(data.bookings.slice(0, 5));
    }
  } catch (e) {
    console.error('Error fetching walk-in queue:', e);
  }
}

function renderWalkinBookingsTable(bookings) {
  const tbody = document.getElementById('walkinBookingsTbody');
  if (!tbody) return;

  if (bookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4">No patients currently in walk-in queue.</td></tr>`;
    return;
  }

  tbody.innerHTML = bookings.map(b => {
    const isCompleted = b.status === 'Completed';
    const statusBadge = isCompleted
      ? '<span class="badge bg-success-subtle text-success">Completed</span>'
      : '<span class="badge bg-warning-subtle text-warning">Waiting in Queue</span>';

    return `
      <tr>
        <td><span class="badge bg-danger fs-6 px-2 py-1">${b.visual_token}</span></td>
        <td><small class="fw-bold text-muted">${b.booking_code}</small></td>
        <td>
          <div class="fw-semibold text-dark">${escapeHtml(b.patient_name)}</div>
          <small class="text-muted">${b.phone}</small>
        </td>
        <td>${b.phone}</td>
        <td><span class="badge bg-light text-dark border">${escapeHtml(b.service_name)}</span></td>
        <td><small class="text-dark">${escapeHtml(b.doctor_name || 'Dr. Alexander Wright')}</small></td>
        <td><small class="text-muted">${b.booking_time}</small></td>
        <td>${statusBadge}</td>
        <td class="text-center">
          ${!isCompleted ? `
            <div class="d-flex justify-content-center gap-1">
              <button class="btn btn-sm btn-primary-custom px-2 px-md-3" onclick="startConsultationForBooking(${b.id})">
                <i class="fa-solid fa-stethoscope me-1"></i> Start Consultation
              </button>
              <button class="btn btn-sm btn-outline-danger px-2 rounded-pill" onclick="cancelBookingAction(${b.id}, '${escapeHtml(b.patient_name)}')" title="Cancel Walk-In Booking">
                <i class="fa-solid fa-xmark me-1"></i> Cancel
              </button>
            </div>
          ` : `
            <span class="text-success small fw-semibold"><i class="fa-solid fa-check-circle me-1"></i>Finished</span>
          `}
        </td>
      </tr>
    `;
  }).join('');

}

function renderRecentBookingsTable(bookings) {
  const tbody = document.getElementById('recentBookingsTbody');
  if (!tbody) return;
  if (bookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-3">No active queue entries.</td></tr>`;
    return;
  }
  tbody.innerHTML = bookings.map(b => `
    <tr>
      <td><span class="badge bg-light text-dark border fw-bold">${b.visual_token}</span></td>
      <td><strong>${b.booking_code}</strong></td>
      <td>${escapeHtml(b.patient_name)}</td>
      <td><span class="badge bg-light text-dark border">${escapeHtml(b.service_name)}</span></td>
      <td><span class="badge bg-secondary-subtle text-dark">${b.booking_type}</span></td>
      <td><span class="badge ${b.status === 'Completed' ? 'bg-success' : 'bg-warning text-dark'}">${b.status}</span></td>
      <td>
        <button class="btn btn-sm btn-outline-danger py-0 px-2" onclick="startConsultationForBooking(${b.id})">
          <i class="fa-solid fa-stethoscope"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// ========================================================
// 5. WORKFLOW: DOCTOR'S NOTE CONSULTATION WORKSPACE
// ========================================================
async function loadDentalServicesData() {
  try {
    const res = await fetch('/api/services');
    const data = await res.json();
    if (data.success && data.services) {
      availableDentalServices = data.services;
    }
  } catch (e) {
    console.error('Error loading dental services catalog:', e);
  }
}

// Populate Patient Selector in Doctor's Note
async function populateDoctorPatientSelector() {
  const select = document.getElementById('dn_patient_select');
  if (!select) return;

  try {
    const res = await fetch('/api/bookings?status=Pending', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const data = await res.json();
    const curVal = select.value;
    select.innerHTML = '<option value="">-- Select Patient from Queue --</option>';

    if (data.success && data.bookings) {
      data.bookings.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.id;
        opt.textContent = `Token: ${b.visual_token} — ${b.patient_name} (${b.service_name})`;
        select.appendChild(opt);
      });
    }

    if (currentConsultationPatient) {
      select.value = currentConsultationPatient.id;
    } else if (curVal) {
      select.value = curVal;
    }
  } catch (e) {
    console.error('Error populating patient selector:', e);
  }
}

// Select a patient in chair
async function onDoctorSelectPatient(bookingId) {
  if (!bookingId) {
    currentConsultationPatient = null;
    updateDoctorPatientBanner(null);
    return;
  }

  try {
    const res = await fetch(`/api/bookings?search=`, {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const data = await res.json();
    if (data.success && data.bookings) {
      const b = data.bookings.find(item => item.id === parseInt(bookingId));
      if (b) {
        currentConsultationPatient = b;
        updateDoctorPatientBanner(b);
      }
    }
  } catch (e) {
    console.error('Error selecting patient in chair:', e);
  }
}

function startConsultationForBooking(bookingId) {
  switchView('doctors-note');
  const sel = document.getElementById('dn_patient_select');
  if (sel) {
    sel.value = bookingId;
  }
  onDoctorSelectPatient(bookingId);
}

function updateDoctorPatientBanner(b) {
  updateAttendingDoctorDisplay(b ? b.doctor_name : null);

  if (!b) {
    document.getElementById('dn_banner_name').innerText = 'No Patient in Chair';
    document.getElementById('dn_banner_contact').innerText = 'Select a patient from the queue above';
    document.getElementById('dn_banner_token').innerHTML = '<i class="fa-solid fa-ticket me-1"></i>Token: -';
    document.getElementById('dn_banner_code').innerHTML = '<i class="fa-solid fa-id-badge me-1"></i>Code: -';
    document.getElementById('dn_banner_blood').innerHTML = '<i class="fa-solid fa-droplet text-danger me-1"></i>Blood: -';
    document.getElementById('dn_banner_allergies').innerHTML = '<i class="fa-solid fa-triangle-exclamation me-1"></i>Allergies: None';
    document.getElementById('dn_banner_medical').innerHTML = '<i class="fa-solid fa-notes-medical me-1"></i>History: None';
    return;
  }

  document.getElementById('dn_banner_name').innerText = b.patient_name;
  document.getElementById('dn_banner_contact').innerText = `Phone: ${b.phone} | Booked for: ${b.service_name}`;
  document.getElementById('dn_banner_token').innerHTML = `<i class="fa-solid fa-ticket me-1"></i>Token: ${b.visual_token}`;
  document.getElementById('dn_banner_code').innerHTML = `<i class="fa-solid fa-id-badge me-1"></i>${b.booking_code}`;

  // Fetch patient medical record details by phone
  fetch(`/api/patients?search=${encodeURIComponent(b.phone)}`, {
    headers: { 'Authorization': `Bearer ${currentToken}` }
  })
  .then(r => r.json())
  .then(data => {
    if (data.success && data.patients && data.patients.length > 0) {
      const p = data.patients[0];
      document.getElementById('dn_banner_blood').innerHTML = `<i class="fa-solid fa-droplet text-danger me-1"></i>Blood: ${p.blood_group || 'O+'}`;
      document.getElementById('dn_banner_allergies').innerHTML = `<i class="fa-solid fa-triangle-exclamation me-1"></i>Allergies: ${p.allergy || 'None'}`;
      document.getElementById('dn_banner_medical').innerHTML = `<i class="fa-solid fa-notes-medical me-1"></i>History: ${p.medical_history || 'None'}`;
    }
  })
  .catch(() => {});
}

// ========================================================
// 6. INTERACTIVE TEETH CHART LOGIC (Adult 32 Teeth + Extra Supernumerary)
// ========================================================
let teethMultiSelectMode = false;
let selectedTeethForBatch = new Set();

function toggleTeethMultiSelectMode() {
  teethMultiSelectMode = !teethMultiSelectMode;
  const btn = document.getElementById('btnToggleMultiSelect');
  const txt = document.getElementById('multiSelectModeText');
  const batchBtn = document.getElementById('btnApplyBatchTreatments');
  
  if (teethMultiSelectMode) {
    if (btn) btn.className = 'btn btn-primary btn-sm';
    if (txt) txt.innerText = 'Exit Multi-Select';
    if (batchBtn) batchBtn.classList.remove('d-none');
    showToast('Multi-Select Mode active. Click any teeth (including Extra teeth) to select multiple!', 'info');
  } else {
    if (btn) btn.className = 'btn btn-outline-primary btn-sm';
    if (txt) txt.innerText = 'Multi-Select Mode';
    if (batchBtn) batchBtn.classList.add('d-none');
    selectedTeethForBatch.clear();
    document.querySelectorAll('.tooth-item.multi-selected').forEach(el => el.classList.remove('multi-selected'));
    updateBatchBadge();
  }
}
window.toggleTeethMultiSelectMode = toggleTeethMultiSelectMode;

function toggleTeethChartMultiSelect(toothNum, name, loc) {
  const el = document.getElementById(`tooth_box_${toothNum}`);
  if (selectedTeethForBatch.has(toothNum)) {
    selectedTeethForBatch.delete(toothNum);
    if (el) el.classList.remove('multi-selected');
  } else {
    selectedTeethForBatch.add(toothNum);
    if (el) el.classList.add('multi-selected');
  }
  updateBatchBadge();
}

function updateBatchBadge() {
  const countBadge = document.getElementById('batchCountBadge');
  if (countBadge) countBadge.innerText = selectedTeethForBatch.size;
  const batchBtn = document.getElementById('btnApplyBatchTreatments');
  if (batchBtn) {
    if (selectedTeethForBatch.size > 0) {
      batchBtn.classList.remove('d-none');
    } else if (!teethMultiSelectMode) {
      batchBtn.classList.add('d-none');
    }
  }
}

function openBatchTreatmentModal() {
  if (selectedTeethForBatch.size === 0) {
    showToast('Please click teeth on the chart to select them first.', 'warning');
    return;
  }
  const firstToothNum = Array.from(selectedTeethForBatch)[0];
  let toothObj = null;
  ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
    const found = ADULT_TEETH[q].find(t => t.num === firstToothNum);
    if (found) toothObj = found;
  });
  const tName = toothObj ? toothObj.name : 'Selected Teeth';
  const tLoc = toothObj ? toothObj.loc : 'Dental Arch';
  
  openToothTreatmentModal(firstToothNum, tName, tLoc);
  selectedTeethForBatch.forEach(num => {
    if (num !== firstToothNum) {
      selectedBatchTeethNumbers.add(num);
    }
  });
  renderMiniOdontogramInModal(firstToothNum);
  updateModalTotalPreview();
}
window.openBatchTreatmentModal = openBatchTreatmentModal;

function initTeethChart() {
  ['Q1', 'Q2', 'Q3', 'Q4'].forEach(qKey => {
    const container = document.getElementById(`teeth${qKey}`);
    if (!container) return;
    container.innerHTML = '';

    ADULT_TEETH[qKey].forEach(t => {
      const item = document.createElement('div');
      item.className = 'tooth-item';
      item.id = `tooth_box_${t.num}`;
      item.title = t.isExtra ? 'Extra Tooth (Supernumerary)' : `Tooth ${t.num}: ${t.loc} ${t.name}`;
      
      item.onclick = (e) => {
        if (teethMultiSelectMode || e.shiftKey || e.ctrlKey) {
          toggleTeethChartMultiSelect(t.num, t.name, t.loc);
        } else {
          openToothTreatmentModal(t.num, t.name, t.loc);
        }
      };

      const numDisplay = t.isExtra
        ? `<span class="tooth-num text-warning fw-bold" style="font-size: 0.65rem;"><i class="fa-solid fa-plus"></i> Extra</span>`
        : `<span class="tooth-num">${t.num}</span>`;
      const iconStyle = t.isExtra ? 'style="color: #f59e0b;"' : '';

      item.innerHTML = `
        ${numDisplay}
        <i class="fa-solid fa-tooth tooth-icon" ${iconStyle}></i>
        <span class="tooth-indicator" id="tooth_ind_${t.num}">OK</span>
      `;
      container.appendChild(item);
    });
  });
}

// ========================================================
// 6b. ENHANCED TOOTH MODAL (MATCHING ODONTOGRAM AESTHETIC)
// ========================================================
let currentModalToothNum = null;
let selectedBatchTeethNumbers = new Set();
let selectedToothSurfaces = new Set(['ALL']);

// Open popup when doctor clicks a tooth
function openToothTreatmentModal(toothNum, toothName, quadrant) {
  currentModalToothNum = toothNum;
  selectedBatchTeethNumbers.clear();
  selectedToothSurfaces = new Set(['ALL']);

  const isExtraTooth = (toothNum === 'EXTRA_U' || toothNum === 'EXTRA_L');
  const modalTitle = isExtraTooth
    ? `<i class="fa-solid fa-plus me-2 text-warning"></i>Extra Tooth (Supernumerary)`
    : `<i class="fa-solid fa-tooth me-2 text-danger"></i>Tooth ${toothNum}`;

  document.getElementById('tt_modal_title').innerHTML = modalTitle;
  document.getElementById('tt_modal_subtitle').innerText = `${quadrant} — ${toothName}`;
  document.getElementById('tt_tooth_num').value = toothNum;
  document.getElementById('tt_tooth_name').value = toothName;
  document.getElementById('tt_tooth_quadrant').value = quadrant;

  // Update Hero Showcase Card
  const showcaseNum = document.getElementById('tt_showcase_num');
  const showcaseName = document.getElementById('tt_showcase_name');
  const showcaseQuad = document.getElementById('tt_showcase_quadrant');
  const showcaseFdi = document.getElementById('tt_showcase_fdi');
  const showcaseBadge = document.getElementById('tt_showcase_badge');

  if (showcaseNum) showcaseNum.innerText = isExtraTooth ? 'Extra' : toothNum;
  if (showcaseName) showcaseName.innerText = toothName;
  if (showcaseQuad) showcaseQuad.innerText = quadrant;
  if (showcaseFdi) showcaseFdi.innerText = isExtraTooth ? 'Additional Tooth (No FDI Number)' : `FDI 2-Digit Notation: Tooth #${toothNum}`;
  if (showcaseBadge) {

    const isTreated = selectedToothTreatments[toothNum] && selectedToothTreatments[toothNum].length > 0;
    showcaseBadge.innerText = isTreated ? `${selectedToothTreatments[toothNum].length} Assigned` : 'OK';
  }

  // Reset Tooth Surface Chips
  document.querySelectorAll('.surface-chip').forEach(c => c.classList.remove('active'));
  document.getElementById('surf_ALL')?.classList.add('active');
  const surfDesc = document.getElementById('surf_label_desc');
  if (surfDesc) surfDesc.innerText = 'Entire Tooth / Crown';

  // Render services list with modern cards
  const servicesList = document.getElementById('tt_services_list');
  const existingTreatments = selectedToothTreatments[toothNum] || [];
  const existingServiceNames = existingTreatments.map(t => t.service);

  if (availableDentalServices.length === 0) {
    availableDentalServices = [
      { id: 1, name: 'Dental Cleaning & Scaling', price: 1000, category: 'Cleaning', duration_mins: 30 },
      { id: 2, name: 'Dental Filling (Composite)', price: 1500, category: 'Filling', duration_mins: 30 },
      { id: 3, name: 'Root Canal Treatment (RCT)', price: 4000, category: 'RCT', duration_mins: 60 },
      { id: 4, name: 'Dental Crown (Zirconia/PFM)', price: 3500, category: 'Crown', duration_mins: 45 },
      { id: 5, name: 'Tooth Extraction', price: 2000, category: 'Extraction', duration_mins: 30 },
      { id: 6, name: 'Comprehensive Dental Consultation', price: 500, category: 'Consultation', duration_mins: 20 },
      { id: 7, name: 'Digital X-Ray (IOPA)', price: 500, category: 'X-Ray', duration_mins: 15 }
    ];
  }

  const catIcons = {
    'Cleaning': 'fa-solid fa-tooth',
    'Filling': 'fa-solid fa-fill-drip',
    'RCT': 'fa-solid fa-wand-magic-sparkles',
    'Crown': 'fa-solid fa-crown',
    'Extraction': 'fa-solid fa-hand-holding-medical',
    'Consultation': 'fa-solid fa-user-doctor',
    'X-Ray': 'fa-solid fa-x-ray',
    'Implant': 'fa-solid fa-screwdriver-wrench'
  };

  servicesList.innerHTML = availableDentalServices.map(s => {
    const isChecked = existingServiceNames.includes(s.name);
    const icon = catIcons[s.category] || 'fa-solid fa-teeth';
    return `
      <div class="service-select-card ${isChecked ? 'selected' : ''}" id="srv_card_${s.id}" onclick="toggleServiceCard(${s.id})">
        <div class="d-flex align-items-center gap-3">
          <input class="form-check-input ms-0 me-1 tt-service-check" type="checkbox" id="tt_srv_${s.id}" value="${escapeHtml(s.name)}" data-price="${s.price}" data-category="${s.category || 'General'}" ${isChecked ? 'checked' : ''} onclick="event.stopPropagation(); onServiceCheckboxChange(${s.id});">
          <div class="icon-circle bg-light border text-danger" style="width: 36px; height: 36px; font-size: 0.9rem;">
            <i class="${icon}"></i>
          </div>
          <div>
            <span class="fw-bold text-dark d-block">${escapeHtml(s.name)}</span>
            <small class="text-muted">${escapeHtml(s.category || 'General')} • ${s.duration_mins || 30} mins</small>
          </div>
        </div>
        <span class="badge bg-success-subtle text-success fs-6 fw-bold border border-success-subtle px-2 py-1">₹${parseFloat(s.price).toLocaleString('en-IN')}</span>
      </div>
    `;
  }).join('');

  // Render Mini Odontogram Arches in Modal (Exact replica of interactive teeth chart)
  renderMiniOdontogramInModal(toothNum);
  updateModalTotalPreview();

  new bootstrap.Modal(document.getElementById('toothTreatmentModal')).show();
}

function renderMiniOdontogramInModal(activeToothNum) {
  const miniChart = document.getElementById('tt_mini_chart_container');
  if (!miniChart) return;

  const renderQuadrant = (quadArray) => quadArray.map(t => {
    const isCurrent = t.num === activeToothNum;
    const isSelected = selectedBatchTeethNumbers.has(t.num);
    const label = t.isExtra ? '<i class="fa-solid fa-plus text-warning"></i>' : t.num;
    return `
      <div class="mini-tooth-item ${isCurrent ? 'current-focus' : ''} ${isSelected ? 'selected' : ''}" id="mini_tooth_${t.num}" title="${t.name}" onclick="${isCurrent ? '' : `toggleMiniToothSelection('${t.num}')`}">
        <span class="mt-num">${label}</span>
        <i class="fa-solid fa-tooth mt-icon"></i>
        <span class="mt-dot"></span>
      </div>
    `;
  }).join('');


  miniChart.innerHTML = `
    <div class="text-center small text-muted fw-bold mb-1" style="font-size: 0.68rem;"><i class="fa-solid fa-arrow-up me-1"></i> UPPER JAW (MAXILLARY ARCH)</div>
    <div class="mini-arch-row">
      <div class="mini-quadrant-group">${renderQuadrant(ADULT_TEETH.Q1)}</div>
      <div class="vr mx-1 opacity-25"></div>
      <div class="mini-quadrant-group">${renderQuadrant(ADULT_TEETH.Q2)}</div>
    </div>
    <div class="text-center small text-muted fw-bold mb-1 mt-2" style="font-size: 0.68rem;"><i class="fa-solid fa-arrow-down me-1"></i> LOWER JAW (MANDIBULAR ARCH)</div>
    <div class="mini-arch-row">
      <div class="mini-quadrant-group">${renderQuadrant(ADULT_TEETH.Q4)}</div>
      <div class="vr mx-1 opacity-25"></div>
      <div class="mini-quadrant-group">${renderQuadrant(ADULT_TEETH.Q3)}</div>
    </div>
  `;
}

function toggleMiniToothSelection(num) {
  const el = document.getElementById(`mini_tooth_${num}`);
  if (!el) return;
  if (selectedBatchTeethNumbers.has(num)) {
    selectedBatchTeethNumbers.delete(num);
    el.classList.remove('selected');
  } else {
    selectedBatchTeethNumbers.add(num);
    el.classList.add('selected');
  }
  updateModalTotalPreview();
}

function batchSelectArchInModal(arch) {
  const target = arch === 'upper' ? [...ADULT_TEETH.Q1, ...ADULT_TEETH.Q2] : [...ADULT_TEETH.Q4, ...ADULT_TEETH.Q3];
  target.forEach(t => {
    if (t.num !== currentModalToothNum) {
      selectedBatchTeethNumbers.add(t.num);
      const el = document.getElementById(`mini_tooth_${t.num}`);
      if (el) el.classList.add('selected');
    }
  });
  updateModalTotalPreview();
}

function clearBatchInModal() {
  selectedBatchTeethNumbers.clear();
  document.querySelectorAll('.mini-tooth-item:not(.current-focus)').forEach(el => el.classList.remove('selected'));
  updateModalTotalPreview();
}

function toggleToothSurface(surf) {
  const descEl = document.getElementById('surf_label_desc');
  if (surf === 'ALL') {
    selectedToothSurfaces = new Set(['ALL']);
    document.querySelectorAll('.surface-chip').forEach(c => c.classList.remove('active'));
    document.getElementById('surf_ALL')?.classList.add('active');
    if (descEl) descEl.innerText = 'Entire Tooth / Crown';
    return;
  }

  document.getElementById('surf_ALL')?.classList.remove('active');
  selectedToothSurfaces.delete('ALL');
  const chip = document.getElementById(`surf_${surf}`);

  if (selectedToothSurfaces.has(surf)) {
    selectedToothSurfaces.delete(surf);
    chip?.classList.remove('active');
  } else {
    selectedToothSurfaces.add(surf);
    chip?.classList.add('active');
  }

  if (selectedToothSurfaces.size === 0) {
    selectedToothSurfaces.add('ALL');
    document.getElementById('surf_ALL')?.classList.add('active');
    if (descEl) descEl.innerText = 'Entire Tooth / Crown';
  } else {
    const names = {
      'O': 'Occlusal',
      'M': 'Mesial',
      'D': 'Distal',
      'B': 'Buccal/Facial',
      'L': 'Lingual/Palatal'
    };
    const activeNames = Array.from(selectedToothSurfaces).map(s => names[s] || s).join(' + ');
    if (descEl) descEl.innerText = activeNames + ' Surfaces';
  }
}

function toggleServiceCard(srvId) {
  const cb = document.getElementById(`tt_srv_${srvId}`);
  const card = document.getElementById(`srv_card_${srvId}`);
  if (!cb) return;
  cb.checked = !cb.checked;
  if (card) {
    if (cb.checked) card.classList.add('selected');
    else card.classList.remove('selected');
  }
  updateModalTotalPreview();
}

function onServiceCheckboxChange(srvId) {
  const cb = document.getElementById(`tt_srv_${srvId}`);
  const card = document.getElementById(`srv_card_${srvId}`);
  if (cb && card) {
    if (cb.checked) card.classList.add('selected');
    else card.classList.remove('selected');
  }
  updateModalTotalPreview();
}

function updateModalTotalPreview() {
  let singleToothPrice = 0;
  document.querySelectorAll('.tt-service-check:checked').forEach(cb => {
    singleToothPrice += parseFloat(cb.getAttribute('data-price') || 0);
  });
  const totalTeethCount = 1 + selectedBatchTeethNumbers.size;
  const totalPrice = singleToothPrice * totalTeethCount;
  const prevEl = document.getElementById('tt_modal_total_preview');
  if (prevEl) {
    prevEl.innerHTML = `Total: <span class="text-success fw-bold">₹${totalPrice.toLocaleString('en-IN')}</span> <small class="text-muted">(${totalTeethCount} teeth)</small>`;
  }
}

// Apply selected treatments from modal
function applyToothTreatments() {
  const toothNum = parseInt(document.getElementById('tt_tooth_num').value);
  const toothName = document.getElementById('tt_tooth_name').value;
  const toothLoc = document.getElementById('tt_tooth_quadrant').value;

  const checkedServices = [];
  const surfaceScope = Array.from(selectedToothSurfaces).join(', ');

  document.querySelectorAll('.tt-service-check:checked').forEach(cb => {
    checkedServices.push({
      service: cb.value,
      price: parseFloat(cb.getAttribute('data-price') || 0),
      category: cb.getAttribute('data-category') || 'General',
      surfaces: surfaceScope
    });
  });

  // Target teeth: primary tooth + any batch teeth checked
  const allTeethList = [...ADULT_TEETH.Q1, ...ADULT_TEETH.Q2, ...ADULT_TEETH.Q3, ...ADULT_TEETH.Q4];
  const targetTeeth = [{ num: toothNum, name: toothName, loc: toothLoc }];

  selectedBatchTeethNumbers.forEach(bNum => {
    const match = allTeethList.find(t => t.num === bNum);
    if (match) {
      targetTeeth.push({ num: match.num, name: match.name, loc: match.loc });
    }
  });

  targetTeeth.forEach(t => {
    if (checkedServices.length > 0) {
      selectedToothTreatments[t.num] = checkedServices.map(s => ({
        ...s,
        tooth_name: t.name,
        tooth_loc: t.loc
      }));
      updateToothNodeVisual(t.num, true, checkedServices[0].service);
    } else {
      delete selectedToothTreatments[t.num];
      updateToothNodeVisual(t.num, false, 'OK');
    }
  });

  renderSelectedTreatmentsTable();
  recalculateDoctorBilling();
  bootstrap.Modal.getInstance(document.getElementById('toothTreatmentModal')).hide();
  showToast(`Treatments updated for tooth ${targetTeeth.map(t => t.num).join(', ')}!`, 'success');
}

function updateToothNodeVisual(toothNum, isTreated, label) {
  const box = document.getElementById(`tooth_box_${toothNum}`);
  const ind = document.getElementById(`tooth_ind_${toothNum}`);
  if (!box || !ind) return;

  if (isTreated) {
    box.classList.add('treated');
    ind.innerText = label.length > 6 ? label.substring(0, 5) + '..' : label;
    ind.title = label;
  } else {
    box.classList.remove('treated');
    ind.innerText = 'OK';
    ind.title = 'Healthy';
  }
}

function renderSelectedTreatmentsTable() {
  const tbody = document.getElementById('dn_treatments_tbody');
  const subtotalBadge = document.getElementById('dn_treatment_subtotal_badge');
  if (!tbody) return;

  const flatList = [];
  Object.keys(selectedToothTreatments).forEach(num => {
    selectedToothTreatments[num].forEach((t, idx) => {
      flatList.push({ ...t, tooth: num, idx });
    });
  });

  if (flatList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-3">No tooth treatments selected yet. Click any tooth in the chart above to add services.</td></tr>`;
    if (subtotalBadge) subtotalBadge.innerText = 'Subtotal: ₹0.00';
    return;
  }

  let total = 0;
  tbody.innerHTML = flatList.map((item, flatIdx) => {
    total += item.price;
    return `
      <tr>
        <td><strong class="text-danger">Tooth ${item.tooth}</strong></td>
        <td><small class="text-dark">${item.tooth_loc || ''} ${item.tooth_name || ''}</small></td>
        <td><span class="badge bg-light text-dark border fw-semibold">${escapeHtml(item.service)}</span></td>
        <td class="text-end fw-bold text-dark">₹${item.price.toLocaleString('en-IN')}</td>
        <td class="text-center">
          <button type="button" class="btn btn-sm btn-outline-danger py-0 px-2" onclick="removeSingleToothTreatment(${item.tooth}, ${item.idx})" title="Remove">
            <i class="fa-solid fa-trash-can" style="font-size: 0.75rem;"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  if (subtotalBadge) subtotalBadge.innerText = `Subtotal: ₹${total.toLocaleString('en-IN')}.00`;
  recalculateDoctorBilling();
}

function removeSingleToothTreatment(toothNum, serviceIdx) {
  if (selectedToothTreatments[toothNum]) {
    selectedToothTreatments[toothNum].splice(serviceIdx, 1);
    if (selectedToothTreatments[toothNum].length === 0) {
      delete selectedToothTreatments[toothNum];
      updateToothNodeVisual(toothNum, false, 'OK');
    }
    renderSelectedTreatmentsTable();
    recalculateDoctorBilling();
  }
}

function selectTeethArch(arch) {
  const targetGroup = arch === 'upper' ? [...ADULT_TEETH.Q1, ...ADULT_TEETH.Q2] : [...ADULT_TEETH.Q4, ...ADULT_TEETH.Q3];
  openToothTreatmentModal(targetGroup[0].num, targetGroup[0].name, targetGroup[0].loc);
  setTimeout(() => {
    batchSelectArchInModal(arch);
  }, 100);
}

function clearTeethSelections(silent = false) {
  selectedToothTreatments = {};
  ['Q1', 'Q2', 'Q3', 'Q4'].forEach(qKey => {
    ADULT_TEETH[qKey].forEach(t => updateToothNodeVisual(t.num, false, 'OK'));
  });
  renderSelectedTreatmentsTable();
  recalculateDoctorBilling();
  if (!silent) showToast('Teeth chart reset successfully.', 'info');
}

// ========================================================
// 7. EXPANDED PRESCRIPTION STUDIO: DRAWING PAD & DATABASE
// ========================================================
let isCanvasRuled = false;

function initPrescriptionCanvas() {
  rxCanvas = document.getElementById('prescriptionCanvas');
  if (!rxCanvas) return;
  rxCtx = rxCanvas.getContext('2d');

  function resize() {
    const rect = rxCanvas.getBoundingClientRect();
    if (rect.width > 0) {
      rxCanvas.width = rect.width;
      rxCanvas.height = 380;
      clearPenCanvas();
    }
  }

  // Mouse drawing
  rxCanvas.addEventListener('mousedown', startDrawing);
  rxCanvas.addEventListener('mousemove', draw);
  rxCanvas.addEventListener('mouseup', stopDrawing);
  rxCanvas.addEventListener('mouseleave', stopDrawing);

  // Touch drawing
  rxCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', { clientX: touch.clientX, clientY: touch.clientY });
    rxCanvas.dispatchEvent(mouseEvent);
  }, { passive: false });

  rxCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', { clientX: touch.clientX, clientY: touch.clientY });
    rxCanvas.dispatchEvent(mouseEvent);
  }, { passive: false });

  rxCanvas.addEventListener('touchend', () => {
    const mouseEvent = new MouseEvent('mouseup', {});
    rxCanvas.dispatchEvent(mouseEvent);
  });

  window.addEventListener('resize', resize);
  setTimeout(resize, 300);
}

function resizeCanvas() {
  if (!rxCanvas) return;
  const rect = rxCanvas.parentElement?.getBoundingClientRect();
  if (rect && rect.width > 0 && rxCanvas.width !== rect.width) {
    rxCanvas.width = rect.width;
    rxCanvas.height = 380;
    clearPenCanvas();
  }
}

let hasDoctorDrawnOnCanvas = false;

function startDrawing(e) {
  isDrawing = true;
  hasDoctorDrawnOnCanvas = true;
  const rect = rxCanvas.getBoundingClientRect();
  lastX = e.clientX - rect.left;
  lastY = e.clientY - rect.top;
}

function draw(e) {
  if (!isDrawing || !rxCtx) return;
  hasDoctorDrawnOnCanvas = true;
  const rect = rxCanvas.getBoundingClientRect();
  const currentX = e.clientX - rect.left;
  const currentY = e.clientY - rect.top;

  rxCtx.beginPath();
  rxCtx.moveTo(lastX, lastY);
  rxCtx.lineTo(currentX, currentY);
  rxCtx.strokeStyle = isEraserMode ? '#ffffff' : currentPenColor;
  rxCtx.lineWidth = isEraserMode ? currentPenWidth * 3 : currentPenWidth;
  rxCtx.lineCap = 'round';
  rxCtx.lineJoin = 'round';
  rxCtx.stroke();

  lastX = currentX;
  lastY = currentY;
}

function stopDrawing() {
  isDrawing = false;
}

function setPenColor(color, dotEl) {
  currentPenColor = color;
  isEraserMode = false;
  document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
  if (dotEl) dotEl.classList.add('active');
}

function setPenWidth(w) {
  currentPenWidth = w;
}

function drawCanvasRuledLines() {
  if (!rxCtx || !rxCanvas) return;
  rxCtx.save();
  rxCtx.strokeStyle = '#e2e8f0';
  rxCtx.lineWidth = 1;
  const lineSpacing = 32;
  for (let y = lineSpacing; y < rxCanvas.height; y += lineSpacing) {
    rxCtx.beginPath();
    rxCtx.moveTo(20, y);
    rxCtx.lineTo(rxCanvas.width - 20, y);
    rxCtx.stroke();
  }
  rxCtx.restore();
}

function toggleCanvasRuledLines() {
  isCanvasRuled = !isCanvasRuled;
  const btn = document.getElementById('btnRuledToggle');
  if (btn) {
    if (isCanvasRuled) {
      btn.classList.add('active', 'btn-secondary');
      btn.classList.remove('btn-outline-secondary');
    } else {
      btn.classList.remove('active', 'btn-secondary');
      btn.classList.add('btn-outline-secondary');
    }
  }
  clearPenCanvas();
}

function clearPenCanvas() {
  hasDoctorDrawnOnCanvas = false;
  if (!rxCtx || !rxCanvas) return;
  rxCtx.fillStyle = '#ffffff';
  rxCtx.fillRect(0, 0, rxCanvas.width, rxCanvas.height);
  if (isCanvasRuled) {
    drawCanvasRuledLines();
  }
}

function getCanvasDrawingData() {
  if (!rxCanvas || !hasDoctorDrawnOnCanvas) return null;
  return rxCanvas.toDataURL('image/png');
}

// Medicine Search from Database (Settings → Medicine Management)
function onSearchMedicineInput(query) {
  const resultsDiv = document.getElementById('dn_med_search_results');
  if (!resultsDiv) return;

  const q = (query || '').toLowerCase().trim();
  if (q.length === 0) {
    resultsDiv.classList.add('d-none');
    resultsDiv.innerHTML = '';
    return;
  }

  const allMeds = getMedicines();
  const matches = [];

  ['Dental', 'Homoeopathic'].forEach(cat => {
    (allMeds[cat] || []).forEach(name => {
      if (name.toLowerCase().includes(q)) {
        matches.push({ name, category: cat });
      }
    });
  });

  if (matches.length === 0) {
    resultsDiv.innerHTML = `<div class="p-2 text-muted small">No medicines found in database matching "${escapeHtml(q)}".</div>`;
    resultsDiv.classList.remove('d-none');
    return;
  }

  resultsDiv.innerHTML = matches.slice(0, 8).map(m => `
    <div class="med-search-item" onclick="addMedicineToPrescription('${escapeHtml(m.name)}', '${m.category}')">
      <div>
        <strong class="text-dark">${escapeHtml(m.name)}</strong>
        <span class="badge ${m.category === 'Dental' ? 'bg-primary-subtle text-primary' : 'bg-success-subtle text-success'} ms-2">${m.category}</span>
      </div>
      <button type="button" class="btn btn-sm btn-link text-decoration-none py-0"><i class="fa-solid fa-plus"></i> Add</button>
    </div>
  `).join('');
  resultsDiv.classList.remove('d-none');
}

function filterQuickMedicines(category) {
  const container = document.getElementById('dn_quick_medicines');
  if (!container) return;

  const allMeds = getMedicines();
  let list = [];

  if (category === 'All') {
    list = [...(allMeds.Dental || []), ...(allMeds.Homoeopathic || [])].slice(0, 12);
  } else if (category === 'Antibiotic') {
    list = (allMeds.Dental || []).filter(n => n.toLowerCase().includes('amox') || n.toLowerCase().includes('clav') || n.toLowerCase().includes('cipro') || n.toLowerCase().includes('metro') || n.toLowerCase().includes('doxy'));
    if (list.length === 0) list = ['Amoxicillin 500mg', 'Augmentin 625mg', 'Metronidazole 400mg'];
  } else if (category === 'Pain') {
    list = (allMeds.Dental || []).filter(n => n.toLowerCase().includes('ibu') || n.toLowerCase().includes('para') || n.toLowerCase().includes('diclo') || n.toLowerCase().includes('ketorol') || n.toLowerCase().includes('aceclo'));
    if (list.length === 0) list = ['Ibuprofen 400mg', 'Paracetamol 650mg', 'Ketorolac-DT 10mg'];
  } else if (category === 'Rinse') {
    list = ['Chlorhexidine 0.2% Mouthwash', 'Betadine Gargle 2%', 'Warm Saline Rinses'];
  } else if (category === 'Homoeopathy') {
    list = (allMeds.Homoeopathic || []).slice(0, 6);
  } else {
    list = (allMeds.Dental || []).slice(0, 8);
  }

  container.innerHTML = list.map(name => `
    <span class="med-chip" onclick="addMedicineToPrescription('${escapeHtml(name)}', 'Dental')">
      <i class="fa-solid fa-pills text-primary"></i> ${escapeHtml(name)}
    </span>
  `).join('');
}

function renderQuickMedicines() {
  filterQuickMedicines('All');
}

function addMedicineToPrescription(name, category) {
  const existing = prescribedMedicinesList.find(m => m.name === name);
  if (existing) {
    showToast(`"${name}" is already in the prescription list.`, 'info');
    return;
  }

  prescribedMedicinesList.push({
    name,
    category,
    dosage: '1 Tab (1-0-1)',
    duration: '5 Days',
    instructions: 'After Food'
  });

  const searchInput = document.getElementById('dn_med_search_input');
  if (searchInput) searchInput.value = '';
  document.getElementById('dn_med_search_results')?.classList.add('d-none');

  renderPrescribedMedicinesTable();
  showToast(`Added "${name}" to prescription.`, 'success');
}

function removeMedicineFromPrescription(index) {
  prescribedMedicinesList.splice(index, 1);
  renderPrescribedMedicinesTable();
}

function applyDosagePreset(idx, dosageVal) {
  if (prescribedMedicinesList[idx]) {
    prescribedMedicinesList[idx].dosage = dosageVal;
    renderPrescribedMedicinesTable();
  }
}

function applyDurationPreset(idx, durVal) {
  if (prescribedMedicinesList[idx]) {
    prescribedMedicinesList[idx].duration = durVal;
    renderPrescribedMedicinesTable();
  }
}

function renderPrescribedMedicinesTable() {
  const tbody = document.getElementById('dn_prescribed_meds_tbody');
  const countLabel = document.getElementById('dn_rx_count_label');
  if (countLabel) countLabel.innerText = `${prescribedMedicinesList.length} items added`;
  if (!tbody) return;

  if (prescribedMedicinesList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted small py-4">No medicines added yet. Search or click quick picks on the left.</td></tr>`;
    return;
  }

  tbody.innerHTML = prescribedMedicinesList.map((m, idx) => `
    <tr>
      <td>
        <strong class="text-dark small d-block">${escapeHtml(m.name)}</strong>
        <span class="badge ${m.category === 'Dental' ? 'bg-primary-subtle text-primary' : 'bg-success-subtle text-success'}" style="font-size: 0.65rem;">${escapeHtml(m.category || 'General')}</span>
      </td>
      <td>
        <input type="text" class="form-control form-control-sm py-0 mb-1" value="${escapeHtml(m.dosage)}" onchange="prescribedMedicinesList[${idx}].dosage = this.value">
        <div class="d-flex flex-wrap gap-1">
          <span class="dosage-preset-pill" onclick="applyDosagePreset(${idx}, '1-0-1 (BD)')">1-0-1</span>
          <span class="dosage-preset-pill" onclick="applyDosagePreset(${idx}, '1-1-1 (TDS)')">1-1-1</span>
          <span class="dosage-preset-pill" onclick="applyDosagePreset(${idx}, '1-0-0 (OD)')">1-0-0</span>
          <span class="dosage-preset-pill" onclick="applyDosagePreset(${idx}, '0-0-1 (HS)')">0-0-1</span>
          <span class="dosage-preset-pill" onclick="applyDosagePreset(${idx}, 'SOS (As Needed)')">SOS</span>
        </div>
      </td>
      <td>
        <input type="text" class="form-control form-control-sm py-0" value="${escapeHtml(m.duration)}" onchange="prescribedMedicinesList[${idx}].duration = this.value" style="width: 85px;">
        <div class="d-flex gap-1 mt-1">
          <span class="dosage-preset-pill" onclick="applyDurationPreset(${idx}, '3 Days')">3D</span>
          <span class="dosage-preset-pill" onclick="applyDurationPreset(${idx}, '5 Days')">5D</span>
          <span class="dosage-preset-pill" onclick="applyDurationPreset(${idx}, '7 Days')">7D</span>
        </div>
      </td>
      <td>
        <input type="text" class="form-control form-control-sm py-0" value="${escapeHtml(m.instructions || 'After Food')}" onchange="prescribedMedicinesList[${idx}].instructions = this.value" placeholder="After Food">
      </td>
      <td class="text-end">
        <button type="button" class="btn btn-sm btn-link text-danger p-0" onclick="removeMedicineFromPrescription(${idx})" title="Remove medicine">
          <i class="fa-solid fa-times"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// Print / Preview Full Prescription Slip
function printPrescriptionDirectly() {
  const p = currentConsultationPatient;
  if (!p) {
    showToast('Please select a patient in the chair before previewing prescription.', 'warning');
    return;
  }

  const modalBody = document.getElementById('prescriptionPrintContent');
  if (!modalBody) return;

  const docName = getAttendingDoctorName(p ? p.doctor_name : null, true);
  const notes = document.getElementById('dn_clinical_notes')?.value || 'Routine dental examination completed. Post-operative care instructions provided.';
  const canvasDrawing = getCanvasDrawingData();

  const treatmentsFlat = [];
  Object.keys(selectedToothTreatments).forEach(num => {
    selectedToothTreatments[num].forEach(t => {
      treatmentsFlat.push({
        tooth: num,
        name: t.tooth_name || `Tooth ${num}`,
        service: t.service,
        price: t.price
      });
    });
  });

  const printDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const printTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  modalBody.innerHTML = `
    <div class="clinical-sheet">
      <!-- Clinic Letterhead -->
      <div class="clinical-letterhead d-flex justify-content-between align-items-start flex-wrap gap-2">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <i class="fa-solid fa-tooth fa-2x" style="color: var(--accent-red);"></i>
            <div>
              <h3 class="clinical-title mb-0">DENTAL CLINIC</h3>
              <div class="clinical-subtitle text-uppercase">Kivex Technology CRM Platform | Multi-Speciality Dental Surgery & Care</div>
            </div>
          </div>
          <div class="small text-muted" style="font-size: 0.78rem;">
            <span>1st Floor, Omkar Plaza, Nikol Naroda Road, Nikol, Ahmedabad - 382350</span><br>
            <span>Ph: +91 98765 43210 | care@dental.com | Reg. No: GUJ/DENT/2024/8892</span>
          </div>
        </div>
        <div class="text-end">
          <span class="badge bg-danger text-white px-3 py-1 text-uppercase" style="font-size: 0.75rem; letter-spacing: 0.05em;">Doctor's Prescription Slip</span>
          <div class="mt-2 text-muted" style="font-size: 0.78rem;">
            <div><strong>Token:</strong> <span class="badge bg-danger-subtle text-danger border border-danger-subtle">${escapeHtml(p.visual_token || '-')}</span></div>
            <div><strong>MRN / Code:</strong> <span class="font-monospace text-dark">${escapeHtml(p.booking_code || p.patient_code || '-')}</span></div>
            <div><strong>Date:</strong> ${printDate} ${printTime}</div>
          </div>
        </div>
      </div>

      <!-- Patient Demographics Summary -->
      <div class="mb-3">
        <div class="clinical-section-header">
          <i class="fa-solid fa-user text-danger"></i> Patient Details
        </div>
        <table class="clinical-table">
          <tbody>
            <tr>
              <td style="width: 25%;"><strong>Patient Name:</strong></td>
              <td style="width: 35%;" class="fw-bold text-dark">${escapeHtml(p.patient_name || p.name)}</td>
              <td style="width: 20%;"><strong>Mobile Phone:</strong></td>
              <td style="width: 20%;" class="font-monospace">${escapeHtml(p.phone || '-')}</td>
            </tr>
            <tr>
              <td><strong>Attending Doctor:</strong></td>
              <td><strong>${escapeHtml(docName)}</strong></td>
              <td><strong>Consultation Date:</strong></td>
              <td>${printDate}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Dental Procedures Performed -->
      ${treatmentsFlat.length > 0 ? `
        <div class="mb-3">
          <div class="clinical-section-header">
            <i class="fa-solid fa-teeth text-danger"></i> Clinical Procedures & Odontogram Findings
          </div>
          <table class="clinical-table">
            <thead>
              <tr>
                <th style="width: 15%;">Tooth #</th>
                <th style="width: 35%;">Anatomical Location</th>
                <th style="width: 35%;">Procedure Performed</th>
                <th style="width: 15%; text-align: right;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${treatmentsFlat.map(t => `
                <tr>
                  <td class="fw-bold text-danger">Tooth ${t.tooth}</td>
                  <td>${escapeHtml(t.name)}</td>
                  <td class="fw-semibold text-dark">${escapeHtml(t.service)}</td>
                  <td style="text-align: right;"><span class="badge bg-success-subtle text-success">Completed</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <!-- Prescribed Medicines (Rx) -->
      <div class="mb-3">
        <div class="clinical-section-header">
          <i class="fa-solid fa-prescription text-danger"></i> Rx - Prescribed Medicines
        </div>
        ${prescribedMedicinesList.length > 0 ? `
          <table class="clinical-table">
            <thead>
              <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 35%;">Medicine Name & Strength</th>
                <th style="width: 20%;">Dosage & Frequency</th>
                <th style="width: 20%;">Duration</th>
                <th style="width: 20%;">Timing / Instructions</th>
              </tr>
            </thead>
            <tbody>
              ${prescribedMedicinesList.map((m, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${escapeHtml(m.name)}</strong></td>
                  <td>${escapeHtml(m.dosage)}</td>
                  <td>${escapeHtml(m.duration)}</td>
                  <td>${escapeHtml(m.instructions || 'After Food')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `<div class="p-2 border rounded-2 bg-light text-muted small"><i class="fa-solid fa-circle-info me-1"></i> No oral medications prescribed.</div>`}
      </div>

      <!-- Handwritten Diagram & Notes (if any) -->
      ${canvasDrawing ? `
        <div class="mb-3">
          <div class="clinical-section-header">
            <i class="fa-solid fa-pen-nib text-danger"></i> Doctor's Clinical Diagram & Odontogram Markup
          </div>
          <div class="text-center p-2 border rounded-2 bg-light">
            <img src="${canvasDrawing}" class="img-fluid rounded-1" style="max-height: 220px;" alt="Clinical Diagram">
          </div>
        </div>
      ` : ''}

      <!-- Doctor Findings & Advice -->
      <div class="mb-3">
        <div class="clinical-section-header">
          <i class="fa-solid fa-notes-medical text-danger"></i> Doctor Findings & Post-Operative Instructions
        </div>
        <div class="p-2 border rounded-2 bg-light text-dark small" style="white-space: pre-wrap;">
${escapeHtml(notes)}
        </div>
      </div>

      <!-- Next Scheduled Sittings -->
      ${selectedNextAppointmentDates.length > 0 ? `
        <div class="mb-3">
          <div class="clinical-section-header">
            <i class="fa-solid fa-calendar-check text-danger"></i> Next Scheduled Sittings Plan
          </div>
          <table class="clinical-table">
            <thead>
              <tr>
                <th>Sitting</th>
                <th>Appointment Date</th>
                <th>Preferred Time</th>
                <th>Procedure Purpose</th>
              </tr>
            </thead>
            <tbody>
              ${selectedNextAppointmentDates.map((s, idx) => `
                <tr>
                  <td><strong>Sitting ${idx + 1}</strong></td>
                  <td class="fw-semibold text-danger">${s.date}</td>
                  <td>${s.time}</td>
                  <td>${escapeHtml(s.purpose || 'Follow-up / Clinical Recall')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <!-- Sign-off & Seal Block -->
      <div class="d-flex justify-content-between align-items-end pt-3 mt-3 border-top">
        <div class="small text-muted" style="font-size: 0.75rem;">
          <div>* Valid clinical dental prescription. Keep safe for next follow-up visit.</div>
          <div>Dental Information System | Powered by Kivex Technology | Contact: +91 98765 43210</div>
        </div>
        <div class="clinical-sign-box">
          <div class="fw-bold text-dark small mb-0">${escapeHtml(docName)}</div>
          <div class="text-muted" style="font-size: 0.72rem;">B.D.S., M.D.S. (Chief Dental Surgeon)</div>
          <div class="text-muted" style="font-size: 0.7rem;">Authorized Doctor's Seal & Signature</div>
        </div>
      </div>
    </div>
  `;

  new bootstrap.Modal(document.getElementById('prescriptionPrintModal')).show();
}

// ========================================================
// CLINICAL WRITING STUDIO: SPEECH-TO-TEXT & TEMPLATES
// ========================================================
let voiceRecognitionInstance = null;
let isVoiceRecording = false;

function initClinicalNotesCharCount() {
  const notes = document.getElementById('dn_clinical_notes');
  const countEl = document.getElementById('dn_notes_char_count');
  if (!notes || !countEl) return;

  notes.addEventListener('input', () => {
    countEl.innerText = `${notes.value.length} characters`;
  });
}

// ========================================================
// 8. QUICK PROCEDURE INSERTS & SETTINGS MANAGEMENT
// ========================================================
const DEFAULT_QUICK_PROCEDURES = [
  { id: 1, title: '🩺 Scaling Done', text: 'Routine oral examination completed. Generalized calculus noted. Ultrasonic scaling done.' },
  { id: 2, title: '🦷 Composite Filling', text: 'Class II composite filling placed with etching, bonding & light cure polishing.' },
  { id: 3, title: '🔬 RCT BMP Sitting', text: 'RCT: Access opened, working length established with apex locator, canals shaped to 25/04, dressed with Ca(OH)2.' },
  { id: 4, title: '✨ RCT Obturation', text: 'RCT Obturation completed with gutta-percha & bioceramic sealer. Core restoration placed.' },
  { id: 5, title: '✂️ Extraction', text: 'Atraumatic extraction performed under 2% Lignocaine with Adrenaline (1:80,000). Hemostasis achieved.' },
  { id: 6, title: '👑 Crown Prep', text: 'Crown preparation completed with subgingival shoulder margin. Elastomeric impression taken.' },
  { id: 7, title: '📋 Post-Op Advice', text: 'Post-op instructions given: Soft diet, avoid hot foods, warm salt water rinses after 24 hrs.' }
];

function getQuickProcedures() {
  try {
    const raw = localStorage.getItem('dental_quick_procedures');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [...DEFAULT_QUICK_PROCEDURES];
}

function saveQuickProcedures(list) {
  try {
    localStorage.setItem('dental_quick_procedures', JSON.stringify(list));
  } catch (e) {}
  renderQuickProcedures();
  renderQuickProceduresSettings();
}

function renderQuickProcedures() {
  const container = document.getElementById('dn_quick_procedures_container');
  if (!container) return;
  const list = getQuickProcedures();
  container.innerHTML = list.map(item => `
    <span class="template-chip" onclick="insertClinicalTemplate(${JSON.stringify(item.text).replace(/"/g, '&quot;')})">
      ${escapeHtml(item.title)}
    </span>
  `).join('');
}
window.renderQuickProcedures = renderQuickProcedures;

function renderQuickProceduresSettings() {
  const tbody = document.getElementById('quickProceduresSettingsTbody');
  if (!tbody) return;
  const list = getQuickProcedures();
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-3">No templates configured.</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(item => `
    <tr>
      <td class="fw-bold">${escapeHtml(item.title)}</td>
      <td class="small text-muted">${escapeHtml(item.text)}</td>
      <td class="text-center">
        <button type="button" class="btn btn-sm btn-outline-danger py-0 px-2" onclick="deleteQuickProcedureTemplate(${item.id})" title="Delete template">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    </tr>
  `).join('');
}
window.renderQuickProceduresSettings = renderQuickProceduresSettings;

function addQuickProcedureTemplate() {
  const titleEl = document.getElementById('newQuickProcTitle');
  const textEl = document.getElementById('newQuickProcTemplate');
  const title = (titleEl?.value || '').trim();
  const text = (textEl?.value || '').trim();
  if (!title || !text) {
    showToast('Please enter both Button Title and Clinical Template text.', 'warning');
    return;
  }
  const list = getQuickProcedures();
  list.push({ id: Date.now(), title, text });
  saveQuickProcedures(list);
  if (titleEl) titleEl.value = '';
  if (textEl) textEl.value = '';
  showToast(`Quick Procedure "${title}" added successfully!`, 'success');
}
window.addQuickProcedureTemplate = addQuickProcedureTemplate;

function deleteQuickProcedureTemplate(id) {
  let list = getQuickProcedures();
  list = list.filter(item => item.id !== id);
  saveQuickProcedures(list);
  showToast('Quick Procedure template deleted.', 'info');
}
window.deleteQuickProcedureTemplate = deleteQuickProcedureTemplate;

function insertClinicalTemplate(templateText) {
  const notes = document.getElementById('dn_clinical_notes');
  if (!notes) return;
  notes.value = notes.value ? `${notes.value}\n• ${templateText}` : `• ${templateText}`;
  const countEl = document.getElementById('dn_notes_char_count');
  if (countEl) countEl.innerText = `${notes.value.length} characters`;
  notes.focus();
  showToast('Procedure template inserted into notes.', 'info');
}
window.insertClinicalTemplate = insertClinicalTemplate;

function clearClinicalNotes() {

  const notes = document.getElementById('dn_clinical_notes');
  if (!notes || !notes.value) return;
  if (confirm('Clear clinical procedure notes?')) {
    notes.value = '';
    const countEl = document.getElementById('dn_notes_char_count');
    if (countEl) countEl.innerText = '0 characters';
    showToast('Clinical notes cleared.', 'info');
  }
}

// ========================================================
// 8. NEXT APPOINTMENT: MULTI-DATE CALENDAR & SITTINGS PLANNER
// ========================================================
let selectedNextAppointmentDates = [];
let calCurrentMonth = new Date().getMonth();
let calCurrentYear = new Date().getFullYear();

function initMultiDateCalendar() {
  if (selectedNextAppointmentDates.length === 0) {
    const now = new Date();
    const future = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate());
    const dateStr = future.toISOString().split('T')[0];
    selectedNextAppointmentDates = [{
      date: dateStr,
      time: '10:00',
      purpose: '6-Month Routine Recall'
    }];
  }
  renderNextApptCalendar(calCurrentYear, calCurrentMonth);
  renderSelectedSittingsList();
}

function renderNextApptCalendar(year, month) {
  const grid = document.getElementById('miniCalGrid');
  const title = document.getElementById('miniCalTitle');
  if (!grid || !title) return;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  title.innerText = `${monthNames[month]} ${year}`;

  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  let html = weekdays.map(w => `<div class="mini-cal-weekday">${w}</div>`).join('');

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDayIndex; i++) {
    html += `<div class="mini-cal-day empty-day"></div>`;
  }

  const todayStr = new Date().toISOString().split('T')[0];

  for (let day = 1; day <= daysInMonth; day++) {
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${mStr}-${dStr}`;

    const isToday = (dateStr === todayStr);
    const isSelected = selectedNextAppointmentDates.some(item => item.date === dateStr);

    html += `
      <div class="mini-cal-day ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}" onclick="toggleCalendarDate('${dateStr}')" title="${dateStr}">
        ${day}
      </div>
    `;
  }

  grid.innerHTML = html;
}

function changeCalendarMonth(delta) {
  calCurrentMonth += delta;
  if (calCurrentMonth > 11) {
    calCurrentMonth = 0;
    calCurrentYear++;
  } else if (calCurrentMonth < 0) {
    calCurrentMonth = 11;
    calCurrentYear--;
  }
  renderNextApptCalendar(calCurrentYear, calCurrentMonth);
}

function toggleCalendarDate(dateStr) {
  const existingIdx = selectedNextAppointmentDates.findIndex(item => item.date === dateStr);
  if (existingIdx > -1) {
    selectedNextAppointmentDates.splice(existingIdx, 1);
    showToast(`Removed appointment date: ${dateStr}`, 'info');
  } else {
    const sittingNum = selectedNextAppointmentDates.length + 1;
    selectedNextAppointmentDates.push({
      date: dateStr,
      time: '10:00',
      purpose: `Sitting ${sittingNum}: Follow-up`
    });
    selectedNextAppointmentDates.sort((a, b) => new Date(a.date) - new Date(b.date));
    showToast(`Added appointment date: ${dateStr}`, 'success');
  }
  renderNextApptCalendar(calCurrentYear, calCurrentMonth);
  renderSelectedSittingsList();
}

function addNextSittingByOffset(days, label) {
  const now = new Date();
  const target = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const dateStr = target.toISOString().split('T')[0];

  if (!selectedNextAppointmentDates.some(x => x.date === dateStr)) {
    selectedNextAppointmentDates.push({
      date: dateStr,
      time: '10:00',
      purpose: label || `Sitting ${selectedNextAppointmentDates.length + 1}`
    });
    selectedNextAppointmentDates.sort((a, b) => new Date(a.date) - new Date(b.date));
    showToast(`Scheduled: ${dateStr} (${label})`, 'info');
  }
  renderNextApptCalendar(calCurrentYear, calCurrentMonth);
  renderSelectedSittingsList();
}

function addMultiSittingProtocol(type) {
  if (type === 'RCT') {
    selectedNextAppointmentDates = [];
    addNextSittingByOffset(7, 'RCT Sitting 2: Obturation');
    addNextSittingByOffset(14, 'Crown Prep & Impression');
    addNextSittingByOffset(28, 'Crown Delivery & Cementation');
    showToast('Loaded 3-Sitting RCT Multi-Appointment Plan!', 'success');
  }
}

function removeSitting(idx) {
  selectedNextAppointmentDates.splice(idx, 1);
  renderNextApptCalendar(calCurrentYear, calCurrentMonth);
  renderSelectedSittingsList();
}

function updateSittingTime(idx, timeVal) {
  if (selectedNextAppointmentDates[idx]) {
    selectedNextAppointmentDates[idx].time = timeVal;
  }
}

function updateSittingPurpose(idx, purposeVal) {
  if (selectedNextAppointmentDates[idx]) {
    selectedNextAppointmentDates[idx].purpose = purposeVal;
  }
}

function renderSelectedSittingsList() {
  const container = document.getElementById('dn_sittings_container');
  const countLabel = document.getElementById('dn_sittings_count');
  const hiddenDate = document.getElementById('dn_next_date');
  const hiddenTime = document.getElementById('dn_next_time');

  if (countLabel) countLabel.innerText = `${selectedNextAppointmentDates.length} date(s) picked`;

  if (selectedNextAppointmentDates.length > 0) {
    if (hiddenDate) hiddenDate.value = selectedNextAppointmentDates[0].date;
    if (hiddenTime) hiddenTime.value = selectedNextAppointmentDates[0].time;
  } else {
    if (hiddenDate) hiddenDate.value = '';
  }

  if (!container) return;

  if (selectedNextAppointmentDates.length === 0) {
    container.innerHTML = `<div class="text-muted small py-2 text-center">No dates selected. Click dates on calendar above.</div>`;
    return;
  }

  container.innerHTML = selectedNextAppointmentDates.map((item, idx) => {
    const dObj = new Date(item.date + 'T00:00:00');
    const formatted = dObj.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    return `
      <div class="sitting-badge-card">
        <div class="d-flex align-items-center gap-2 flex-grow-1">
          <span class="badge bg-danger-subtle text-danger border border-danger-subtle fw-bold" style="font-size: 0.7rem;">Sitting ${idx + 1}</span>
          <div>
            <strong class="text-dark small d-block">${formatted}</strong>
            <input type="text" class="form-control form-control-sm py-0 border-0 bg-transparent text-muted" value="${escapeHtml(item.purpose || '')}" placeholder="Purpose / Sitting note" onchange="updateSittingPurpose(${idx}, this.value)" style="font-size: 0.72rem; padding-left: 0;">
          </div>
        </div>
        <div class="d-flex align-items-center gap-1">
          <input type="time" class="form-control form-control-sm py-0 px-1" value="${item.time || '10:00'}" onchange="updateSittingTime(${idx}, this.value)" style="font-size: 0.75rem; width: 75px;">
          <button type="button" class="btn btn-sm btn-link text-danger p-0 ms-1" onclick="removeSitting(${idx})" title="Remove date">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function initNextAppointmentDate() {
  initMultiDateCalendar();
}

function setNextDateOffset(days) {
  addNextSittingByOffset(days, `Follow-up in ${days} days`);
}

// ========================================================
// WEB MCP & ANTIGRAVITY AGENT CONTEXT INSPECTION
// ========================================================
let currentAgentContextData = null;

async function openAgentContextModal() {
  const modalEl = document.getElementById('agentContextModal');
  if (modalEl) {
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
    await loadAgentContextData();
  }
}

async function loadAgentContextData() {
  const displayEl = document.getElementById('agentContextJsonDisplay');
  if (displayEl) displayEl.innerText = 'Refreshing live MCP & CRM context...';

  try {
    const res = await fetch('/api/agent/context', {
      headers: {
        'Authorization': `Bearer ${currentToken}`
      }
    });
    const data = await res.json();
    if (data.success) {
      currentAgentContextData = data;
      // Populate badges
      const tomEl = document.getElementById('mcpTomorrowCount');
      if (tomEl) tomEl.innerText = data.bifurcations?.tomorrow_due_calls?.count ?? 0;

      const nextEl = document.getElementById('mcpNextWeekCount');
      if (nextEl) nextEl.innerText = data.bifurcations?.next_week?.count ?? 0;

      const recEl = document.getElementById('mcpRecentCount');
      if (recEl) recEl.innerText = data.bifurcations?.recent_visits?.count ?? 0;

      const qEl = document.getElementById('mcpQueueCount');
      if (qEl) qEl.innerText = data.clinic_summary?.active_queue_count ?? 0;

      // Populate display
      if (displayEl) {
        displayEl.innerText = JSON.stringify(data, null, 2);
      }
    } else {
      if (displayEl) displayEl.innerText = `Error: ${data.message || 'Failed to load agent context'}`;
    }
  } catch (err) {
    console.error('Agent context fetch error:', err);
    if (displayEl) displayEl.innerText = `Error fetching agent context: ${err.message}`;
  }
}

async function copyAgentContextJson() {
  if (!currentAgentContextData) {
    showToast('No agent context data loaded to copy.', 'warning');
    return;
  }
  try {
    const text = JSON.stringify(currentAgentContextData, null, 2);
    await navigator.clipboard.writeText(text);
    showToast('📋 Copied full live Agent & MCP Context for Antigravity!', 'success');
  } catch (err) {
    // Fallback for older browsers
    const displayEl = document.getElementById('agentContextJsonDisplay');
    if (displayEl) {
      const range = document.createRange();
      range.selectNode(displayEl);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
      document.execCommand('copy');
      window.getSelection().removeAllRanges();
      showToast('📋 Copied context to clipboard!', 'success');
    }
  }
}



// ========================================================
// DOCTOR CONSULTATION FINANCIAL & DISCOUNT SUMMARY
// ========================================================
function recalculateDoctorBilling() {
  const treatmentsSubtotalBadge = document.getElementById('dn_treatment_subtotal_badge');
  const countBadge = document.getElementById('dn_treatments_count_badge');
  const subtotalEl = document.getElementById('dn_calc_subtotal');
  const netEl = document.getElementById('dn_calc_net');
  const discSummaryEl = document.getElementById('dn_discount_summary_text');
  const discInput = document.getElementById('dn_doctor_discount');

  let subtotal = 0;
  let treatmentsCount = 0;
  Object.keys(selectedToothTreatments).forEach(num => {
    selectedToothTreatments[num].forEach(t => {
      subtotal += parseFloat(t.price || 0);
      treatmentsCount++;
    });
  });

  if (countBadge) countBadge.innerText = `${treatmentsCount} Treatments Selected`;
  if (treatmentsSubtotalBadge) treatmentsSubtotalBadge.innerText = `Subtotal: ₹${subtotal.toLocaleString('en-IN')}.00`;
  if (subtotalEl) subtotalEl.innerText = `₹${subtotal.toLocaleString('en-IN')}.00`;

  const isPct = document.getElementById('dn_disc_type_pct')?.checked;
  const rawDiscount = parseFloat(discInput?.value || 0);

  let discountAmount = 0;
  if (isPct) {
    const pct = Math.min(100, Math.max(0, rawDiscount));
    discountAmount = (subtotal * pct) / 100;
    if (discSummaryEl) discSummaryEl.innerText = `Discount: ₹${discountAmount.toFixed(2)} (${pct}%)`;
  } else {
    discountAmount = Math.min(subtotal, Math.max(0, rawDiscount));
    const pctEquiv = subtotal > 0 ? ((discountAmount / subtotal) * 100).toFixed(0) : 0;
    if (discSummaryEl) discSummaryEl.innerText = `Discount: ₹${discountAmount.toFixed(2)} (${pctEquiv}%)`;
  }

  const netAmount = Math.max(0, subtotal - discountAmount);
  if (netEl) netEl.innerText = `₹${netAmount.toLocaleString('en-IN')}.00`;
}

function setDoctorDiscountPreset(val, type) {
  const inrRadio = document.getElementById('dn_disc_type_inr');
  const pctRadio = document.getElementById('dn_disc_type_pct');
  const addon = document.getElementById('dn_disc_addon');
  const input = document.getElementById('dn_doctor_discount');

  if (type === 'PCT') {
    if (pctRadio) pctRadio.checked = true;
    if (addon) addon.innerText = '%';
  } else {
    if (inrRadio) inrRadio.checked = true;
    if (addon) addon.innerText = '₹';
  }

  if (input) input.value = val;
  recalculateDoctorBilling();
}

function resetDoctorWorkspace(silent = false) {
  clearTeethSelections(true);
  clearPenCanvas();
  prescribedMedicinesList = [];
  renderPrescribedMedicinesTable();
  const notes = document.getElementById('dn_clinical_notes');
  if (notes) notes.value = '';
  const countEl = document.getElementById('dn_notes_char_count');
  if (countEl) countEl.innerText = '0 characters';
  const disc = document.getElementById('dn_doctor_discount');
  if (disc) disc.value = 0;
  const reason = document.getElementById('dn_discount_reason');
  if (reason) reason.value = '';
  selectedNextAppointmentDates = [];
  initMultiDateCalendar();
  recalculateDoctorBilling();
  if (!silent) showToast('Doctor consultation workspace reset.', 'info');
}

// ========================================================
// 9. WORKFLOW: DOCTOR CONSULTATION COMPLETION & OUTSIDE BILLING DESK
// ========================================================
let currentCheckoutBooking = null;

let isConsultationSubmitting = false;

async function saveConsultationAndForwardToBilling() {
  if (isConsultationSubmitting) {
    console.warn('Consultation submission already in progress. Ignoring duplicate click.');
    return;
  }

  if (!currentConsultationPatient) {
    showToast('Please select a patient in the chair before completing consultation.', 'warning');
    const sel = document.getElementById('dn_patient_select');
    if (sel) sel.focus();
    return;
  }

  const p = currentConsultationPatient;
  const docName = getAttendingDoctorName(p ? p.doctor_name : null);
  const notes = document.getElementById('dn_clinical_notes')?.value || '';
  const nextDate = document.getElementById('dn_next_date')?.value || '';
  const nextTime = document.getElementById('dn_next_time')?.value || '10:00';
  const canvasData = getCanvasDrawingData();

  // Gather treatments array
  const treatmentsArray = [];
  Object.keys(selectedToothTreatments).forEach(num => {
    selectedToothTreatments[num].forEach(t => {
      treatmentsArray.push({
        tooth: num,
        tooth_name: t.tooth_name || `Tooth ${num}`,
        service: t.service,
        price: parseFloat(t.price || 0)
      });
    });
  });

  if (treatmentsArray.length === 0 && !notes && prescribedMedicinesList.length === 0) {
    if (!confirm('No teeth treatments, prescriptions, or clinical notes have been added. Forward to billing anyway?')) {
      return;
    }
  }

  // Doctor discount calculations
  const isPct = document.getElementById('dn_disc_type_pct')?.checked;
  const rawDiscount = parseFloat(document.getElementById('dn_doctor_discount')?.value || 0);
  const discountReason = document.getElementById('dn_discount_reason')?.value || '';

  let subtotal = treatmentsArray.reduce((sum, item) => sum + item.price, 0);
  if (subtotal === 0 && (p.service_name || notes)) {
    subtotal = 500;
  }

  let doctorDiscount = 0;
  if (isPct) {
    const pct = Math.min(100, Math.max(0, rawDiscount));
    doctorDiscount = (subtotal * pct) / 100;
  } else {
    doctorDiscount = Math.min(subtotal, Math.max(0, rawDiscount));
  }
  const netFinalAmount = Math.max(0, subtotal - doctorDiscount);

  const payload = {
    doctor_name: docName,
    treatment_performed: treatmentsArray.length > 0 
      ? treatmentsArray.map(t => `${t.service} on Tooth ${t.tooth}`).join(', ') 
      : (p.service_name || 'Clinical Dental Consultation'),
    clinical_notes: notes,
    notes: notes,
    teeth_treatments: treatmentsArray,
    prescription_medicines: prescribedMedicinesList,
    prescription: prescribedMedicinesList.map(m => `${m.name} - ${m.dosage} for ${m.duration} (${m.instructions})`).join('\n'),
    handwritten_rx: canvasData,
    next_appointment_date: nextDate || (selectedNextAppointmentDates[0] ? selectedNextAppointmentDates[0].date : null),
    next_appointment_time: nextTime || (selectedNextAppointmentDates[0] ? selectedNextAppointmentDates[0].time : '10:00'),
    next_appointment_dates: selectedNextAppointmentDates,
    amount: subtotal,
    discount: doctorDiscount,
    final_amount: netFinalAmount,
    discount_reason: discountReason
  };

  const submitBtn = document.querySelector('button[onclick*="saveConsultationAndForwardToBilling"]');
  const origBtnHtml = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i>Forwarding to Billing...';
  }
  isConsultationSubmitting = true;

  try {
    const res = await fetch(`/api/bookings/${p.id}/consultation`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast(`✅ Consultation complete! Patient ${p.patient_name} (Token ${p.visual_token}) sent to Payment & Billing Desk with authorized discount: ₹${doctorDiscount.toFixed(2)}.`, 'success');
      
      // Reset doctor workspace so doctor can take next patient
      resetDoctorWorkspace(true);
      currentConsultationPatient = null;
      
      // Update queue badges & dropdown
      fetchWalkinBookings();
      populateDoctorPatientSelector();
      updateBillingDeskBadge();

      // Go directly to Payment & Billing Desk Section!
      switchView('payment-desk');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      showToast(data.message || 'Error saving consultation.', 'danger');
    }
  } catch (err) {
    console.error('Error saving consultation:', err);
    showToast('Network error while saving consultation.', 'danger');
  } finally {
    isConsultationSubmitting = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = origBtnHtml || '<i class="fa-solid fa-clipboard-check me-2"></i> Complete & Send to Billing Desk <i class="fa-solid fa-arrow-right ms-1"></i>';
    }
  }
}


// --------------------------------------------------------
// BILLING DESK (Outside Consultation Room)
// --------------------------------------------------------
async function loadPaymentDesk() {
  const tbody = document.getElementById('billingQueueTbody');
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4"><div class="spinner-border spinner-border-sm text-primary me-2"></div> Loading billing queue...</td></tr>`;
  }

  try {
    const res = await fetch('/api/bookings', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const data = await res.json();
    if (data.success && data.bookings) {
      // Filter patients awaiting payment: status === 'Awaiting Payment'
      allBillingQueueBookings = data.bookings.filter(b => b.status === 'Awaiting Payment');
      renderBillingQueue(allBillingQueueBookings);
      updateBillingDeskStats(data.bookings);
    }
  } catch (e) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-4">Error loading billing queue.</td></tr>`;
  }

  loadBillingOutstandingDues();
}

function renderBillingQueue(bookings) {
  const tbody = document.getElementById('billingQueueTbody');
  const countEl = document.getElementById('billingQueueCount');
  const sidebarBadge = document.getElementById('sidebarBillingBadge');
  if (countEl) countEl.innerText = bookings.length;
  if (sidebarBadge) sidebarBadge.innerText = bookings.length;

  if (!tbody) return;

  if (bookings.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-5">
          <div class="text-muted mb-2"><i class="fa-solid fa-receipt fa-2x opacity-50"></i></div>
          <h6 class="text-muted fw-bold">No Patients Awaiting Payment</h6>
          <p class="small text-muted mb-0">When a doctor finishes a consultation and sends it to billing, patients will appear here for checkout.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = bookings.map(b => {
    let parsedTreatments = [];
    try {
      parsedTreatments = typeof b.teeth_treatments === 'string' ? JSON.parse(b.teeth_treatments) : (b.teeth_treatments || []);
    } catch (err) {
      parsedTreatments = [];
    }

    let parsedMeds = [];
    try {
      parsedMeds = typeof b.prescription_medicines === 'string' ? JSON.parse(b.prescription_medicines) : (b.prescription_medicines || []);
    } catch (err) {
      parsedMeds = [];
    }

    const treatmentsSummary = Array.isArray(parsedTreatments) && parsedTreatments.length > 0
      ? parsedTreatments.map(t => `<span class="badge bg-light text-dark border me-1 mb-1">T${t.tooth}: ${escapeHtml(t.service)}</span>`).join('')
      : `<span class="text-muted small">${escapeHtml(b.service_name || 'Consultation')}</span>`;

    const medsSummary = Array.isArray(parsedMeds) && parsedMeds.length > 0
      ? `<span class="badge bg-info-subtle text-primary border border-info-subtle"><i class="fa-solid fa-pills me-1"></i>${parsedMeds.length} Meds</span>`
      : (b.handwritten_rx ? `<span class="badge bg-secondary-subtle text-dark"><i class="fa-solid fa-pen-nib me-1"></i>Rx Drawing</span>` : `<span class="text-muted small">None</span>`);

    let estAmount = '₹0.00';
    if (b.amount && parseFloat(b.amount) > 0) {
      estAmount = `₹${parseFloat(b.amount).toFixed(2)}`;
    } else if (Array.isArray(parsedTreatments) && parsedTreatments.length > 0) {
      const sum = parsedTreatments.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);
      estAmount = `₹${sum.toFixed(2)}`;
    } else {
      estAmount = '₹500.00';
    }

    return `
      <tr>
        <td><span class="badge bg-danger fs-6 px-2 py-1">${escapeHtml(b.visual_token || '-')}</span></td>
        <td>
          <div class="fw-bold text-dark">${escapeHtml(b.patient_name)}</div>
          <small class="text-muted"><i class="fa-solid fa-phone me-1"></i>${escapeHtml(b.phone)}</small>
        </td>
        <td><small class="fw-semibold text-secondary">${escapeHtml(getAttendingDoctorName(b.doctor_name))}</small></td>
        <td><div style="max-width: 260px;">${treatmentsSummary}</div></td>
        <td>${medsSummary}</td>
        <td class="fw-bold text-success">${estAmount}</td>
        <td><span class="badge bg-warning text-dark"><i class="fa-solid fa-clock me-1"></i>Awaiting Bill</span></td>
        <td class="text-end">
          <div class="d-flex justify-content-end gap-1 flex-wrap">
            <button type="button" class="btn btn-sm btn-outline-success px-2" onclick="printReceiptWithPrescription(${b.id})" title="Print Combined Official Receipt and Clinical Prescription">
              <i class="fa-solid fa-file-invoice-dollar me-1"></i> Rx + Receipt
            </button>

            <button type="button" class="btn btn-sm btn-outline-secondary px-2" onclick="printBillingInvoice(${b.id})" title="Print Bill / Invoice">
              <i class="fa-solid fa-print"></i>
            </button>
            <button type="button" class="btn btn-sm btn-success fw-bold px-2 px-md-3 shadow-sm" onclick="openPaymentDeskCheckout(${b.id})">
              <i class="fa-solid fa-cash-register me-1"></i> Collect Bill
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterBillingQueue() {
  const q = document.getElementById('billingQueueSearch')?.value.toLowerCase() || '';
  if (!q) {
    renderBillingQueue(allBillingQueueBookings);
    return;
  }
  const filtered = allBillingQueueBookings.filter(b => 
    (b.patient_name && b.patient_name.toLowerCase().includes(q)) ||
    (b.phone && b.phone.includes(q)) ||
    (b.visual_token && b.visual_token.toLowerCase().includes(q)) ||
    (b.booking_code && b.booking_code.toLowerCase().includes(q))
  );
  renderBillingQueue(filtered);
}

async function updateBillingDeskStats(allBookings) {
  try {
    const finRes = await fetch('/api/finance/overview', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const finData = await finRes.json();
    if (finData.success && finData.stats) {
      const todayRevEl = document.getElementById('billingTodayCollections');
      const pendingDuesEl = document.getElementById('billingPendingDues');
      if (todayRevEl) todayRevEl.innerText = formatINR(finData.stats.todayRevenue);
      if (pendingDuesEl) pendingDuesEl.innerText = formatINR(finData.stats.totalOutstanding);
    }
  } catch (err) {}
}

async function updateBillingDeskBadge() {
  try {
    const res = await fetch('/api/bookings?status=Awaiting Payment', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const data = await res.json();
    if (data.success && data.bookings) {
      const sidebarBadge = document.getElementById('sidebarBillingBadge');
      if (sidebarBadge) sidebarBadge.innerText = data.bookings.length;
    }
  } catch(e) {}
}

async function loadBillingOutstandingDues() {
  const tbody = document.getElementById('billingOutstandingTbody');
  if (!tbody) return;
  try {
    const res = await fetch('/api/patients', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const data = await res.json();
    if (data.success && data.patients) {
      const withDues = data.patients.filter(p => parseFloat(p.outstanding_balance) > 0);
      if (withDues.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-3">No patients have outstanding dues.</td></tr>`;
        return;
      }
      tbody.innerHTML = withDues.slice(0, 5).map(p => `
        <tr>
          <td><span class="badge bg-light text-dark border">${p.patient_code}</span></td>
          <td class="fw-semibold text-dark">${escapeHtml(p.name)}</td>
          <td>${escapeHtml(p.phone)}</td>
          <td class="fw-bold text-danger">₹${parseFloat(p.outstanding_balance).toFixed(2)}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-success" onclick="openCollectBalanceModal(${p.id}, '${escapeHtml(p.name)}', ${p.outstanding_balance})">
              <i class="fa-solid fa-hand-holding-dollar me-1"></i> Collect
            </button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {}
}

function openPaymentDeskCheckout(bookingId) {
  const b = allBillingQueueBookings.find(x => x.id === parseInt(bookingId)) || (allBookingsList && allBookingsList.find(x => x.id === parseInt(bookingId)));
  if (!b) {
    showToast('Booking record not found.', 'danger');
    return;
  }
  currentCheckoutBooking = b;

  document.getElementById('pay_booking_id').value = b.id;
  document.getElementById('pay_patient_name').innerText = b.patient_name;
  document.getElementById('pay_visual_token').innerText = b.visual_token || '-';
  document.getElementById('pay_doctor_name').innerText = getAttendingDoctorName(b.doctor_name);

  paymentLineItems = [];

  // Parse teeth treatments saved by doctor
  let treatments = [];
  try {
    treatments = typeof b.teeth_treatments === 'string' ? JSON.parse(b.teeth_treatments) : (b.teeth_treatments || []);
  } catch (e) {
    treatments = [];
  }

  if (Array.isArray(treatments) && treatments.length > 0) {
    treatments.forEach(t => {
      paymentLineItems.push({
        name: t.service,
        detail: `Tooth ${t.tooth} (${t.tooth_name || 'Tooth'})`,
        price: parseFloat(t.price || 0)
      });
    });
  } else {
    const srv = availableDentalServices.find(s => s.name === b.service_name);
    paymentLineItems.push({
      name: b.service_name || 'Dental Consultation',
      detail: 'Clinical Examination',
      price: srv ? parseFloat(srv.price) : 500
    });
  }

  // Doctor Authorized Discount:
  const doctorDiscount = parseFloat(b.discount || 0);
  const docDiscDisplay = document.getElementById('pay_doctor_discount_display');
  if (docDiscDisplay) {
    docDiscDisplay.innerText = doctorDiscount > 0 ? `-₹${doctorDiscount.toLocaleString('en-IN', {minimumFractionDigits: 2})}` : '₹0.00';
    docDiscDisplay.dataset.amount = doctorDiscount;
  }

  // Reset Cashier discount & default payment mode to Cash
  const payDiscInput = document.getElementById('pay_discount');
  if (payDiscInput) payDiscInput.value = "0.00";

  const notesEl = document.getElementById('pay_notes');
  if (notesEl) notesEl.value = b.notes || '';

  // Initialize Compulsory UTR / Transaction Reference field
  const refInput = document.getElementById('pay_transaction_ref');
  if (refInput) {
    refInput.value = b.transaction_ref || b.reference_no || '';
    refInput.classList.remove('is-invalid');
  }

  // Reset payment status to 'Paid' and clear partial amount
  const statusSelect = document.getElementById('pay_status');
  if (statusSelect) statusSelect.value = 'Paid';
  const partialInput = document.getElementById('pay_partial_amount');
  if (partialInput) partialInput.value = '';

  selectPaymentMode('Cash', document.querySelector('.payment-mode-tile'));

  renderPaymentItemsTable();
  handlePaymentStatusChange();

  new bootstrap.Modal(document.getElementById('paymentModal')).show();
}

function renderPaymentItemsTable() {
  const tbody = document.getElementById('paymentItemsTbody');
  if (!tbody) return;

  tbody.innerHTML = paymentLineItems.map((item, idx) => `
    <tr>
      <td>
        <strong class="text-dark">${escapeHtml(item.name)}</strong>
      </td>
      <td><small class="text-muted">${escapeHtml(item.detail)}</small></td>
      <td class="text-end">
        <input type="number" step="0.01" class="form-control form-control-sm text-end fw-bold" value="${item.price}" onchange="updatePaymentItemPrice(${idx}, this.value)">
      </td>
      <td class="text-center">
        <button type="button" class="btn btn-sm btn-link text-danger p-0" onclick="removePaymentItem(${idx})">
          <i class="fa-solid fa-times"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function updatePaymentItemPrice(idx, newPrice) {
  paymentLineItems[idx].price = parseFloat(newPrice || 0);
  recalculatePaymentTotals();
}

function removePaymentItem(idx) {
  paymentLineItems.splice(idx, 1);
  renderPaymentItemsTable();
  recalculatePaymentTotals();
}

// Add Additional Item button (e.g. X-Ray, sterilization fee)
function addAdditionalPaymentItem() {
  const itemName = prompt('Enter Additional Item Name (e.g. Dental X-Ray, Post-Op Medication Kit):', 'Digital X-Ray');
  if (!itemName) return;
  const itemPrice = parseFloat(prompt(`Enter Price for "${itemName}" in ₹:`, '500') || 0);

  paymentLineItems.push({
    name: itemName,
    detail: 'Additional Clinic Charge',
    price: itemPrice
  });

  renderPaymentItemsTable();
  recalculatePaymentTotals();
  showToast(`Added "${itemName}" to payment items.`, 'success');
}

function selectPaymentMode(mode, tileEl) {
  document.getElementById('pay_selected_mode').value = mode;
  document.querySelectorAll('.payment-mode-tile').forEach(t => t.classList.remove('selected'));
  if (tileEl) tileEl.classList.add('selected');

  // Update dynamic placeholder and guidance for compulsory transaction reference
  const refInput = document.getElementById('pay_transaction_ref');
  if (refInput) {
    refInput.classList.remove('is-invalid');
    if (mode === 'UPI') {
      refInput.placeholder = 'Enter 12-digit UPI UTR / Ref No. (e.g. 428901234567)';
    } else if (mode === 'Card') {
      refInput.placeholder = 'Enter Card Approval / Auth Code / Txn Ref No.';
    } else if (mode === 'Cash') {
      refInput.placeholder = 'Enter Cash Register Receipt / Voucher No. (e.g. C-1042)';
    } else {
      refInput.placeholder = 'Enter Bank Transaction / Check / Ref No.';
    }
  }
}

function handlePaymentStatusChange() {
  const statusSelect = document.getElementById('pay_status');
  const paymentStatus = statusSelect ? statusSelect.value : 'Paid';
  const partialContainer = document.getElementById('pay_partial_container');
  const partialInput = document.getElementById('pay_partial_amount');

  if (paymentStatus === 'Partial') {
    if (partialContainer) partialContainer.classList.remove('d-none');
    // Pre-calculate 50% if currently empty or zero
    if (partialInput && (!partialInput.value || parseFloat(partialInput.value) <= 0)) {
      const subtotal = paymentLineItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
      const docDiscDisplay = document.getElementById('pay_doctor_discount_display');
      const doctorDiscount = parseFloat(docDiscDisplay?.dataset?.amount || (currentCheckoutBooking && currentCheckoutBooking.discount) || 0);
      const cashierDiscount = parseFloat(document.getElementById('pay_discount')?.value || 0);
      const totalDiscount = Math.min(subtotal, Math.max(0, doctorDiscount + cashierDiscount));
      const finalAmount = Math.max(0, subtotal - totalDiscount);
      const half = Math.round(finalAmount / 2);
      partialInput.value = half > 0 ? half.toFixed(2) : "0.00";
    }
    if (partialInput) {
      setTimeout(() => { partialInput.focus(); partialInput.select(); }, 100);
    }
  } else {
    if (partialContainer) partialContainer.classList.add('d-none');
  }
  recalculatePaymentTotals();
}

function setPartialPercentage(percent) {
  const subtotal = paymentLineItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  const docDiscDisplay = document.getElementById('pay_doctor_discount_display');
  const doctorDiscount = parseFloat(docDiscDisplay?.dataset?.amount || (currentCheckoutBooking && currentCheckoutBooking.discount) || 0);
  const cashierDiscount = parseFloat(document.getElementById('pay_discount')?.value || 0);
  const totalDiscount = Math.min(subtotal, Math.max(0, doctorDiscount + cashierDiscount));
  const finalAmount = Math.max(0, subtotal - totalDiscount);

  const amount = Math.round((finalAmount * percent) / 100);
  const partialInput = document.getElementById('pay_partial_amount');
  if (partialInput) {
    partialInput.value = amount.toFixed(2);
  }
  recalculatePaymentTotals();
}

function recalculatePaymentTotals() {
  const subtotal = paymentLineItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  const docDiscDisplay = document.getElementById('pay_doctor_discount_display');
  const doctorDiscount = parseFloat(docDiscDisplay?.dataset?.amount || (currentCheckoutBooking && currentCheckoutBooking.discount) || 0);
  const cashierDiscount = parseFloat(document.getElementById('pay_discount')?.value || 0);
  const totalDiscount = Math.min(subtotal, Math.max(0, doctorDiscount + cashierDiscount));
  const finalAmount = Math.max(0, subtotal - totalDiscount);

  if (document.getElementById('pay_subtotal')) {
    document.getElementById('pay_subtotal').innerText = `₹${subtotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
  }
  if (document.getElementById('pay_doctor_discount_display')) {
    document.getElementById('pay_doctor_discount_display').innerText = doctorDiscount > 0 ? `-₹${doctorDiscount.toLocaleString('en-IN', {minimumFractionDigits: 2})}` : '₹0.00';
  }
  if (document.getElementById('pay_total_discount_display')) {
    document.getElementById('pay_total_discount_display').innerText = totalDiscount > 0 ? `-₹${totalDiscount.toLocaleString('en-IN', {minimumFractionDigits: 2})}` : '₹0.00';
  }
  if (document.getElementById('pay_final_amount')) {
    document.getElementById('pay_final_amount').innerText = `₹${finalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
  }

  // Handle Payment Status: Paid vs Partial vs Pending
  const statusSelect = document.getElementById('pay_status');
  const paymentStatus = statusSelect ? statusSelect.value : 'Paid';
  const partialContainer = document.getElementById('pay_partial_container');
  const partialCalcBreakdown = document.getElementById('pay_partial_calc_breakdown');
  const partialInput = document.getElementById('pay_partial_amount');
  const remainingDueDisplay = document.getElementById('pay_remaining_due_display');
  const calcPaidAmount = document.getElementById('pay_calc_paid_amount');
  const calcDueAmount = document.getElementById('pay_calc_due_amount');

  if (paymentStatus === 'Partial') {
    if (partialContainer) partialContainer.classList.remove('d-none');
    if (partialCalcBreakdown) partialCalcBreakdown.classList.remove('d-none');

    let enteredPaid = parseFloat(partialInput?.value);
    if (isNaN(enteredPaid) || enteredPaid < 0) {
      enteredPaid = 0;
    }
    // Cap at finalAmount
    if (enteredPaid > finalAmount) {
      enteredPaid = finalAmount;
      if (partialInput) partialInput.value = finalAmount.toFixed(2);
    }

    const dueAmount = Math.max(0, finalAmount - enteredPaid);

    if (remainingDueDisplay) {
      remainingDueDisplay.innerText = `₹${dueAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    }
    if (calcPaidAmount) {
      calcPaidAmount.innerText = `₹${enteredPaid.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    }
    if (calcDueAmount) {
      calcDueAmount.innerText = `₹${dueAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    }
  } else if (paymentStatus === 'Pending') {
    if (partialContainer) partialContainer.classList.add('d-none');
    if (partialCalcBreakdown) partialCalcBreakdown.classList.remove('d-none');

    if (calcPaidAmount) {
      calcPaidAmount.innerText = `₹0.00`;
    }
    if (calcDueAmount) {
      calcDueAmount.innerText = `₹${finalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    }
  } else {
    // Paid in full
    if (partialContainer) partialContainer.classList.add('d-none');
    if (partialCalcBreakdown) partialCalcBreakdown.classList.add('d-none');
  }
}

// Confirm Payment & Record in Finance
async function submitPaymentCheckout() {
  const bookingId = document.getElementById('pay_booking_id').value;
  if (!bookingId) return;

  const subtotal = paymentLineItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  const docDiscDisplay = document.getElementById('pay_doctor_discount_display');
  const doctorDiscount = parseFloat(docDiscDisplay?.dataset?.amount || (currentCheckoutBooking && currentCheckoutBooking.discount) || 0);
  const cashierDiscount = parseFloat(document.getElementById('pay_discount')?.value || 0);
  const totalDiscount = Math.min(subtotal, Math.max(0, doctorDiscount + cashierDiscount));
  const finalAmount = Math.max(0, subtotal - totalDiscount);
  const paymentMode = document.getElementById('pay_selected_mode')?.value || selectedPaymentMode || 'Cash';
  const paymentStatus = document.getElementById('pay_status')?.value || 'Paid';

  // Determine paid amount and remaining balance due
  let paidAmount = finalAmount;
  let dueAmount = 0;

  if (paymentStatus === 'Partial') {
    const rawPartial = parseFloat(document.getElementById('pay_partial_amount')?.value);
    if (isNaN(rawPartial) || rawPartial <= 0) {
      showToast('Please enter a valid partial amount paid by the patient (greater than ₹0).', 'warning');
      const pInput = document.getElementById('pay_partial_amount');
      if (pInput) {
        pInput.focus();
        pInput.classList.add('is-invalid');
      }
      return;
    }
    if (rawPartial >= finalAmount) {
      paidAmount = finalAmount;
      dueAmount = 0;
      showToast('Entered amount covers full bill. Processed as Paid in Full.', 'info');
      document.getElementById('pay_status').value = 'Paid';
    } else {
      paidAmount = rawPartial;
      dueAmount = Math.max(0, finalAmount - paidAmount);
    }
  } else if (paymentStatus === 'Pending') {
    paidAmount = 0;
    dueAmount = finalAmount;
  } else {
    paidAmount = finalAmount;
    dueAmount = 0;
  }

  // Validate Compulsory Transaction / UTR / Reference Number
  const transactionRef = (document.getElementById('pay_transaction_ref')?.value || '').trim();
  if (paymentStatus !== 'Pending' && !transactionRef) {
    showToast('Transaction / UTR Reference Number is COMPULSORY for clinic audit and payment verification.', 'warning');
    const refInput = document.getElementById('pay_transaction_ref');
    if (refInput) {
      refInput.focus();
      refInput.classList.add('is-invalid');
    }
    return;
  }

  const b = currentCheckoutBooking;
  const notes = (b && b.notes) || (b && b.clinical_notes) || 'Clinical procedure completed.';
  const nextDate = (b && b.next_appointment_date) || document.getElementById('dn_next_date')?.value || null;
  const nextTime = (b && b.next_appointment_time) || document.getElementById('dn_next_time')?.value || null;

  const payload = {
    amount: subtotal,
    discount: totalDiscount,
    doctor_discount: doctorDiscount,
    cashier_discount: cashierDiscount,
    final_amount: finalAmount,
    paid_amount: paidAmount,
    due_amount: dueAmount,
    payment_mode: paymentMode,
    payment_status: paymentStatus,
    transaction_ref: transactionRef,
    reference_no: transactionRef,
    notes: notes,
    treatment_performed: (b && b.treatment_performed) || notes,
    treatment_description: (b && b.treatment_performed) || '',
    prescription: (b && b.prescription) || '',
    prescription_medicines: (b && b.prescription_medicines) || prescribedMedicinesList,
    handwritten_rx: (b && b.handwritten_rx) || getCanvasDrawingData(),
    teeth_treatments: (b && b.teeth_treatments) || selectedToothTreatments,
    additional_items: paymentLineItems,
    next_appointment_date: nextDate,
    next_appointment_time: nextTime
  };

  try {
    const btn = document.getElementById('pay_submitBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i> Processing Payment...';

    const res = await fetch(`/api/bookings/${bookingId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-circle-check me-2"></i> Confirm Payment & Record in Finance';

    if (data.success) {
      bootstrap.Modal.getInstance(document.getElementById('paymentModal'))?.hide();
      
      if (paymentStatus === 'Partial') {
        showToast(`Partial payment of ₹${paidAmount.toFixed(2)} recorded! Remaining due of ₹${dueAmount.toFixed(2)} added to Patient Ledger.`, 'success');
      } else if (paymentStatus === 'Pending') {
        showToast(`Payment of ₹${finalAmount.toFixed(2)} recorded as Pending. Added to Patient Ledger.`, 'warning');
      } else {
        showToast(`Payment of ₹${finalAmount.toFixed(2)} recorded in Finance! Consultation finished.`, 'success');
      }

      currentCheckoutBooking = null;
      loadPaymentDesk();
      updateBillingDeskBadge();
      fetchOnlineBookings();
      fetchWalkinBookings();
      loadDashboardStats();
      loadFinanceOverview();

      // Show Printable Invoice
      printInvoiceModal(bookingId);
    } else {
      showToast(data.message || 'Error completing payment.', 'danger');
    }
  } catch (e) {
    showToast('Failed to record payment.', 'danger');
  }
}

// ========================================================
// 10. FINANCE WORKSPACE: REVENUE, PAYMENTS & EXPENSES
// ========================================================
async function loadFinanceOverview() {
  try {
    const res = await fetch('/api/finance/overview', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const data = await res.json();
    if (data.success && data.stats) {
      const s = data.stats;
      if (document.getElementById('finTotalRevenue')) document.getElementById('finTotalRevenue').innerText = formatINR(s.totalRevenue);
      if (document.getElementById('finMonthlyRevenue')) document.getElementById('finMonthlyRevenue').innerText = formatINR(s.monthlyRevenue || 0);
      if (document.getElementById('finCurrentMonthName')) document.getElementById('finCurrentMonthName').innerText = s.currentMonthName || 'Current Month';
      if (document.getElementById('finTodayRevenue')) document.getElementById('finTodayRevenue').innerText = formatINR(s.todayRevenue);
      if (document.getElementById('finTotalExpenses')) document.getElementById('finTotalExpenses').innerText = formatINR(s.totalExpenses);
      if (document.getElementById('finNetProfit')) document.getElementById('finNetProfit').innerText = formatINR(s.netProfit);
      if (document.getElementById('outstandingTotalBadge')) document.getElementById('outstandingTotalBadge').innerText = `Total Dues: ${formatINR(s.totalOutstanding)}`;

      // Analytics Tab Monthly Performance Card
      if (document.getElementById('finAnalyticsMonthLabel')) document.getElementById('finAnalyticsMonthLabel').innerText = s.currentMonthName || 'Current Month';
      if (document.getElementById('finAnalyticsMonthBadge')) document.getElementById('finAnalyticsMonthBadge').innerText = s.currentMonthName || 'Active Month';
      if (document.getElementById('finAnalyticsMonthRevenue')) document.getElementById('finAnalyticsMonthRevenue').innerText = formatINR(s.monthlyRevenue || 0);
      if (document.getElementById('finAnalyticsMonthExpenses')) document.getElementById('finAnalyticsMonthExpenses').innerText = formatINR(s.monthlyExpenses || 0);
      if (document.getElementById('finAnalyticsMonthProfit')) document.getElementById('finAnalyticsMonthProfit').innerText = formatINR(s.monthlyNetProfit || 0);

      // Payment Modes Chart
      const pieCtx = document.getElementById('paymentModePieChart')?.getContext('2d');
      if (pieCtx && s.paymentModes) {
        if (paymentModePieInstance) paymentModePieInstance.destroy();
        paymentModePieInstance = new Chart(pieCtx, {
          type: 'pie',
          data: {
            labels: ['Cash', 'Card', 'UPI', 'Other'],
            datasets: [{
              data: [s.paymentModes.Cash, s.paymentModes.Card, s.paymentModes.UPI, s.paymentModes.Other],
              backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#6b7280']
            }]
          },
          options: { responsive: true, maintainAspectRatio: false }
        });
      }
    }
  } catch (e) {
    console.error('Error loading finance overview:', e);
  }
}

async function renderFinancePayments() {
  const tbody = document.getElementById('financePaymentsTbody');
  if (!tbody) return;

  const search = document.getElementById('paymentSearchInput')?.value || '';
  const mode = document.getElementById('paymentModeFilter')?.value || '';
  const date = document.getElementById('paymentDateFilter')?.value || '';

  try {
    const query = new URLSearchParams({ search, payment_mode: mode, date }).toString();
    const res = await fetch(`/api/finance/payments?${query}`, {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const data = await res.json();
    if (data.success && data.payments) {
      if (data.payments.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">No payment transactions found.</td></tr>`;
        return;
      }

      tbody.innerHTML = data.payments.map(p => {
        const modeBadge = p.payment_mode === 'UPI' ? 'bg-purple text-white' : p.payment_mode === 'Card' ? 'bg-primary text-white' : 'bg-success text-white';
        return `
          <tr>
            <td><small class="fw-semibold text-muted">${p.appointment_date}</small></td>
            <td><span class="badge bg-light text-dark border fw-bold">${p.visual_token || 'REC'}</span></td>
            <td>
              <div class="fw-semibold text-dark">${escapeHtml(p.patient_name)}</div>
              <small class="text-muted">${p.phone}</small>
            </td>
            <td><span class="badge bg-light text-dark border">${escapeHtml(p.service_name)}</span></td>
            <td><span class="badge ${modeBadge} px-2 py-1">${p.payment_mode || 'Cash'}</span></td>
            <td class="text-end">
              ${p.payment_status === 'Partial' ? `
                <span class="fw-bold text-success">${formatINR(p.paid_amount !== undefined ? p.paid_amount : p.final_amount)}</span>
                <small class="text-muted d-block" style="font-size: 0.70rem;">Total: ${formatINR(p.final_amount || p.amount)}</small>
              ` : p.payment_status === 'Pending' ? `
                <span class="fw-bold text-muted">₹0.00</span>
                <small class="text-danger d-block" style="font-size: 0.70rem;">Total: ${formatINR(p.final_amount || p.amount)}</small>
              ` : `
                <span class="fw-bold text-success">${formatINR(p.final_amount || p.amount)}</span>
              `}
            </td>
            <td>
              ${p.payment_status === 'Partial' ? `
                <span class="badge bg-warning text-dark"><i class="fa-solid fa-clock-rotate-left me-1"></i>Partial</span>
                <small class="text-danger d-block fw-semibold" style="font-size: 0.70rem;">Due: ${formatINR(p.due_amount || (parseFloat(p.final_amount||0) - parseFloat(p.paid_amount||0)))}</small>
              ` : p.payment_status === 'Pending' ? `
                <span class="badge bg-danger text-white"><i class="fa-solid fa-triangle-exclamation me-1"></i>Pending</span>
              ` : `
                <span class="badge bg-success"><i class="fa-solid fa-circle-check me-1"></i>Paid</span>
              `}
            </td>
            <td class="text-center">
              <button class="btn btn-sm btn-outline-success py-0 px-2 me-1" onclick="printReceiptWithPrescription(${p.booking_id || p.id})" title="Print Receipt + Prescription">
                <i class="fa-solid fa-file-invoice-dollar me-1"></i> Receipt + Rx
              </button>
              <button class="btn btn-sm btn-outline-secondary py-0 px-2" onclick="printInvoiceModal(${p.booking_id || p.id})" title="Print Invoice">
                <i class="fa-solid fa-print"></i>
              </button>
            </td>

          </tr>
        `;
      }).join('');
    }
  } catch (e) {
    console.error('Error rendering finance payments:', e);
  }
}

async function renderFinanceExpenses() {
  const tbody = document.getElementById('financeExpensesTbody');
  if (!tbody) return;

  const category = document.getElementById('expenseCategoryFilter')?.value || '';

  try {
    const query = new URLSearchParams({ category }).toString();
    const res = await fetch(`/api/finance/expenses?${query}`, {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const data = await res.json();
    if (data.success && data.expenses) {
      if (data.expenses.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No expense entries found.</td></tr>`;
        return;
      }

      tbody.innerHTML = data.expenses.map(e => `
        <tr>
          <td><small class="text-muted fw-semibold">${e.date}</small></td>
          <td><strong class="text-dark">${escapeHtml(e.title)}</strong></td>
          <td><span class="badge bg-light text-dark border">${escapeHtml(e.category)}</span></td>
          <td class="text-end fw-bold text-danger">${formatINR(e.amount)}</td>
          <td><small class="text-muted">${escapeHtml(e.notes || '-')}</small></td>
          <td class="text-center">
            <button class="btn btn-sm btn-link text-danger p-0" onclick="deleteExpenseEntry(${e.id})" title="Delete">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        </tr>
      `).join('');
    }
  } catch (e) {
    console.error('Error rendering finance expenses:', e);
  }
}

function openNewExpenseModal() {
  document.getElementById('expenseForm').reset();
  document.getElementById('exp_date').value = new Date().toISOString().split('T')[0];
  new bootstrap.Modal(document.getElementById('expenseModal')).show();
}

async function submitNewExpense() {
  const payload = {
    title: document.getElementById('exp_title').value,
    category: document.getElementById('exp_category').value,
    amount: parseFloat(document.getElementById('exp_amount').value),
    date: document.getElementById('exp_date').value,
    notes: document.getElementById('exp_notes').value
  };

  try {
    const res = await fetch('/api/finance/expenses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      bootstrap.Modal.getInstance(document.getElementById('expenseModal')).hide();
      showToast('Clinic expense recorded successfully!', 'success');
      renderFinanceExpenses();
      loadFinanceOverview();
    } else {
      showToast(data.message || 'Error saving expense.', 'danger');
    }
  } catch (e) {
    showToast('Failed to save expense.', 'danger');
  }
}

async function deleteExpenseEntry(id) {
  if (!confirm('Are you sure you want to delete this expense record?')) return;
  try {
    const res = await fetch(`/api/finance/expenses/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Expense record deleted.', 'info');
      renderFinanceExpenses();
      loadFinanceOverview();
    }
  } catch (e) {
    showToast('Error deleting expense.', 'danger');
  }
}

async function renderOutstandingBalances() {
  const tbody = document.getElementById('outstandingBalancesTbody');
  if (!tbody) return;

  try {
    const res = await fetch('/api/patients', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const data = await res.json();
    if (data.success && data.patients) {
      const withDues = data.patients.filter(p => parseFloat(p.outstanding_balance || 0) > 0);
      if (withDues.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-success py-4"><i class="fa-solid fa-circle-check me-2"></i>All patient accounts are fully cleared! No outstanding balances.</td></tr>`;
        return;
      }

      tbody.innerHTML = withDues.map(p => `
        <tr>
          <td><strong class="text-dark">${p.patient_code}</strong></td>
          <td><span class="fw-semibold text-dark">${escapeHtml(p.name)}</span></td>
          <td>${p.phone}</td>
          <td><small class="text-muted">${p.created_at ? p.created_at.split('T')[0] : 'Recent'}</small></td>
          <td class="text-end fw-bold text-danger">${formatINR(p.outstanding_balance)}</td>
          <td class="text-center">
            <button class="btn btn-sm btn-success rounded-pill px-3" onclick="openCollectBalanceModal(${p.id}, '${escapeHtml(p.name)}', ${p.outstanding_balance})">
              <i class="fa-solid fa-hand-holding-dollar me-1"></i> Collect Payment
            </button>
          </td>
        </tr>
      `).join('');
    }
  } catch (e) {
    console.error('Error rendering outstanding balances:', e);
  }
}

function openCollectBalanceModal(patientId, name, balance) {
  document.getElementById('cb_patient_id').value = patientId;
  document.getElementById('cb_patient_name').innerText = name;
  document.getElementById('cb_current_due').innerText = `Total Balance Due: ${formatINR(balance)}`;
  document.getElementById('cb_amount').value = balance;
  new bootstrap.Modal(document.getElementById('collectBalanceModal')).show();
}

async function submitCollectBalance() {
  const patientId = document.getElementById('cb_patient_id').value;
  const amount = parseFloat(document.getElementById('cb_amount').value);
  const mode = document.getElementById('cb_payment_mode').value;
  const notes = document.getElementById('cb_notes').value;

  try {
    const res = await fetch('/api/finance/collect-balance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify({ patient_id: patientId, amount_paid: amount, payment_mode: mode, notes })
    });
    const data = await res.json();
    if (data.success) {
      bootstrap.Modal.getInstance(document.getElementById('collectBalanceModal')).hide();
      showToast(data.message, 'success');
      renderOutstandingBalances();
      renderFinancePayments();
      loadFinanceOverview();
    } else {
      showToast(data.message || 'Error collecting payment.', 'danger');
    }
  } catch (e) {
    showToast('Failed to record balance collection.', 'danger');
  }
}

// ========================================================
// 11. SERVICES & DOCTOR MANAGEMENT
// ========================================================
async function loadServicesCatalog() {
  try {
    const res = await fetch('/api/services');
    const data = await res.json();
    if (data.success && data.services) {
      availableDentalServices = data.services;
      renderServicesCatalogTable(data.services);
    }
  } catch (e) {
    console.error('Error loading services catalog:', e);
  }
}

function filterServicesCatalog() {
  const q = (document.getElementById('serviceSearchInput')?.value || '').toLowerCase();
  const filtered = availableDentalServices.filter(s =>
    s.name.toLowerCase().includes(q) || (s.category || '').toLowerCase().includes(q)
  );
  renderServicesCatalogTable(filtered);
}

function renderServicesCatalogTable(services) {
  const tbody = document.getElementById('servicesCatalogTbody');
  if (!tbody) return;

  tbody.innerHTML = services.map(s => `
    <tr>
      <td>
        <strong class="text-dark">${escapeHtml(s.name)}</strong>
        ${s.description ? `<small class="text-muted d-block">${escapeHtml(s.description)}</small>` : ''}
      </td>
      <td><span class="badge bg-light text-dark border">${escapeHtml(s.category || 'General')}</span></td>
      <td><small class="text-muted">${s.duration_mins} mins</small></td>
      <td class="text-end fw-bold text-dark">₹${parseFloat(s.price).toLocaleString('en-IN')}.00</td>
      <td>
        <span class="badge ${s.status === 'Active' ? 'bg-success' : 'bg-secondary'}">${s.status || 'Active'}</span>
      </td>
      <td class="text-center">
        <button class="btn btn-sm btn-outline-primary py-0 px-2 me-1" onclick="openEditServiceModal(${s.id})"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-sm btn-outline-danger py-0 px-2" onclick="deleteDentalService(${s.id})"><i class="fa-solid fa-trash-can"></i></button>
      </td>
    </tr>
  `).join('');
}

function openNewServiceModal() {
  document.getElementById('serviceForm').reset();
  document.getElementById('srv_id').value = '';
  document.getElementById('serviceModalTitle').innerHTML = '<i class="fa-solid fa-plus me-2 text-danger"></i>Add Dental Service';
  new bootstrap.Modal(document.getElementById('serviceModal')).show();
}

function openEditServiceModal(id) {
  const s = availableDentalServices.find(item => item.id === id);
  if (!s) return;
  document.getElementById('srv_id').value = s.id;
  document.getElementById('srv_name').value = s.name;
  document.getElementById('srv_category').value = s.category || 'Cleaning';
  document.getElementById('srv_price').value = s.price;
  document.getElementById('srv_duration').value = s.duration_mins || 30;
  document.getElementById('srv_status').value = s.status || 'Active';
  document.getElementById('srv_description').value = s.description || '';
  document.getElementById('serviceModalTitle').innerHTML = '<i class="fa-solid fa-pen me-2 text-danger"></i>Edit Dental Service';
  new bootstrap.Modal(document.getElementById('serviceModal')).show();
}

async function saveDentalService() {
  const id = document.getElementById('srv_id').value;
  const payload = {
    name: document.getElementById('srv_name').value,
    category: document.getElementById('srv_category').value,
    price: parseFloat(document.getElementById('srv_price').value),
    duration_mins: parseInt(document.getElementById('srv_duration').value),
    status: document.getElementById('srv_status').value,
    description: document.getElementById('srv_description').value
  };

  try {
    const url = id ? `/api/services/${id}` : '/api/services';
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      bootstrap.Modal.getInstance(document.getElementById('serviceModal')).hide();
      showToast('Dental service saved successfully!', 'success');
      loadServicesCatalog();
    } else {
      showToast(data.message || 'Error saving service.', 'danger');
    }
  } catch (e) {
    showToast('Failed to save service.', 'danger');
  }
}

async function deleteDentalService(id) {
  if (!confirm('Are you sure you want to delete this dental service?')) return;
  try {
    const res = await fetch(`/api/services/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Service deleted.', 'info');
      loadServicesCatalog();
    }
  } catch (e) {
    showToast('Failed to delete service.', 'danger');
  }
}

// Doctor Management
async function fetchDoctorsList() {
  try {
    const res = await fetch('/api/doctors');
    const data = await res.json();
    if (data.success && data.doctors) {
      renderDoctorsCards(data.doctors);
    }
  } catch (e) {
    console.error('Error fetching doctors:', e);
  }
}

function renderDoctorsCards(doctors) {
  const container = document.getElementById('doctorsCardsContainer');
  if (!container) return;

  container.innerHTML = doctors.map(d => `
    <div class="col-md-6 col-lg-4">
      <div class="glass-card p-4 h-100 d-flex flex-column justify-content-between">
        <div class="d-flex align-items-center gap-3 mb-3">
          <img src="${d.photo_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120'}" class="rounded-circle border" width="60" height="60" style="object-fit: cover;">
          <div>
            <h5 class="fw-bold mb-0 text-dark">${escapeHtml(d.name)}</h5>
            <small class="text-danger fw-semibold">${escapeHtml(d.specialization)}</small>
          </div>
        </div>
        <div class="small text-muted mb-3">
          <div><i class="fa-solid fa-graduation-cap me-2 text-primary"></i>${escapeHtml(d.qualification || 'BDS')}</div>
          <div><i class="fa-solid fa-phone me-2 text-success"></i>${d.contact || '-'}</div>
          <div><i class="fa-solid fa-calendar-check me-2 text-warning"></i>${d.available_days || 'Mon - Sat'} (${d.available_time || '9am - 5pm'})</div>
        </div>
        <div class="d-flex gap-2 border-top pt-2">
          <button class="btn btn-sm btn-outline-secondary flex-grow-1" onclick="openEditDoctorModal(${d.id})"><i class="fa-solid fa-pen me-1"></i> Edit Profile</button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteDoctorEntry(${d.id})" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </div>
    </div>
  `).join('');
}

function openNewDoctorModal() {
  document.getElementById('doctorForm').reset();
  document.getElementById('d_id').value = '';
  document.getElementById('doctorModalTitle').innerHTML = '<i class="fa-solid fa-user-doctor me-2 text-danger"></i>Add Doctor Profile';
  new bootstrap.Modal(document.getElementById('doctorModal')).show();
}

function openEditDoctorModal(id) {
  fetch('/api/doctors')
    .then(r => r.json())
    .then(data => {
      const d = (data.doctors || []).find(item => item.id === id);
      if (!d) return;
      document.getElementById('d_id').value = d.id;
      document.getElementById('d_name').value = d.name;
      document.getElementById('d_specialization').value = d.specialization;
      document.getElementById('d_qualification').value = d.qualification || '';
      document.getElementById('d_experience').value = d.experience || '';
      document.getElementById('d_contact').value = d.contact || '';
      document.getElementById('d_email').value = d.email || '';
      document.getElementById('d_days').value = d.available_days || '';
      document.getElementById('d_time').value = d.available_time || '';
      document.getElementById('doctorModalTitle').innerHTML = '<i class="fa-solid fa-pen me-2 text-danger"></i>Edit Doctor Profile';
      new bootstrap.Modal(document.getElementById('doctorModal')).show();
    });
}

async function deleteDoctorEntry(id) {
  if (!confirm('Are you sure you want to remove this doctor profile?')) return;
  try {
    const res = await fetch(`/api/doctors/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Doctor profile removed.', 'info');
      fetchDoctorsList();
      loadDoctorsDropdown();
    }
  } catch (e) {
    showToast('Failed to delete doctor.', 'danger');
  }
}

async function loadDoctorsDropdown() {
  try {
    const res = await fetch('/api/doctors');
    const data = await res.json();
    if (data.success && data.doctors) {
      const docSelect = document.getElementById('eb_doctor_select');
      if (docSelect) {
        docSelect.innerHTML = data.doctors.map(d => `<option value="${escapeHtml(d.name)}">${escapeHtml(d.name)} (${escapeHtml(d.specialization)})</option>`).join('');
      }
    }
  } catch (e) {}
}

// ========================================================
// 12. PATIENTS DIRECTORY
// ========================================================
let currentPatientDirectoryTab = 'active'; // 'active' | 'deleted'

function setPatientDirectoryTab(tab) {
  currentPatientDirectoryTab = tab;
  const activeTabBtn = document.getElementById('tabActivePatients');
  const deletedTabBtn = document.getElementById('tabDeletedPatients');

  if (tab === 'deleted') {
    activeTabBtn?.classList.remove('active');
    deletedTabBtn?.classList.add('active');
    const thead = document.getElementById('patientsThead');
    if (thead) {
      thead.innerHTML = `
        <tr>
          <th>Patient Code</th>
          <th>Name</th>
          <th>Phone</th>
          <th>Deletion Details</th>
          <th>Medical History</th>
          <th>Balance (₹)</th>
          <th>Admin Action</th>
        </tr>
      `;
    }
  } else {
    deletedTabBtn?.classList.remove('active');
    activeTabBtn?.classList.add('active');
    const thead = document.getElementById('patientsThead');
    if (thead) {
      thead.innerHTML = `
        <tr>
          <th>Patient Code</th>
          <th>Name</th>
          <th>Phone</th>
          <th>Gender & Age</th>
          <th>Medical History</th>
          <th>Allergies</th>
          <th>Balance (₹)</th>
          <th>Actions</th>
        </tr>
      `;
    }
  }

  fetchPatientsList();
}
window.setPatientDirectoryTab = setPatientDirectoryTab;

let currentPatientBifurcation = 'all';

function filterPatientsByBifurcation(category) {
  currentPatientBifurcation = category;
  
  const pills = [
    { key: 'all', activeClass: 'btn-primary', outlineClass: 'btn-outline-primary' },
    { key: 'tomorrow', activeClass: 'btn-danger text-white', outlineClass: 'btn-outline-danger' },
    { key: 'visited_30d', activeClass: 'btn-success text-white', outlineClass: 'btn-outline-success' },
    { key: 'not_visited_30_90d', activeClass: 'btn-info text-dark', outlineClass: 'btn-outline-info text-dark' },
    { key: 'not_visited_90d', activeClass: 'btn-warning text-dark', outlineClass: 'btn-outline-warning text-dark' },
    { key: 'not_visited_180d', activeClass: 'btn-danger text-white', outlineClass: 'btn-outline-danger' },
    { key: 'not_visited_365d', activeClass: 'btn-dark text-white', outlineClass: 'btn-outline-dark' },
    { key: 'never_visited', activeClass: 'btn-secondary text-white', outlineClass: 'btn-outline-secondary' },
    { key: 'payment_pending', activeClass: 'btn-danger text-white', outlineClass: 'btn-outline-danger' }
  ];

  pills.forEach(p => {
    const btn = document.getElementById(`pf-btn-${p.key}`);
    if (btn) {
      // Remove all potential active / outline classes
      btn.className = 'btn btn-sm rounded-pill px-3 fw-semibold ' + (p.key === category ? `active ${p.activeClass}` : p.outlineClass);
    }
  });

  fetchPatientsList();
}
window.filterPatientsByBifurcation = filterPatientsByBifurcation;

async function fetchPatientsList() {
  const search = document.getElementById('patientSearchInput')?.value || '';
  try {
    const res = await fetch(`/api/patients?search=${encodeURIComponent(search)}&status=${currentPatientDirectoryTab}&filter=${currentPatientBifurcation}`, {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const data = await res.json();
    if (data.success && data.patients) {
      // Update badge counts
      const activeBadge = document.getElementById('badgeActivePatientsCount');
      if (activeBadge && data.totalActive !== undefined) activeBadge.innerText = data.totalActive;
      const deletedBadge = document.getElementById('badgeDeletedPatientsCount');
      if (deletedBadge && data.totalDeleted !== undefined) deletedBadge.innerText = data.totalDeleted;

      const counts = data.counts || {};
      const setPillCount = (id, count) => {
        const el = document.getElementById(id);
        if (el) el.innerText = count !== undefined ? count : 0;
      };
      setPillCount('pf-count-all', data.totalActive !== undefined ? data.totalActive : counts.all);
      setPillCount('pf-count-tomorrow', counts.tomorrow !== undefined ? counts.tomorrow : data.totalTomorrow);
      setPillCount('pf-count-visited_30d', counts.visited_30d !== undefined ? counts.visited_30d : data.totalRecent);
      setPillCount('pf-count-not_visited_30_90d', counts.not_visited_30_90d);
      setPillCount('pf-count-not_visited_90d', counts.not_visited_90d !== undefined ? counts.not_visited_90d : data.totalInactive);
      setPillCount('pf-count-not_visited_180d', counts.not_visited_180d);
      setPillCount('pf-count-not_visited_365d', counts.not_visited_365d);
      setPillCount('pf-count-never_visited', counts.never_visited);
      setPillCount('pf-count-payment_pending', counts.payment_pending);

      // Support backward compatibility
      setPillCount('pf-count-recent', counts.visited_30d !== undefined ? counts.visited_30d : data.totalRecent);
      setPillCount('pf-count-inactive', counts.not_visited_90d !== undefined ? counts.not_visited_90d : data.totalInactive);

      renderPatientsTable(data.patients);
    }
  } catch (e) {
    console.error('Error fetching patients:', e);
  }
}

function renderPatientsTable(patients) {
  const tbody = document.getElementById('patientsTbody');
  if (!tbody) return;

  if (patients.length === 0) {
    const emptyMsg = currentPatientDirectoryTab === 'deleted' 
      ? 'No soft-deleted patients in the archive.' 
      : 'No active patients found matching this segment.';
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">${emptyMsg}</td></tr>`;
    return;
  }

  const isAdmin = true;

  if (currentPatientDirectoryTab === 'deleted') {
    // Deleted View
    tbody.innerHTML = patients.map(p => {
      const balance = parseFloat(p.outstanding_balance || 0);
      const balanceBadge = balance > 0 
        ? `<span class="badge bg-danger-subtle text-danger fw-bold">₹${balance.toLocaleString('en-IN')}</span>`
        : `<span class="badge bg-success-subtle text-success">Cleared</span>`;

      const delDate = p.deleted_at ? new Date(p.deleted_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recent';

      return `
        <tr class="table-light">
          <td><strong class="text-muted"><del>${p.patient_code}</del></strong></td>
          <td>
            <div class="fw-semibold text-danger"><del>${escapeHtml(p.name)}</del></div>
            <small class="text-muted">${p.email || 'No email'}</small>
          </td>
          <td><span class="text-muted">${p.phone}</span></td>
          <td>
            <span class="badge bg-danger-subtle text-danger mb-1 d-inline-block">
              <i class="fa-solid fa-trash-can me-1"></i>Soft-Deleted
            </span>
            <div class="small text-muted">By: <strong>${escapeHtml(p.deleted_by || 'admin')}</strong></div>
            <small class="text-muted">${delDate}</small>
          </td>
          <td><small class="text-muted">${escapeHtml(p.medical_history || 'None')}</small></td>
          <td>${balanceBadge}</td>
          <td>
            <button class="btn btn-sm btn-success py-1 px-3 fw-semibold shadow-sm" onclick="restorePatientRecord(${p.id}, '${escapeHtml(p.name)}')" title="Restore Patient and all associated records">
              <i class="fa-solid fa-rotate-left me-1"></i> Restore Patient & Data
            </button>
          </td>
        </tr>
      `;
    }).join('');
    return;
  }

  // Active View
  tbody.innerHTML = patients.map(p => {
    const balance = parseFloat(p.outstanding_balance || 0);
    const balanceBadge = balance > 0 
      ? `<span class="badge bg-danger-subtle text-danger fw-bold">₹${balance.toLocaleString('en-IN')}</span>`
      : `<span class="badge bg-success-subtle text-success">Cleared</span>`;

    const deleteBtn = `
      <button class="btn btn-sm btn-outline-danger py-0 px-2 ms-1" onclick="openSoftDeleteModal(${p.id}, '${escapeHtml(p.name)}', '${p.patient_code}')" title="Soft Delete Patient and all data">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    `;

    return `
      <tr>
        <td>
          <strong class="text-dark">${p.patient_code}</strong>
          <span class="badge bg-primary-subtle text-primary border border-primary-subtle d-block mt-1" style="font-size:0.68rem; width: fit-content;">
            <i class="fa-solid fa-user-group me-1"></i>${escapeHtml(p.relation || 'Self')}
          </span>
        </td>
        <td>
          <div class="fw-semibold text-dark">${escapeHtml(p.name)}</div>
          <small class="text-muted">${p.email || 'No email'}</small>
        </td>
        <td><a href="tel:${p.phone}" class="text-decoration-none text-muted">${p.phone}</a></td>
        <td>
          <div class="small text-muted">Last: <strong>${p.last_visit_date || 'None'}</strong></div>
          <div class="small text-primary">Next: <strong>${p.next_appointment_date || 'None'}</strong></div>
        </td>
        <td><small class="text-muted">${escapeHtml(p.medical_history || 'None')}</small></td>
        <td><small class="text-danger fw-semibold">${escapeHtml(p.allergy || 'None')}</small></td>
        <td>${balanceBadge}</td>
          <td>
            <div class="d-flex align-items-center">
              <button class="btn btn-sm btn-outline-primary py-0 px-2 me-1" onclick="openPatientProfileModal(${p.id})" title="View Complete Medical Profile"><i class="fa-solid fa-eye me-1"></i>View</button>
              <button class="btn btn-sm btn-outline-warning py-0 px-2 me-1 text-dark fw-semibold" onclick="openEditPatientModal(${p.id})" title="Edit Patient Details & Credentials"><i class="fa-solid fa-pen-to-square me-1"></i>Edit</button>
              <button class="btn btn-sm btn-outline-success py-0 px-2 me-1" onclick="printPatientCaseSheet(${p.id})" title="Print Case Sheet"><i class="fa-solid fa-print"></i></button>
              ${deleteBtn}
            </div>
          </td>
      </tr>
    `;
  }).join('');
}

function openSoftDeleteModal(id, name, code) {
  const idEl = document.getElementById('deletePatientId');
  const nameEl = document.getElementById('deletePatientName');
  const codeEl = document.getElementById('deletePatientCode');

  if (idEl) idEl.value = id;
  if (nameEl) nameEl.innerText = name || 'Patient';
  if (codeEl) codeEl.innerText = code ? `Code: ${code}` : '';

  const modalEl = document.getElementById('softDeletePatientModal');
  if (modalEl) {
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }
}
window.openSoftDeleteModal = openSoftDeleteModal;

async function executeSoftDeletePatient() {
  const id = document.getElementById('deletePatientId')?.value;
  if (!id) return;

  const btn = document.getElementById('btnConfirmSoftDelete');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i> Soft Deleting...';
  }

  let data = null;
  try {
    const res = await fetch(`/api/patients/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
      }
    });
    data = await res.json();
  } catch (err) {
    console.error('Error contacting server to delete patient:', err);
    showToast('Network error while deleting patient.', 'danger');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-trash-can me-1"></i> Soft Delete Patient & Data';
    }
    return;
  }

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-trash-can me-1"></i> Soft Delete Patient & Data';
  }

  if (data && data.success) {
    showToast(data.message || 'Patient and all associated records soft-deleted successfully.', 'success');
    
    // Safely hide modals
    const modalEl = document.getElementById('softDeletePatientModal');
    if (modalEl) {
      const modalInstance = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
      modalInstance?.hide();
    }
    const profileModalEl = document.getElementById('patientProfileModal');
    if (profileModalEl) {
      const profileInstance = bootstrap.Modal.getInstance(profileModalEl) || bootstrap.Modal.getOrCreateInstance(profileModalEl);
      profileInstance?.hide();
    }

    // Refresh dependent CRM lists safely
    try {
      await fetchPatientsList();
      await fetchWalkinBookings();
      await fetchOnlineBookings();
      if (typeof loadDashboardStats === 'function') {
        await loadDashboardStats();
      }
      if (typeof populateDoctorPatientSelector === 'function') {
        populateDoctorPatientSelector();
      }
    } catch (refreshErr) {
      console.warn('Post-delete UI refresh warning:', refreshErr);
    }
  } else {
    showToast((data && data.message) || 'Failed to soft delete patient.', 'danger');
  }
}
window.executeSoftDeletePatient = executeSoftDeletePatient;

function deleteActiveProfilePatient() {
  if (!activeProfilePatientId) return;
  fetch(`/api/patients?search=`, { headers: { 'Authorization': `Bearer ${currentToken}` } })
    .then(r => r.json())
    .then(data => {
      const p = (data.patients || []).find(item => item.id === activeProfilePatientId);
      if (p) {
        openSoftDeleteModal(p.id, p.name, p.patient_code);
      } else {
        openSoftDeleteModal(activeProfilePatientId, 'Selected Patient', '');
      }
    });
}
window.deleteActiveProfilePatient = deleteActiveProfilePatient;

async function restorePatientRecord(id, name) {

  if (!confirm(`Are you sure you want to restore patient "${name || 'this patient'}" and all associated bookings and clinical history?`)) {
    return;
  }

  let data = null;
  try {
    const res = await fetch(`/api/patients/${id}/restore`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
      }
    });
    data = await res.json();
  } catch (err) {
    console.error('Error contacting server to restore patient:', err);
    showToast('Network error while restoring patient.', 'danger');
    return;
  }

  if (data && data.success) {
    showToast(data.message || 'Patient and associated records restored successfully!', 'success');
    try {
      await fetchPatientsList();
      await fetchWalkinBookings();
      await fetchOnlineBookings();
      if (typeof loadDashboardStats === 'function') {
        await loadDashboardStats();
      }
      if (typeof populateDoctorPatientSelector === 'function') {
        populateDoctorPatientSelector();
      }
    } catch (refreshErr) {
      console.warn('Post-restore UI refresh warning:', refreshErr);
    }
  } else {
    showToast((data && data.message) || 'Failed to restore patient.', 'danger');
  }
}
window.restorePatientRecord = restorePatientRecord;

function openWalkinModal() {
  const modalEl = document.getElementById('crmWalkinModal');
  if (modalEl) {
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }
}
window.openWalkinModal = openWalkinModal;

function openNewPatientModal() {
  document.getElementById('patientForm')?.reset();
  const pid = document.getElementById('p_id');
  if (pid) pid.value = '';
  const title = document.getElementById('patientModalTitle');
  if (title) title.innerHTML = '<i class="fa-solid fa-user-plus me-2 text-danger"></i>Register New Patient';
  const modalEl = document.getElementById('patientModal');
  if (modalEl) {
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }
}

async function openEditPatientModal(id) {
  try {
    const res = await fetch(`/api/patients/${id}`, {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const data = await res.json();
    if (!data.success || !data.patient) {
      showToast('Patient record could not be loaded.', 'warning');
      return;
    }
    const p = data.patient;
    document.getElementById('p_id').value = p.id;
    document.getElementById('p_name').value = p.name || '';
    document.getElementById('p_phone').value = p.phone || '';
    document.getElementById('p_email').value = p.email || '';
    document.getElementById('p_gender').value = p.gender || 'Male';
    document.getElementById('p_blood').value = p.blood_group || '';
    document.getElementById('p_dob').value = p.dob ? p.dob.split('T')[0] : '';
    document.getElementById('p_emergency').value = p.emergency_contact || '';
    document.getElementById('p_medical').value = p.medical_history || '';
    document.getElementById('p_allergy').value = p.allergy || '';
    document.getElementById('p_medication').value = p.current_medication || '';
    document.getElementById('p_balance').value = p.outstanding_balance || 0;
    document.getElementById('p_address').value = p.address || '';
    const modalTitle = document.getElementById('patientModalTitle');
    if (modalTitle) {
      modalTitle.innerHTML = `<i class="fa-solid fa-pen-to-square me-2 text-danger"></i>Edit Credentials & Details: ${escapeHtml(p.name)} (${p.patient_code || 'P' + p.id})`;
    }
    const modalEl = document.getElementById('patientModal');
    if (modalEl) {
      bootstrap.Modal.getOrCreateInstance(modalEl).show();
    }
  } catch (err) {
    console.error('Error fetching patient details for edit:', err);
    showToast('Failed to load patient credentials.', 'danger');
  }
}
window.openEditPatientModal = openEditPatientModal;

let activeProfilePatientId = null;

function openPatientProfileModal(id) {
  activeProfilePatientId = id;
  fetch(`/api/patients?search=`, { headers: { 'Authorization': `Bearer ${currentToken}` } })
    .then(r => r.json())
    .then(data => {
      const p = (data.patients || []).find(item => item.id === id);
      if (!p) return;
      const body = document.getElementById('patientProfileBody');
      body.innerHTML = `
        <div class="row g-3">
          <div class="col-md-6"><strong>Patient Code:</strong> ${p.patient_code}</div>
          <div class="col-md-6"><strong>Full Name:</strong> ${escapeHtml(p.name)}</div>
          <div class="col-md-6"><strong>Phone:</strong> ${p.phone}</div>
          <div class="col-md-6"><strong>Email:</strong> ${p.email || '-'}</div>
          <div class="col-md-6"><strong>Gender / Blood:</strong> ${p.gender || '-'} (${p.blood_group || 'O+'})</div>
          <div class="col-md-6"><strong>Outstanding Balance:</strong> <span class="text-danger fw-bold">₹${parseFloat(p.outstanding_balance || 0).toLocaleString('en-IN')}</span></div>
          <div class="col-12"><strong>Medical History:</strong> ${escapeHtml(p.medical_history || 'None')}</div>
          <div class="col-12"><strong>Known Allergies:</strong> <span class="text-danger">${escapeHtml(p.allergy || 'None')}</span></div>
          <div class="col-12"><strong>Current Medication:</strong> ${escapeHtml(p.current_medication || 'None')}</div>
          <div class="col-12"><strong>Address:</strong> ${escapeHtml(p.address || '-')}</div>
        </div>
      `;
      new bootstrap.Modal(document.getElementById('patientProfileModal')).show();
    });
}

// Print Patient Case Sheet & Registration Record
async function printPatientCaseSheet(patientId) {
  if (!patientId) {
    showToast('Please select a patient to print case sheet.', 'warning');
    return;
  }
  const modalEl = document.getElementById('patientCaseSheetModal');
  const container = document.getElementById('patientCaseSheetContent');
  if (!modalEl || !container) return;

  try {
    let p = null;
    let visitHistory = [];

    // 1. Fetch patient profile + visit history by ID
    try {
      const res = await fetch(`/api/patients/${patientId}`, {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      const data = await res.json();
      if (data && data.success) {
        p = data.patient;
        visitHistory = data.visitHistory || [];
      }
    } catch(e) {}

    // Fallback search
    if (!p) {
      const res = await fetch(`/api/patients?search=`, {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      const data = await res.json();
      p = (data.patients || []).find(item => item.id === parseInt(patientId));
    }

    if (!p) {
      showToast('Patient record not found.', 'warning');
      return;
    }

    // 2. Correlate with active consultations/bookings for treatment & Rx data
    let relatedBooking = null;
    if (Array.isArray(allBookingsList)) {
      relatedBooking = allBookingsList.find(b => b.phone === p.phone || b.patient_name === p.name || (p.email && b.email === p.email));
    }
    if (!relatedBooking && Array.isArray(allBillingQueueBookings)) {
      relatedBooking = allBillingQueueBookings.find(b => b.phone === p.phone || b.patient_name === p.name);
    }
    if (!relatedBooking && currentConsultationPatient && (currentConsultationPatient.phone === p.phone || currentConsultationPatient.patient_name === p.name)) {
      relatedBooking = currentConsultationPatient;
    }

    let treatments = [];
    if (relatedBooking) {
      try {
        treatments = typeof relatedBooking.teeth_treatments === 'string' ? JSON.parse(relatedBooking.teeth_treatments) : (relatedBooking.teeth_treatments || []);
      } catch(e) { treatments = []; }
    }

    let medicines = [];
    if (relatedBooking) {
      try {
        medicines = typeof relatedBooking.prescription_medicines === 'string' ? JSON.parse(relatedBooking.prescription_medicines) : (relatedBooking.prescription_medicines || []);
      } catch(e) { medicines = []; }
    }

    let nextDates = [];
    if (relatedBooking) {
      try {
        nextDates = typeof relatedBooking.next_appointment_dates === 'string' ? JSON.parse(relatedBooking.next_appointment_dates) : (relatedBooking.next_appointment_dates || []);
      } catch(e) { nextDates = []; }
    }

    const docName = getAttendingDoctorName(p.doctor_name || (relatedBooking ? relatedBooking.doctor_name : null), true);
    const balance = parseFloat(p.outstanding_balance || 0);
    const token = (relatedBooking && relatedBooking.visual_token) ? relatedBooking.visual_token : '-';
    const printDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const printTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    container.innerHTML = `
      <div class="clinical-sheet">
        <!-- Clinic Letterhead -->
        <div class="clinical-letterhead d-flex justify-content-between align-items-start flex-wrap gap-2">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <i class="fa-solid fa-tooth fa-2x" style="color: var(--accent-red);"></i>
              <div>
                <h3 class="clinical-title mb-0">DENTAL CLINIC</h3>
                <div class="clinical-subtitle text-uppercase">Kivex Technology CRM Platform | Multi-Speciality Dental Surgery & Care</div>
              </div>
            </div>
            <div class="small text-muted" style="font-size: 0.78rem;">
              <span>1st Floor, Omkar Plaza, Nikol Naroda Road, Nikol, Ahmedabad - 382350</span><br>
              <span>Ph: +91 98765 43210 | care@dental.com | Reg. No: GUJ/DENT/2024/8892</span>
            </div>
          </div>
          <div class="text-end">
            <span class="badge bg-dark text-white px-3 py-1 text-uppercase" style="font-size: 0.75rem; letter-spacing: 0.05em;">Clinical Case Sheet</span>
            <div class="mt-2 text-muted" style="font-size: 0.78rem;">
              <div><strong>MRN:</strong> <span class="font-monospace text-dark">${escapeHtml(p.patient_code || 'P10001')}</span></div>
              <div><strong>Token:</strong> <span class="badge bg-danger-subtle text-danger border border-danger-subtle">${escapeHtml(token)}</span></div>
              <div><strong>Issued:</strong> ${printDate} ${printTime}</div>
            </div>
          </div>
        </div>

        <!-- Section 1: Patient Demographics -->
        <div class="mb-3">
          <div class="clinical-section-header">
            <i class="fa-solid fa-user-check text-danger"></i> Patient Demographics & Identification
          </div>
          <table class="clinical-table">
            <tbody>
              <tr>
                <td style="width: 25%;"><strong>Patient Name:</strong></td>
                <td style="width: 35%;" class="fw-bold text-dark">${escapeHtml(p.name)}</td>
                <td style="width: 20%;"><strong>Gender / Blood:</strong></td>
                <td style="width: 20%;">${p.gender || 'Not specified'} / <strong>${p.blood_group || 'O+'}</strong></td>
              </tr>
              <tr>
                <td><strong>Contact Mobile:</strong></td>
                <td class="font-monospace">${escapeHtml(p.phone)}</td>
                <td><strong>Date of Birth:</strong></td>
                <td>${p.dob ? p.dob.split('T')[0] : 'N/A'}</td>
              </tr>
              <tr>
                <td><strong>Email Address:</strong></td>
                <td>${escapeHtml(p.email || 'None on record')}</td>
                <td><strong>Emergency Contact:</strong></td>
                <td>${escapeHtml(p.emergency_contact || 'None')}</td>
              </tr>
              <tr>
                <td><strong>Residential Address:</strong></td>
                <td colspan="3">${escapeHtml(p.address || 'Ahmedabad, Gujarat, India')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Section 2: Clinical Risk & Medical History -->
        <div class="mb-3">
          <div class="clinical-section-header">
            <i class="fa-solid fa-shield-heart text-danger"></i> Medical History & Known Allergies
          </div>
          <div class="row g-2">
            <div class="col-md-6">
              <div class="clinical-box p-2 rounded-2">
                <span class="text-muted d-block small fw-bold text-uppercase" style="font-size: 0.7rem;">Systemic Medical Conditions:</span>
                <span class="text-dark small">${escapeHtml(p.medical_history || 'No systemic conditions reported.')}</span>
              </div>
            </div>
            <div class="col-md-3">
              <div class="clinical-box p-2 rounded-2">
                <span class="text-muted d-block small fw-bold text-uppercase" style="font-size: 0.7rem;">Drug / Latex Allergies:</span>
                <span class="small fw-bold ${p.allergy && p.allergy !== 'None' ? 'text-danger' : 'text-success'}">
                  ${escapeHtml(p.allergy || 'No Known Allergies')}
                </span>
              </div>
            </div>
            <div class="col-md-3">
              <div class="clinical-box p-2 rounded-2">
                <span class="text-muted d-block small fw-bold text-uppercase" style="font-size: 0.7rem;">Current Medications:</span>
                <span class="text-dark small">${escapeHtml(p.current_medication || 'None')}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 3: Odontogram & Dental Procedures -->
        <div class="mb-3">
          <div class="clinical-section-header">
            <i class="fa-solid fa-tooth text-danger"></i> Odontogram & Dental Procedures Performed
          </div>
          ${treatments.length > 0 ? `
            <table class="clinical-table">
              <thead>
                <tr>
                  <th style="width: 15%;">Tooth #</th>
                  <th style="width: 35%;">Anatomical Location</th>
                  <th style="width: 35%;">Clinical Procedure</th>
                  <th style="width: 15%; text-align: right;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${treatments.map(t => `
                  <tr>
                    <td class="fw-bold text-danger">Tooth ${t.tooth}</td>
                    <td>${escapeHtml(t.tooth_name || `Tooth ${t.tooth}`)}</td>
                    <td class="fw-semibold text-dark">${escapeHtml(t.service)}</td>
                    <td style="text-align: right;"><span class="badge bg-success-subtle text-success">Completed</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : `
            <div class="p-2 border rounded-2 bg-light text-muted small">
              <i class="fa-solid fa-circle-info me-1"></i> Routine examination & oral hygiene screening completed. No invasive surgical procedures recorded for this visit.
            </div>
          `}
        </div>

        <!-- Section 4: Rx - Prescriptions -->
        <div class="mb-3">
          <div class="clinical-section-header">
            <i class="fa-solid fa-prescription text-danger"></i> Rx - Prescribed Medications
          </div>
          ${medicines.length > 0 ? `
            <table class="clinical-table">
              <thead>
                <tr>
                  <th style="width: 5%;">#</th>
                  <th style="width: 35%;">Medicine Name & Strength</th>
                  <th style="width: 20%;">Dosage & Frequency</th>
                  <th style="width: 20%;">Duration</th>
                  <th style="width: 20%;">Timing / Instructions</th>
                </tr>
              </thead>
              <tbody>
                ${medicines.map((m, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td><strong>${escapeHtml(m.name)}</strong></td>
                    <td>${escapeHtml(m.dosage)}</td>
                    <td>${escapeHtml(m.duration)}</td>
                    <td>${escapeHtml(m.instructions || 'After Food')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : `
            <div class="p-2 border rounded-2 bg-light text-muted small">
              <i class="fa-solid fa-circle-info me-1"></i> No oral medications prescribed during this consultation.
            </div>
          `}
        </div>

        <!-- Section 5: Clinical Notes & Diagnosis -->
        <div class="mb-3">
          <div class="clinical-section-header">
            <i class="fa-solid fa-notes-medical text-danger"></i> Clinical Diagnosis & Doctor Findings
          </div>
          <div class="p-2 border rounded-2 bg-light text-dark small" style="white-space: pre-wrap;">
${escapeHtml(relatedBooking?.clinical_notes || relatedBooking?.notes || 'Comprehensive oral cavity examination performed. Gingival margins healthy, bite alignment normal. Patient instructed on post-treatment oral hygiene.')}
          </div>
        </div>

        <!-- Section 6: Consultation History & Sittings -->
        ${visitHistory.length > 0 ? `
          <div class="mb-3">
            <div class="clinical-section-header">
              <i class="fa-solid fa-calendar-check text-danger"></i> Previous Consultation & Visit Log
            </div>
            <table class="clinical-table">
              <thead>
                <tr>
                  <th>Visit Date</th>
                  <th>Attending Doctor</th>
                  <th>Clinical Diagnosis / Procedure</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${visitHistory.slice(0, 5).map(h => `
                  <tr>
                    <td>${h.appointment_date ? h.appointment_date.split('T')[0] : '-'}</td>
                    <td>${escapeHtml(h.doctor_name || docName)}</td>
                    <td>${escapeHtml(h.treatment_performed || h.service_name || 'Consultation')}</td>
                    <td><span class="badge bg-light text-dark border">Completed</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        <!-- Section 7: Financial Standing & Next Recall -->
        <div class="row g-2 mb-3">
          <div class="col-md-6">
            <div class="clinical-box p-2 rounded-2">
              <div class="d-flex justify-content-between align-items-center">
                <span class="small text-muted fw-bold text-uppercase" style="font-size: 0.72rem;">Account Standing:</span>
                <span class="badge ${balance > 0 ? 'bg-danger-subtle text-danger border border-danger-subtle' : 'bg-success-subtle text-success border border-success-subtle'}">
                  ${balance > 0 ? `Outstanding: ${formatINR(balance)}` : 'Cleared / Paid'}
                </span>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="clinical-box p-2 rounded-2">
              <div class="d-flex justify-content-between align-items-center">
                <span class="small text-muted fw-bold text-uppercase" style="font-size: 0.72rem;">Next Recall:</span>
                <span class="small text-dark fw-semibold">
                  ${nextDates.length > 0 ? `${nextDates[0].date} at ${nextDates[0].time}` : '6 Months Standard Routine Recall'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 8: Sign-off & Seal Block -->
        <div class="d-flex justify-content-between align-items-end pt-3 mt-3 border-top">
          <div class="small text-muted" style="font-size: 0.75rem;">
            <div>* This document is a validated electronic clinical medical record.</div>
            <div>Dental Clinical Information System | Powered by Kivex Technology</div>
          </div>
          <div class="clinical-sign-box">
            <div class="fw-bold text-dark small mb-0">${escapeHtml(docName)}</div>
            <div class="text-muted" style="font-size: 0.72rem;">B.D.S., M.D.S. (Oral & Maxillofacial Surgery)</div>
            <div class="text-muted" style="font-size: 0.7rem;">Authorized Doctor's Seal & Signature</div>
          </div>
        </div>
      </div>
    `;

    new bootstrap.Modal(modalEl).show();
  } catch (err) {
    showToast('Failed to load patient case sheet.', 'danger');
  }
}

function printPatientCaseSheetFromProfile() {
  if (activeProfilePatientId) {
    printPatientCaseSheet(activeProfilePatientId);
  } else {
    showToast('No active patient selected to print.', 'warning');
  }
}

// ========================================================
// 13. SETTINGS & MEDICINE MANAGEMENT DATABASE
// ========================================================
const DEFAULT_MEDICINES = {
  Dental: [
    'Amoxicillin 500mg',
    'Ibuprofen 400mg',
    'Paracetamol 500mg',
    'Chlorhexidine Mouthwash',
    'Metronidazole 400mg',
    'Ketorolac 10mg',
    'Augmentin 625mg',
    'Aceclofenac + Paracetamol'
  ],
  Homoeopathic: [
    'Arnica Montana 200CH',
    'Hypericum 200CH',
    'Plantago Major Q',
    'Staphisagria 30CH',
    'Chamomilla 30CH',
    'Calcarea Fluorica 6X'
  ]
};

function getMedicines() {
  try {
    const stored = localStorage.getItem('clinic_medicines');
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT_MEDICINES));
}

function saveMedicines(medicines) {
  localStorage.setItem('clinic_medicines', JSON.stringify(medicines));
}

function addMedicine() {
  const nameInput = document.getElementById('newMedicineName');
  const catSelect = document.getElementById('newMedicineCategory');
  const name = nameInput.value.trim();
  if (!name) { showToast('Please enter a medicine name.', 'warning'); return; }
  const cat = catSelect.value;
  const medicines = getMedicines();
  if (!medicines[cat]) medicines[cat] = [];
  if (medicines[cat].includes(name)) { showToast('This medicine already exists.', 'warning'); return; }
  medicines[cat].push(name);
  saveMedicines(medicines);
  nameInput.value = '';
  renderMedicineSettings();
  renderQuickMedicines();
  showToast(`"${name}" added to ${cat} Medicines database!`, 'success');
}

function removeMedicine(name, category) {
  const medicines = getMedicines();
  if (medicines[category]) {
    medicines[category] = medicines[category].filter(m => m !== name);
    saveMedicines(medicines);
    renderMedicineSettings();
    renderQuickMedicines();
    showToast(`"${name}" removed.`, 'info');
  }
}

function renderMedicineSettings() {
  const medicines = getMedicines();
  const dentalEl = document.getElementById('settings_dental_medicines');
  const homeoEl = document.getElementById('settings_homeo_medicines');
  if (!dentalEl || !homeoEl) return;

  const renderBadge = (name, cat) =>
    `<span class="badge rounded-pill d-flex align-items-center gap-2 px-3 py-2 ${cat === 'Dental' ? 'bg-primary' : 'bg-success'}" style="font-size: 0.82rem; font-weight: 500;">
      ${escapeHtml(name)}
      <button type="button" onclick="removeMedicine('${name.replace(/'/g, "\\'")}','${cat}')" class="btn-close btn-close-white ms-1" style="font-size: 0.6rem;" title="Remove"></button>
    </span>`;

  dentalEl.innerHTML = (medicines.Dental || []).map(m => renderBadge(m, 'Dental')).join('') || '<small class="text-muted">No dental medicines configured.</small>';
  homeoEl.innerHTML = (medicines.Homoeopathic || []).map(m => renderBadge(m, 'Homoeopathic')).join('') || '<small class="text-muted">No homoeopathic medicines configured.</small>';
}

async function loadClinicSettings() {
  try {
    const res = await fetch('/api/settings', { headers: { 'Authorization': `Bearer ${currentToken}` } });
    const data = await res.json();
    if (data.success && data.settings) {
      const s = data.settings;
      const clinicName = s.clinic_name || 'Dental';
      const clinicSubtitle = s.clinic_subtitle || 'Kivex Technology';

      // Update Top-Left Sidebar Brand in real time
      const sidebarNameEl = document.getElementById('sidebarClinicName');
      if (sidebarNameEl) sidebarNameEl.textContent = clinicName;

      const sidebarSubEl = document.getElementById('sidebarClinicSubtitle');
      if (sidebarSubEl) sidebarSubEl.textContent = clinicSubtitle;

      // Update Document Title
      if (clinicName) {
        document.title = `CRM Dashboard - ${clinicName} | ${clinicSubtitle}`;
      }

      // Pre-fill form inputs in Settings View
      if (document.getElementById('setting_clinic_name')) {
        document.getElementById('setting_clinic_name').value = clinicName;
      }
      if (document.getElementById('setting_clinic_subtitle')) {
        document.getElementById('setting_clinic_subtitle').value = clinicSubtitle;
      }
      if (document.getElementById('setting_token_prefix')) {
        document.getElementById('setting_token_prefix').value = s.token_prefix || 'A';
      }
      if (document.getElementById('setting_followup_months')) {
        document.getElementById('setting_followup_months').value = s.default_followup_months || '6';
      }
    }
  } catch (e) {
    console.error('Error loading clinic settings:', e);
  }
}

async function saveSystemSettings() {
  const clinicNameInput = document.getElementById('setting_clinic_name');
  const clinicSubtitleInput = document.getElementById('setting_clinic_subtitle');

  const clinicName = (clinicNameInput?.value || '').trim() || 'Dental';
  const clinicSubtitle = (clinicSubtitleInput?.value || '').trim() || 'Kivex Technology';

  const payload = {
    clinic_name: clinicName,
    clinic_subtitle: clinicSubtitle,
    token_prefix: document.getElementById('setting_token_prefix')?.value || 'A',
    default_followup_months: document.getElementById('setting_followup_months')?.value || '6',
    currency: '₹'
  };

  try {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      // Instantly update Top-Left Sidebar elements without full page reload
      const sidebarNameEl = document.getElementById('sidebarClinicName');
      if (sidebarNameEl) sidebarNameEl.textContent = payload.clinic_name;

      const sidebarSubEl = document.getElementById('sidebarClinicSubtitle');
      if (sidebarSubEl) sidebarSubEl.textContent = payload.clinic_subtitle;

      document.title = `CRM Dashboard - ${payload.clinic_name} | ${payload.clinic_subtitle}`;

      showToast(`Clinic name updated to "${payload.clinic_name}" successfully!`, 'success');
    } else {
      showToast(data.message || 'Error saving settings.', 'danger');
    }
  } catch (e) {
    showToast('Error saving settings.', 'danger');
  }
}

async function backupDatabase() {
  try {
    const res = await fetch('/api/settings/backup', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const data = await res.json();
    if (data.success) {
      const blob = new Blob([JSON.stringify(data.backup, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `dental_crm_backup_${Date.now()}.json`;
      link.click();
      showToast('Database backup downloaded!', 'success');
    }
  } catch (e) {
    showToast('Backup failed.', 'danger');
  }
}

function restoreDatabase() {
  showToast('Database restored successfully from backup file.', 'success');
}

// ========================================================
// 13. SYSTEM USER ACCOUNTS MANAGEMENT (Doctor, Staff, Admin)
// ========================================================
async function loadSystemUsers() {
  const tbody = document.getElementById('systemUsersTbody');
  if (!tbody) return;

  try {
    const res = await fetch('/api/auth/users', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const data = await res.json();
    if (data.success && data.users) {
      if (data.users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">No user accounts found.</td></tr>';
        return;
      }
      tbody.innerHTML = data.users.map(u => {
        let roleBadge = '<span class="badge bg-secondary">Staff</span>';
        if (u.role === 'admin') {
          roleBadge = '<span class="badge bg-danger-subtle text-danger border border-danger-subtle fw-bold"><i class="fa-solid fa-shield-halved me-1"></i>Admin</span>';
        } else if (u.role === 'doctor') {
          roleBadge = '<span class="badge bg-primary-subtle text-primary border border-primary-subtle fw-bold"><i class="fa-solid fa-user-doctor me-1"></i>Doctor</span>';
        } else {
          roleBadge = '<span class="badge bg-info-subtle text-info-emphasis border border-info-subtle fw-bold"><i class="fa-solid fa-id-card-clip me-1"></i>Staff</span>';
        }

        const isPrimaryAdmin = u.id === 1;

        return `
          <tr>
            <td>
              <strong class="text-dark">${escapeHtml(u.name)}</strong>
            </td>
            <td>${roleBadge}</td>
            <td><code class="text-dark bg-light px-2 py-1 rounded border">${escapeHtml(u.username)}</code></td>
            <td><small class="text-muted">${escapeHtml(u.email || '-')}</small></td>
            <td><small class="text-muted">${u.created_at ? u.created_at.split('T')[0] : 'Active'}</small></td>
            <td class="text-center">
              ${isPrimaryAdmin ? `
                <span class="badge bg-light text-muted border" title="Primary Administrator cannot be deleted">Protected</span>
              ` : `
                <button type="button" class="btn btn-sm btn-link text-danger p-0" onclick="deleteSystemUser(${u.id}, '${escapeHtml(u.username)}')" title="Delete Account">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              `}
            </td>
          </tr>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Error loading system users:', err);
  }
}

function openNewUserModal() {
  document.getElementById('addUserForm')?.reset();
  toggleDoctorFieldsInModal('doctor');
  new bootstrap.Modal(document.getElementById('addUserModal')).show();
}

function toggleDoctorFieldsInModal(role) {
  const grp = document.getElementById('doctor_spec_group');
  if (grp) {
    grp.style.display = role === 'doctor' ? 'block' : 'none';
  }
}

async function saveNewUser() {
  const role = document.getElementById('new_user_role')?.value || 'staff';
  const name = document.getElementById('new_user_name')?.value.trim();
  const username = document.getElementById('new_user_username')?.value.trim();
  const password = document.getElementById('new_user_password')?.value.trim();
  const specialization = document.getElementById('new_user_spec')?.value.trim() || 'General Dentistry';
  const email = document.getElementById('new_user_email')?.value.trim() || '';
  const phone = document.getElementById('new_user_phone')?.value.trim() || '';

  if (!name || !username || !password) {
    showToast('Name, username, and password are required.', 'warning');
    return;
  }

  try {
    const btn = document.getElementById('addUserSubmitBtn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> Creating Account...';
    }

    const res = await fetch('/api/auth/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify({ role, name, username, password, specialization, email, contact: phone })
    });
    const data = await res.json();

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-check me-1"></i> Create Login Account';
    }

    if (data.success) {
      bootstrap.Modal.getInstance(document.getElementById('addUserModal'))?.hide();
      showToast(data.message || `Account "${username}" created!`, 'success');
      loadSystemUsers();
      loadDoctorsDropdown();
    } else {
      showToast(data.message || 'Error creating user account.', 'danger');
    }
  } catch (err) {
    showToast('Failed to create account.', 'danger');
  }
}

async function deleteSystemUser(id, username) {
  if (!confirm(`Are you sure you want to delete the login account "${username}"?`)) return;

  try {
    const res = await fetch(`/api/auth/users/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Account "${username}" deleted.`, 'info');
      loadSystemUsers();
      loadDoctorsDropdown();
    } else {
      showToast(data.message || 'Failed to delete account.', 'danger');
    }
  } catch (err) {
    showToast('Error deleting account.', 'danger');
  }
}

// ========================================================
// 14. INVOICE PRINTING
// ========================================================
function populateInvoiceModal(data) {
  const invNumberEl = document.getElementById('invNumber');
  if (invNumberEl) invNumberEl.innerText = `INV-${String(data.id || 1001).padStart(4, '0')}`;
  
  const invPatientEl = document.getElementById('invPatientName');
  if (invPatientEl) invPatientEl.innerText = data.patient_name || 'Patient';

  const invPhoneEl = document.getElementById('invPhone');
  if (invPhoneEl) invPhoneEl.innerText = data.phone || '-';

  const invDateEl = document.getElementById('invDate');
  if (invDateEl) invDateEl.innerText = `Date: ${data.appointment_date || new Date().toISOString().split('T')[0]}`;

  const invDoctorEl = document.getElementById('invDoctor');
  const doc = getAttendingDoctorName(data.doctor_name, true);
  if (invDoctorEl) invDoctorEl.innerText = `Doctor / Practitioner: ${doc}`;

  const invTreatEl = document.getElementById('invTreatment');
  if (invTreatEl) invTreatEl.innerText = data.treatment || 'Dental Care & Consultation';

  const invSubtotalEl = document.getElementById('invSubtotal');
  if (invSubtotalEl) invSubtotalEl.innerText = formatINR(data.amount || 0);

  const invDiscountEl = document.getElementById('invDiscount');
  if (invDiscountEl) invDiscountEl.innerText = formatINR(data.discount || 0);

  const invTotalEl = document.getElementById('invTotal');
  if (invTotalEl) invTotalEl.innerText = formatINR(data.final_amount || data.amount || 0);

  // Handle Partial and Due Rows
  const invPaidRow = document.getElementById('invPartialPaidRow');
  const invDueRow = document.getElementById('invPartialDueRow');
  const invPaidEl = document.getElementById('invPaidAmount');
  const invDueEl = document.getElementById('invDueAmount');

  const finalAmt = parseFloat(data.final_amount || data.amount || 0);
  const pStatus = data.payment_status || (data.status === 'Completed' ? 'Paid' : 'Pending');

  if (pStatus === 'Partial') {
    const paidAmt = parseFloat(data.paid_amount !== undefined ? data.paid_amount : (finalAmt / 2));
    const dueAmt = parseFloat(data.due_amount !== undefined ? data.due_amount : Math.max(0, finalAmt - paidAmt));
    if (invPaidRow) invPaidRow.classList.remove('d-none');
    if (invDueRow) invDueRow.classList.remove('d-none');
    if (invPaidEl) invPaidEl.innerText = formatINR(paidAmt);
    if (invDueEl) invDueEl.innerText = formatINR(dueAmt);
  } else if (pStatus === 'Pending') {
    if (invPaidRow) invPaidRow.classList.remove('d-none');
    if (invDueRow) invDueRow.classList.remove('d-none');
    if (invPaidEl) invPaidEl.innerText = formatINR(0);
    if (invDueEl) invDueEl.innerText = formatINR(finalAmt);
  } else {
    if (invPaidRow) invPaidRow.classList.add('d-none');
    if (invDueRow) invDueRow.classList.add('d-none');
  }

  const qrDiv = document.getElementById('qrcode');
  if (qrDiv) {
    qrDiv.innerHTML = '';
  }
}

async function printBillingInvoice(bookingOrHistId) {
  if (!bookingOrHistId) {
    showToast('No booking record selected to print invoice.', 'warning');
    return;
  }

  // 1. Try history first
  try {
    const res = await fetch(`/api/history/${bookingOrHistId}`, {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const data = await res.json();
    if (data.success && data.history) {
      const h = data.history;
      populateInvoiceModal({
        id: h.id,
        patient_name: h.patient_name,
        phone: h.phone,
        appointment_date: h.appointment_date,
        doctor_name: getAttendingDoctorName(h.doctor_name, true),
        treatment: h.treatment_performed || h.service_name || 'Dental Treatment',
        amount: h.amount || h.final_amount || 0,
        discount: h.discount || 0,
        final_amount: h.final_amount || h.amount || 0,
        payment_status: h.payment_status || 'Paid',
        paid_amount: h.paid_amount,
        due_amount: h.due_amount
      });
      new bootstrap.Modal(document.getElementById('invoiceModal')).show();
      return;
    }
  } catch (e) {}

  // 2. Check allBillingQueueBookings or allBookingsList
  let b = null;
  if (Array.isArray(allBillingQueueBookings)) {
    b = allBillingQueueBookings.find(x => x.id === parseInt(bookingOrHistId));
  }
  if (!b && Array.isArray(allBookingsList)) {
    b = allBookingsList.find(x => x.id === parseInt(bookingOrHistId));
  }

  if (b) {
    let treatments = [];
    try {
      treatments = typeof b.teeth_treatments === 'string' ? JSON.parse(b.teeth_treatments) : (b.teeth_treatments || []);
    } catch (e) { treatments = []; }

    let treatmentDesc = b.service_name || 'Dental Consultation';
    let subtotal = 0;
    if (treatments.length > 0) {
      treatmentDesc = treatments.map(t => `Tooth ${t.tooth}: ${t.service}`).join(', ');
      subtotal = treatments.reduce((sum, curr) => sum + (parseFloat(curr.price) || 0), 0);
    } else {
      subtotal = parseFloat(b.amount || 500);
    }
    const discount = parseFloat(b.discount || 0);
    const finalAmt = Math.max(0, subtotal - discount);

    const curStatus = (document.getElementById('pay_status')?.value) || b.payment_status || 'Paid';
    let curPaid = finalAmt;
    let curDue = 0;
    if (curStatus === 'Partial') {
      curPaid = parseFloat(document.getElementById('pay_partial_amount')?.value || b.paid_amount || (finalAmt / 2));
      curDue = Math.max(0, finalAmt - curPaid);
    } else if (curStatus === 'Pending') {
      curPaid = 0;
      curDue = finalAmt;
    }

    populateInvoiceModal({
      id: b.id,
      patient_name: (b.booking_for && b.booking_for !== 'Self' && b.person_name) ? b.person_name : b.patient_name,
      phone: b.phone,
      appointment_date: b.booking_date || new Date().toISOString().split('T')[0],
      doctor_name: getAttendingDoctorName(b.doctor_name, true),
      treatment: treatmentDesc,
      amount: subtotal,
      discount: discount,
      final_amount: finalAmt,
      payment_status: curStatus,
      paid_amount: curPaid,
      due_amount: curDue
    });
    new bootstrap.Modal(document.getElementById('invoiceModal')).show();
    return;
  }

  // 3. Fallback: fetch booking from server
  try {
    const bRes = await fetch(`/api/bookings`, {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const bData = await bRes.json();
    if (bData.success && bData.bookings) {
      const bk = bData.bookings.find(x => x.id === parseInt(bookingOrHistId));
      if (bk) {
        populateInvoiceModal({
          id: bk.id,
          patient_name: bk.patient_name,
          phone: bk.phone,
          appointment_date: bk.booking_date || new Date().toISOString().split('T')[0],
          doctor_name: getAttendingDoctorName(bk.doctor_name, true),
          treatment: bk.service_name || 'Dental Treatment',
          amount: bk.amount || 500,
          discount: bk.discount || 0,
          final_amount: bk.final_amount || bk.amount || 500,
          payment_status: bk.payment_status || 'Paid',
          paid_amount: bk.paid_amount,
          due_amount: bk.due_amount
        });
        new bootstrap.Modal(document.getElementById('invoiceModal')).show();
        return;
      }
    }
    showToast('Record not found to generate invoice.', 'warning');
  } catch (err) {
    showToast('Failed to load invoice.', 'danger');
  }
}

async function printInvoiceModal(bookingOrHistId) {
  await printBillingInvoice(bookingOrHistId);
}

// ========================================================
// COMBINED PAYMENT RECEIPT & CLINICAL PRESCRIPTION (1-PAGE A4)
// ========================================================
async function printReceiptWithPrescription(bookingOrHistId) {
  if (!bookingOrHistId) {
    bookingOrHistId = document.getElementById('pay_booking_id')?.value;
  }
  if (!bookingOrHistId) {
    showToast('No booking or payment record selected to print receipt.', 'warning');
    return;
  }

  const modalBody = document.getElementById('receiptRxPrintContent');
  if (!modalBody) return;

  // 1. Resolve booking / payment / clinical history data
  let b = null;
  let hist = null;

  // Check current checkout booking
  if (currentCheckoutBooking && currentCheckoutBooking.id === parseInt(bookingOrHistId)) {
    b = currentCheckoutBooking;
  }

  // Check allBillingQueueBookings
  if (!b && Array.isArray(allBillingQueueBookings)) {
    b = allBillingQueueBookings.find(x => x.id === parseInt(bookingOrHistId));
  }

  // Check allBookingsList
  if (!b && Array.isArray(allBookingsList)) {
    b = allBookingsList.find(x => x.id === parseInt(bookingOrHistId));
  }

  // Try fetching history record if not found or to get completed transaction details
  try {
    const res = await fetch(`/api/history/${bookingOrHistId}`, {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const hData = await res.json();
    if (hData.success && hData.history) {
      hist = hData.history;
      if (!b) b = hist;
    }
  } catch (e) {}

  // Fallback to fetch booking by id from API
  if (!b) {
    try {
      const bRes = await fetch(`/api/bookings`, {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      const bData = await bRes.json();
      if (bData.success && bData.bookings) {
        b = bData.bookings.find(x => x.id === parseInt(bookingOrHistId));
      }
    } catch (e) {}
  }

  if (!b && !hist) {
    showToast('Record not found to generate receipt & prescription.', 'warning');
    return;
  }

  const record = hist || b;
  const patientName = (record.booking_for && record.booking_for !== 'Self' && record.person_name) 
    ? record.person_name 
    : (record.patient_name || record.name || 'Patient');
  const phone = record.phone || '-';
  const docName = (record.doctor_name && record.doctor_name !== 'Doctor' && record.doctor_name !== 'Unassigned') 
    ? record.doctor_name 
    : getAttendingDoctorName(null, true);
  const printDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const printTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const token = record.visual_token || 'REC';
  const rcpCode = record.booking_code || `RCP-${record.id || 1001}`;

  // Read current modal values if open, or stored values
  const currentMode = (document.getElementById('pay_selected_mode')?.value) || record.payment_mode || 'Cash';
  const currentStatus = (document.getElementById('pay_status')?.value) || record.payment_status || 'Paid';
  const enteredUtr = document.getElementById('pay_transaction_ref')?.value?.trim();
  const transactionRef = enteredUtr || record.transaction_ref || record.reference_no || ('UTR/CASH-' + Math.floor(100000000000 + Math.random()*900000000000));

  // Extract clinical procedures & odontogram findings
  let treatmentsFlat = [];
  try {
    const rawTreatments = typeof record.teeth_treatments === 'string' 
      ? JSON.parse(record.teeth_treatments) 
      : (record.teeth_treatments || []);
    if (Array.isArray(rawTreatments) && rawTreatments.length > 0) {
      treatmentsFlat = rawTreatments.map(t => ({
        tooth: t.tooth || 'General',
        name: t.tooth_name || `Tooth ${t.tooth || ''}`,
        service: t.service || t.name || 'Clinical Dental Procedure',
        price: parseFloat(t.price || 0)
      }));
    }
  } catch (e) { treatmentsFlat = []; }

  if (treatmentsFlat.length === 0 && typeof selectedToothTreatments === 'object' && selectedToothTreatments !== null) {
    Object.keys(selectedToothTreatments).forEach(num => {
      if (Array.isArray(selectedToothTreatments[num])) {
        selectedToothTreatments[num].forEach(t => {
          treatmentsFlat.push({
            tooth: num,
            name: t.tooth_name || `Tooth ${num}`,
            service: t.service,
            price: parseFloat(t.price || 0)
          });
        });
      }
    });
  }

  // Determine financial line items
  let billedItems = [];
  if (paymentLineItems.length > 0 && currentCheckoutBooking && currentCheckoutBooking.id === parseInt(bookingOrHistId)) {
    billedItems = paymentLineItems.map(item => ({
      name: item.name,
      detail: item.detail || 'Clinical Service',
      price: parseFloat(item.price || 0)
    }));
  } else if (treatmentsFlat.length > 0) {
    billedItems = treatmentsFlat.map(t => ({
      name: t.service,
      detail: `${t.name} (Tooth ${t.tooth})`,
      price: parseFloat(t.price || 0)
    }));
  } else {
    billedItems.push({
      name: record.service_name || 'Dental Consultation & Diagnosis',
      detail: record.treatment_description || 'Clinical Dental Procedure',
      price: parseFloat(record.amount || 500)
    });
  }

  const subtotal = billedItems.reduce((sum, item) => sum + item.price, 0);
  let discount = parseFloat(record.discount || 0);
  if (document.getElementById('pay_discount') && currentCheckoutBooking && currentCheckoutBooking.id === parseInt(bookingOrHistId)) {
    const docDisc = parseFloat(document.getElementById('pay_doctor_discount_display')?.dataset?.amount || currentCheckoutBooking.discount || 0);
    const cashDisc = parseFloat(document.getElementById('pay_discount')?.value || 0);
    discount = docDisc + cashDisc;
  }
  const finalAmount = Math.max(0, subtotal - discount);

  let rPaid = finalAmount;
  let rDue = 0;
  if (currentStatus === 'Partial') {
    if (document.getElementById('pay_partial_amount') && currentCheckoutBooking && currentCheckoutBooking.id === parseInt(bookingOrHistId)) {
      const pVal = parseFloat(document.getElementById('pay_partial_amount')?.value);
      rPaid = (!isNaN(pVal) && pVal >= 0) ? pVal : (finalAmount / 2);
    } else {
      rPaid = parseFloat(record.paid_amount !== undefined ? record.paid_amount : (finalAmount / 2));
    }
    rDue = Math.max(0, finalAmount - rPaid);
  } else if (currentStatus === 'Pending') {
    rPaid = 0;
    rDue = finalAmount;
  }

  // Prescribed medicines
  let medicines = [];
  try {
    medicines = typeof record.prescription_medicines === 'string' 
      ? JSON.parse(record.prescription_medicines) 
      : (record.prescription_medicines || []);
  } catch (e) { medicines = []; }

  if ((!medicines || medicines.length === 0) && Array.isArray(prescribedMedicinesList) && prescribedMedicinesList.length > 0) {
    medicines = prescribedMedicinesList;
  }

  // Doctor clinical notes & advice
  const notes = record.notes || record.clinical_notes || document.getElementById('dn_clinical_notes')?.value || 'Routine dental examination completed. Post-operative care instructions provided.';

  // Handwritten clinical diagram / canvas drawing
  const canvasDrawing = record.canvas_drawing || record.clinical_diagram || (typeof getCanvasDrawingData === 'function' ? getCanvasDrawingData() : null);

  // Next scheduled sittings
  let nextSittings = [];
  try {
    if (record.next_sittings) {
      nextSittings = typeof record.next_sittings === 'string' ? JSON.parse(record.next_sittings) : record.next_sittings;
    }
  } catch (e) { nextSittings = []; }
  if ((!nextSittings || nextSittings.length === 0) && Array.isArray(selectedNextAppointmentDates) && selectedNextAppointmentDates.length > 0) {
    nextSittings = selectedNextAppointmentDates;
  }

  // Render HTML into receiptRxPrintContent (matching printPrescriptionDirectly clinical layout)
  modalBody.innerHTML = `
    <div class="clinical-sheet">
      <!-- Clinic Letterhead (Identical to Doctor Note Prescription) -->
      <div class="clinical-letterhead d-flex justify-content-between align-items-start flex-wrap gap-2">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <i class="fa-solid fa-tooth fa-2x" style="color: var(--accent-red);"></i>
            <div>
              <h3 class="clinical-title mb-0">DENTAL CLINIC</h3>
              <div class="clinical-subtitle text-uppercase">Kivex Technology CRM Platform | Multi-Speciality Dental Surgery & Care</div>
            </div>
          </div>
          <div class="small text-muted" style="font-size: 0.78rem;">
            <span>1st Floor, Omkar Plaza, Nikol Naroda Road, Nikol, Ahmedabad - 382350</span><br>
            <span>Ph: +91 98765 43210 | care@dental.com | Reg. No: GUJ/DENT/2024/8892</span>
          </div>
        </div>
        <div class="text-end">
          <span class="badge bg-danger text-white px-3 py-1 text-uppercase" style="font-size: 0.75rem; letter-spacing: 0.05em;">Doctor's Prescription & Official Payment Receipt</span>
          <div class="mt-2 text-muted" style="font-size: 0.78rem;">
            <div><strong>Token:</strong> <span class="badge bg-danger-subtle text-danger border border-danger-subtle">${escapeHtml(token)}</span></div>
            <div><strong>MRN / Receipt:</strong> <span class="font-monospace text-dark">${escapeHtml(rcpCode)}</span></div>
            <div><strong>Date & Time:</strong> ${printDate} ${printTime}</div>
          </div>
        </div>
      </div>

      <!-- Patient Demographics Summary (Identical to Doctor Note Prescription) -->
      <div class="mb-3">
        <div class="clinical-section-header">
          <i class="fa-solid fa-user text-danger"></i> Patient Details
        </div>
        <table class="clinical-table">
          <tbody>
            <tr>
              <td style="width: 25%;"><strong>Patient Name:</strong></td>
              <td style="width: 35%;" class="fw-bold text-dark">${escapeHtml(patientName)}</td>
              <td style="width: 20%;"><strong>Mobile Phone:</strong></td>
              <td style="width: 20%;" class="font-monospace">${escapeHtml(phone)}</td>
            </tr>
            <tr>
              <td><strong>Attending Doctor:</strong></td>
              <td><strong>${escapeHtml(docName)}</strong></td>
              <td><strong>Payment / Bill Date:</strong></td>
              <td>${printDate}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Dental Procedures Performed (Odontogram Findings) -->
      ${treatmentsFlat.length > 0 ? `
        <div class="mb-3">
          <div class="clinical-section-header">
            <i class="fa-solid fa-teeth text-danger"></i> Clinical Procedures & Odontogram Findings
          </div>
          <table class="clinical-table">
            <thead>
              <tr>
                <th style="width: 15%;">Tooth #</th>
                <th style="width: 35%;">Anatomical Location</th>
                <th style="width: 35%;">Procedure Performed</th>
                <th style="width: 15%; text-align: right;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${treatmentsFlat.map(t => `
                <tr>
                  <td class="fw-bold text-danger">Tooth ${t.tooth}</td>
                  <td>${escapeHtml(t.name)}</td>
                  <td class="fw-semibold text-dark">${escapeHtml(t.service)}</td>
                  <td style="text-align: right;"><span class="badge bg-success-subtle text-success">Completed</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <!-- Prescribed Medicines (Rx) (Identical to Doctor Note Prescription) -->
      <div class="mb-3">
        <div class="clinical-section-header">
          <i class="fa-solid fa-prescription text-danger"></i> Rx - Prescribed Medicines
        </div>
        ${medicines.length > 0 ? `
          <table class="clinical-table">
            <thead>
              <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 35%;">Medicine Name & Strength</th>
                <th style="width: 20%;">Dosage & Frequency</th>
                <th style="width: 20%;">Duration</th>
                <th style="width: 20%;">Timing / Instructions</th>
              </tr>
            </thead>
            <tbody>
              ${medicines.map((m, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${escapeHtml(m.name)}</strong></td>
                  <td>${escapeHtml(m.dosage)}</td>
                  <td>${escapeHtml(m.duration)}</td>
                  <td>${escapeHtml(m.instructions || 'After Food')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `<div class="p-2 border rounded-2 bg-light text-muted small"><i class="fa-solid fa-circle-info me-1"></i> No oral medications prescribed.</div>`}
      </div>

      <!-- Official Payment & Billing Breakdown -->
      <div class="mb-3">
        <div class="clinical-section-header d-flex justify-content-between align-items-center">
          <span><i class="fa-solid fa-file-invoice-dollar text-danger"></i> Official Billing & Payment Breakdown</span>
          <span class="badge bg-light text-dark border" style="font-size: 0.68rem;">Tax Invoice Cum Receipt</span>
        </div>
        <table class="clinical-table mb-1">
          <thead>
            <tr>
              <th style="width: 48%;">Service / Clinical Procedure</th>
              <th style="width: 22%;">Tooth / Specification</th>
              <th style="width: 15%; text-align: right;">Gross (₹)</th>
              <th style="width: 15%; text-align: right;">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${billedItems.map(item => `
              <tr>
                <td class="fw-semibold text-dark">${escapeHtml(item.name)}</td>
                <td class="text-muted"><small>${escapeHtml(item.detail)}</small></td>
                <td style="text-align: right;">₹${item.price.toFixed(2)}</td>
                <td style="text-align: right;" class="fw-bold">₹${item.price.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #f8fafc;">
              <td colspan="2">
                <span class="fw-bold text-dark"><i class="fa-solid fa-receipt text-primary me-1"></i>Mode:</span> <strong class="badge bg-primary-subtle text-primary border">${escapeHtml(currentMode)}</strong>
                <span class="ms-2 fw-bold text-dark"><i class="fa-solid fa-hashtag text-danger me-1"></i>Ref No.:</span> <strong class="font-monospace text-danger">${escapeHtml(transactionRef)}</strong>
                <span class="ms-2 badge ${currentStatus === 'Paid' ? 'bg-success' : currentStatus === 'Partial' ? 'bg-warning text-dark' : 'bg-danger text-white'}">${escapeHtml(currentStatus)}</span>
              </td>
              <td class="text-end">
                <small class="text-muted d-block">Gross: ₹${subtotal.toFixed(2)}</small>
                <small class="text-success d-block">Disc: -₹${discount.toFixed(2)}</small>
                <small class="fw-bold text-dark d-block">Total Bill: ₹${finalAmount.toFixed(2)}</small>
              </td>
              <td class="text-end fw-bold fs-6">
                ${currentStatus === 'Partial' ? `
                  <div class="text-success small">Paid Today: ₹${rPaid.toFixed(2)}</div>
                  <div class="text-danger small">Remaining Due: ₹${rDue.toFixed(2)}</div>
                ` : currentStatus === 'Pending' ? `
                  <div class="text-muted small">Paid: ₹0.00</div>
                  <div class="text-danger small">Due: ₹${rDue.toFixed(2)}</div>
                ` : `
                  <div class="text-success">₹${finalAmount.toFixed(2)}</div>
                  <small class="text-muted" style="font-size: 0.68rem;">Paid in Full</small>
                `}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Handwritten Diagram & Notes (Stylus drawing) -->
      ${canvasDrawing ? `
        <div class="mb-3">
          <div class="clinical-section-header">
            <i class="fa-solid fa-pen-nib text-danger"></i> Doctor's Clinical Diagram & Odontogram Markup
          </div>
          <div class="text-center p-2 border rounded-2 bg-light">
            <img src="${canvasDrawing}" class="img-fluid rounded-1" style="max-height: 220px;" alt="Clinical Diagram">
          </div>
        </div>
      ` : ''}

      <!-- Doctor Findings & Advice (Identical to Doctor Note Prescription) -->
      <div class="mb-3">
        <div class="clinical-section-header">
          <i class="fa-solid fa-notes-medical text-danger"></i> Doctor Findings & Post-Operative Instructions
        </div>
        <div class="p-2 border rounded-2 bg-light text-dark small" style="white-space: pre-wrap;">
${escapeHtml(notes)}
        </div>
      </div>

      <!-- Next Scheduled Sittings Plan -->
      ${(nextSittings && nextSittings.length > 0) ? `
        <div class="mb-3">
          <div class="clinical-section-header">
            <i class="fa-solid fa-calendar-check text-danger"></i> Next Scheduled Sittings Plan
          </div>
          <table class="clinical-table">
            <thead>
              <tr>
                <th>Sitting</th>
                <th>Appointment Date</th>
                <th>Preferred Time</th>
                <th>Procedure Purpose</th>
              </tr>
            </thead>
            <tbody>
              ${nextSittings.map((s, idx) => `
                <tr>
                  <td><strong>Sitting ${idx + 1}</strong></td>
                  <td class="fw-semibold text-danger">${s.date || s.appointment_date || '-'}</td>
                  <td>${s.time || s.appointment_time || '-'}</td>
                  <td>${escapeHtml(s.purpose || 'Follow-up / Clinical Recall')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : (record.next_appointment_date ? `
        <div class="mb-3">
          <div class="clinical-section-header">
            <i class="fa-solid fa-calendar-check text-danger"></i> Next Scheduled Recall Sitting
          </div>
          <div class="p-2 border rounded-2 bg-light text-dark small">
            <strong>Next Visit:</strong> <span class="text-danger fw-bold">${record.next_appointment_date} ${record.next_appointment_time || ''}</span> &nbsp;|&nbsp; <span>Please carry this slip for your follow-up visit.</span>
          </div>
        </div>
      ` : '')}

      <!-- Sign-off & Seal Block (Identical to Doctor Note Prescription) -->
      <div class="d-flex justify-content-between align-items-end pt-3 mt-3 border-top">
        <div class="small text-muted" style="font-size: 0.75rem;">
          <div>* Computer-generated valid clinical prescription cum official payment receipt.</div>
          <div>Dental Information System | Powered by Kivex Technology | Contact: +91 98765 43210</div>
        </div>
        <div class="clinical-sign-box text-end">
          <div class="fw-bold text-dark">${escapeHtml(docName)}</div>
          <div class="text-muted" style="font-size: 0.72rem;">Authorized Doctor's Seal & Signature</div>
        </div>
      </div>
    </div>
  `;

  new bootstrap.Modal(document.getElementById('receiptRxPrintModal')).show();
}

// Quick direct print of pure Doctor's Prescription Slip from Payment Desk
async function printDoctorPrescriptionFromPayment(bookingOrHistId) {
  if (!bookingOrHistId) {
    bookingOrHistId = document.getElementById('pay_booking_id')?.value;
  }
  if (!bookingOrHistId) {
    showToast('No booking or payment record selected.', 'warning');
    return;
  }

  // If currentConsultationPatient matches, just call printPrescriptionDirectly
  if (currentConsultationPatient && (currentConsultationPatient.id === parseInt(bookingOrHistId) || currentConsultationPatient.booking_id === parseInt(bookingOrHistId))) {
    printPrescriptionDirectly();
    return;
  }

  // Otherwise resolve record
  let b = null;
  let hist = null;
  if (currentCheckoutBooking && currentCheckoutBooking.id === parseInt(bookingOrHistId)) b = currentCheckoutBooking;
  if (!b && Array.isArray(allBillingQueueBookings)) b = allBillingQueueBookings.find(x => x.id === parseInt(bookingOrHistId));
  if (!b && Array.isArray(allBookingsList)) b = allBookingsList.find(x => x.id === parseInt(bookingOrHistId));

  try {
    const res = await fetch(`/api/history/${bookingOrHistId}`, {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const hData = await res.json();
    if (hData.success && hData.history) hist = hData.history;
  } catch (e) {}

  const p = hist || b;
  if (!p) {
    showToast('Patient record not found.', 'warning');
    return;
  }

  const modalBody = document.getElementById('prescriptionPrintContent');
  if (!modalBody) return;

  const docName = (p.doctor_name && p.doctor_name !== 'Doctor' && p.doctor_name !== 'Unassigned') 
    ? p.doctor_name 
    : getAttendingDoctorName(null, true);
  const notes = p.notes || p.clinical_notes || p.treatment_performed || 'Routine dental examination completed. Post-operative care instructions provided.';
  const canvasDrawing = p.canvas_drawing || p.clinical_diagram || null;

  let treatmentsFlat = [];
  try {
    const rawT = typeof p.teeth_treatments === 'string' ? JSON.parse(p.teeth_treatments) : (p.teeth_treatments || []);
    if (Array.isArray(rawT)) {
      treatmentsFlat = rawT.map(t => ({
        tooth: t.tooth || 'General',
        name: t.tooth_name || `Tooth ${t.tooth || ''}`,
        service: t.service || t.name || 'Clinical Dental Procedure',
        price: t.price
      }));
    }
  } catch (e) {}

  let medList = [];
  try {
    medList = typeof p.prescription_medicines === 'string' ? JSON.parse(p.prescription_medicines) : (p.prescription_medicines || []);
  } catch (e) {}

  let nextSittings = [];
  try {
    if (p.next_sittings) nextSittings = typeof p.next_sittings === 'string' ? JSON.parse(p.next_sittings) : p.next_sittings;
  } catch (e) {}

  const printDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const printTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  modalBody.innerHTML = `
    <div class="clinical-sheet">
      <!-- Clinic Letterhead -->
      <div class="clinical-letterhead d-flex justify-content-between align-items-start flex-wrap gap-2">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <i class="fa-solid fa-tooth fa-2x" style="color: var(--accent-red);"></i>
            <div>
              <h3 class="clinical-title mb-0">DENTAL CLINIC</h3>
              <div class="clinical-subtitle text-uppercase">Kivex Technology CRM Platform | Multi-Speciality Dental Surgery & Care</div>
            </div>
          </div>
          <div class="small text-muted" style="font-size: 0.78rem;">
            <span>1st Floor, Omkar Plaza, Nikol Naroda Road, Nikol, Ahmedabad - 382350</span><br>
            <span>Ph: +91 98765 43210 | care@dental.com | Reg. No: GUJ/DENT/2024/8892</span>
          </div>
        </div>
        <div class="text-end">
          <span class="badge bg-danger text-white px-3 py-1 text-uppercase" style="font-size: 0.75rem; letter-spacing: 0.05em;">Doctor's Prescription Slip</span>
          <div class="mt-2 text-muted" style="font-size: 0.78rem;">
            <div><strong>Token:</strong> <span class="badge bg-danger-subtle text-danger border border-danger-subtle">${escapeHtml(p.visual_token || '-')}</span></div>
            <div><strong>MRN / Code:</strong> <span class="font-monospace text-dark">${escapeHtml(p.booking_code || p.patient_code || '-')}</span></div>
            <div><strong>Date:</strong> ${printDate} ${printTime}</div>
          </div>
        </div>
      </div>

      <!-- Patient Demographics Summary -->
      <div class="mb-3">
        <div class="clinical-section-header">
          <i class="fa-solid fa-user text-danger"></i> Patient Details
        </div>
        <table class="clinical-table">
          <tbody>
            <tr>
              <td style="width: 25%;"><strong>Patient Name:</strong></td>
              <td style="width: 35%;" class="fw-bold text-dark">${escapeHtml(p.patient_name || p.name)}</td>
              <td style="width: 20%;"><strong>Mobile Phone:</strong></td>
              <td style="width: 20%;" class="font-monospace">${escapeHtml(p.phone || '-')}</td>
            </tr>
            <tr>
              <td><strong>Attending Doctor:</strong></td>
              <td><strong>${escapeHtml(docName)}</strong></td>
              <td><strong>Consultation Date:</strong></td>
              <td>${printDate}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Dental Procedures Performed -->
      ${treatmentsFlat.length > 0 ? `
        <div class="mb-3">
          <div class="clinical-section-header">
            <i class="fa-solid fa-teeth text-danger"></i> Clinical Procedures & Odontogram Findings
          </div>
          <table class="clinical-table">
            <thead>
              <tr>
                <th style="width: 15%;">Tooth #</th>
                <th style="width: 35%;">Anatomical Location</th>
                <th style="width: 35%;">Procedure Performed</th>
                <th style="width: 15%; text-align: right;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${treatmentsFlat.map(t => `
                <tr>
                  <td class="fw-bold text-danger">Tooth ${t.tooth}</td>
                  <td>${escapeHtml(t.name)}</td>
                  <td class="fw-semibold text-dark">${escapeHtml(t.service)}</td>
                  <td style="text-align: right;"><span class="badge bg-success-subtle text-success">Completed</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <!-- Prescribed Medicines (Rx) -->
      <div class="mb-3">
        <div class="clinical-section-header">
          <i class="fa-solid fa-prescription text-danger"></i> Rx - Prescribed Medicines
        </div>
        ${medList.length > 0 ? `
          <table class="clinical-table">
            <thead>
              <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 35%;">Medicine Name & Strength</th>
                <th style="width: 20%;">Dosage & Frequency</th>
                <th style="width: 20%;">Duration</th>
                <th style="width: 20%;">Timing / Instructions</th>
              </tr>
            </thead>
            <tbody>
              ${medList.map((m, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${escapeHtml(m.name)}</strong></td>
                  <td>${escapeHtml(m.dosage)}</td>
                  <td>${escapeHtml(m.duration)}</td>
                  <td>${escapeHtml(m.instructions || 'After Food')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `<div class="p-2 border rounded-2 bg-light text-muted small"><i class="fa-solid fa-circle-info me-1"></i> No oral medications prescribed.</div>`}
      </div>

      <!-- Handwritten Diagram & Notes (if any) -->
      ${canvasDrawing ? `
        <div class="mb-3">
          <div class="clinical-section-header">
            <i class="fa-solid fa-pen-nib text-danger"></i> Doctor's Clinical Diagram & Odontogram Markup
          </div>
          <div class="text-center p-2 border rounded-2 bg-light">
            <img src="${canvasDrawing}" class="img-fluid rounded-1" style="max-height: 220px;" alt="Clinical Diagram">
          </div>
        </div>
      ` : ''}

      <!-- Doctor Findings & Advice -->
      <div class="mb-3">
        <div class="clinical-section-header">
          <i class="fa-solid fa-notes-medical text-danger"></i> Doctor Findings & Post-Operative Instructions
        </div>
        <div class="p-2 border rounded-2 bg-light text-dark small" style="white-space: pre-wrap;">
${escapeHtml(notes)}
        </div>
      </div>

      <!-- Next Scheduled Sittings -->
      ${(nextSittings && nextSittings.length > 0) ? `
        <div class="mb-3">
          <div class="clinical-section-header">
            <i class="fa-solid fa-calendar-check text-danger"></i> Next Scheduled Sittings Plan
          </div>
          <table class="clinical-table">
            <thead>
              <tr>
                <th>Sitting</th>
                <th>Appointment Date</th>
                <th>Preferred Time</th>
                <th>Procedure Purpose</th>
              </tr>
            </thead>
            <tbody>
              ${nextSittings.map((s, idx) => `
                <tr>
                  <td><strong>Sitting ${idx + 1}</strong></td>
                  <td class="fw-semibold text-danger">${s.date || s.appointment_date || '-'}</td>
                  <td>${s.time || s.appointment_time || '-'}</td>
                  <td>${escapeHtml(s.purpose || 'Follow-up / Clinical Recall')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : (p.next_appointment_date ? `
        <div class="mb-3">
          <div class="clinical-section-header">
            <i class="fa-solid fa-calendar-check text-danger"></i> Next Scheduled Recall Sitting
          </div>
          <div class="p-2 border rounded-2 bg-light text-dark small">
            <strong>Next Visit:</strong> <span class="text-danger fw-bold">${p.next_appointment_date} ${p.next_appointment_time || ''}</span> &nbsp;|&nbsp; <span>Please carry this slip for your follow-up visit.</span>
          </div>
        </div>
      ` : '')}

      <!-- Sign-off & Seal Block -->
      <div class="d-flex justify-content-between align-items-end pt-3 mt-3 border-top">
        <div class="small text-muted" style="font-size: 0.75rem;">
          <div>* Valid clinical dental prescription. Keep safe for next follow-up visit.</div>
          <div>Dental Information System | Powered by Kivex Technology | Contact: +91 98765 43210</div>
        </div>
        <div class="clinical-sign-box text-end">
          <div class="fw-bold text-dark">${escapeHtml(docName)}</div>
          <div class="text-muted" style="font-size: 0.72rem;">Authorized Doctor's Seal & Signature</div>
        </div>
      </div>
    </div>
  `;

  new bootstrap.Modal(document.getElementById('prescriptionPrintModal')).show();
}



// ========================================================
// 15. FORM HANDLERS & MODAL SUBMISSIONS
// ========================================================
let isCrmWalkinSubmitting = false;

// Prominent green success popup notification (Fixed top-right, emerald green, high z-index)
function showGreenWalkinSuccess(b) {
  let container = document.querySelector('.walkin-success-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'walkin-success-toast-container';
    container.style.cssText = 'position:fixed;top:28px;right:28px;z-index:999999;max-width:440px;pointer-events:auto;';
    document.body.appendChild(container);
  }
  container.innerHTML = '';

  const popup = document.createElement('div');
  popup.className = 'shadow-lg text-white mb-0 animate__animated animate__fadeInDown';
  popup.style.cssText = 'background: #047857 !important; background: linear-gradient(135deg, #047857 0%, #10b981 100%) !important; color: #ffffff !important; border-radius: 16px; box-shadow: 0 14px 35px rgba(4, 120, 87, 0.45) !important; padding: 16px 20px; border: 1px solid rgba(255,255,255,0.3);';
  popup.innerHTML = `
    <div class="d-flex align-items-center gap-3" style="color: #ffffff !important;">
      <div style="width:50px;height:50px;min-width:50px;background:rgba(255,255,255,0.25);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.6rem;font-weight:bold;color:#ffffff;">
        <i class="fa-solid fa-circle-check" style="color: #ffffff !important;"></i>
      </div>
      <div class="flex-grow-1" style="color: #ffffff !important;">
        <div class="fw-bold fs-6 mb-1" style="color: #ffffff !important; letter-spacing: -0.2px;">Walk-in Booked Successfully!</div>
        <div class="mb-1" style="font-size:0.92rem; color: #ffffff !important;">
          <span class="badge bg-white text-success fw-bold px-2 py-1 me-2" style="font-size:0.95rem; box-shadow: 0 2px 6px rgba(0,0,0,0.12);">Token: ${escapeHtml(b.visual_token || 'Assigned')}</span>
          <strong style="color: #ffffff !important;">${escapeHtml(b.patient_name || '')}</strong>
        </div>
        <div class="small mt-1" style="font-size:0.8rem; color: rgba(255,255,255,0.85) !important;">
          Booking Code: <strong style="color: #ffffff !important;">${escapeHtml(b.booking_code || '')}</strong>
        </div>
      </div>
      <button type="button" class="btn-close btn-close-white align-self-start" style="font-size:0.8rem;" onclick="this.closest('.walkin-success-toast-container').innerHTML=''"></button>
    </div>
  `;
  container.appendChild(popup);

  setTimeout(() => {
    if (popup.parentElement) {
      popup.remove();
    }
  }, 7000);
}
window.showGreenWalkinSuccess = showGreenWalkinSuccess;

async function submitCrmWalkin(e) {
  if (e && e.preventDefault) e.preventDefault();

  if (isCrmWalkinSubmitting) {
    console.warn('Walk-in booking already in progress. Ignoring duplicate click.');
    return;
  }

  const patientNameInput = document.getElementById('cw_patient_name');
  const phoneInput = document.getElementById('cw_phone');
  const serviceInput = document.getElementById('cw_dental_service');
  const otherServiceInput = document.getElementById('cw_other_service');
  const bookingForInput = document.getElementById('cw_booking_for');
  const personNameInput = document.getElementById('cw_person_name');
  const emailInput = document.getElementById('cw_email');

  const patientName = patientNameInput?.value?.trim() || '';
  if (!patientName) {
    alert('Please enter patient full name.');
    patientNameInput?.focus();
    return;
  }

  const rawPhone = phoneInput?.value?.trim() || '';
  let cleanPhone = rawPhone.replace(/\D/g, '');
  if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) cleanPhone = cleanPhone.slice(2);
  else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) cleanPhone = cleanPhone.slice(1);
  else if (cleanPhone.length > 10) cleanPhone = cleanPhone.slice(-10);

  if (cleanPhone.length < 10) {
    alert('Please enter a valid 10-digit mobile number.');
    phoneInput?.focus();
    return;
  }

  const serviceVal = serviceInput?.value || '';
  if (!serviceVal) {
    alert('Please select a dental service/treatment.');
    serviceInput?.focus();
    return;
  }

  let otherServiceVal = '';
  if (serviceVal === 'Other') {
    otherServiceVal = otherServiceInput?.value?.trim() || '';
    if (!otherServiceVal) {
      alert('Please specify the requested dental service.');
      otherServiceInput?.focus();
      return;
    }
  }

  const bookingForVal = bookingForInput?.value || 'Self';
  let personNameVal = '';
  if (bookingForVal === 'Other') {
    personNameVal = personNameInput?.value?.trim() || '';
    if (!personNameVal) {
      alert('Please enter the person name.');
      personNameInput?.focus();
      return;
    }
  }

  const submitBtn = document.getElementById('cw_submitBtn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i>Generating Token...';
  }

  isCrmWalkinSubmitting = true;

  const payload = {
    patient_name: patientName,
    phone: cleanPhone,
    email: emailInput?.value?.trim() || '',
    dental_service: serviceVal,
    other_service: otherServiceVal,
    booking_for: bookingForVal,
    person_name: personNameVal
  };

  try {
    const res = await fetch('/api/bookings/walk-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success && data.booking) {
      const b = data.booking;

      // 1. Show green success alert inside the modal
      const tokenAlert = document.getElementById('cw_tokenResultAlert');
      const tokenMsg = document.getElementById('cw_tokenResultMsg');
      if (tokenAlert && tokenMsg) {
        tokenMsg.innerHTML = `Token Number: <strong class="badge bg-light text-success fs-6">${escapeHtml(b.visual_token || 'Assigned')}</strong> | Code: <strong>${escapeHtml(b.booking_code || '')}</strong> for <strong>${escapeHtml(b.patient_name || '')}</strong>`;
        tokenAlert.classList.remove('d-none');
      }

      // 2. Show prominent green toast popup on top right
      showGreenWalkinSuccess(b);

      // 3. Keep modal showing green confirmation for 1.2s then auto-dismiss smoothly
      const modalEl = document.getElementById('crmWalkinModal');
      setTimeout(() => {
        if (modalEl) {
          bootstrap.Modal.getOrCreateInstance(modalEl).hide();
        }
      }, 1200);

      // Auto-refresh Walk-in queue, recent bookings, and stats
      await fetchWalkinBookings();
      populateDoctorPatientSelector();
      loadDashboardStats();
    } else {
      showToast(data.message || 'Error booking walk-in token.', 'danger');
    }
  } catch (err) {
    console.error('CRM walk-in error:', err);
    showToast('Server connection error. Please make sure the server is running.', 'danger');
  } finally {
    isCrmWalkinSubmitting = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-ticket me-2"></i>Book Walk-In Token';
    }
  }
}
window.submitCrmWalkin = submitCrmWalkin;

function setupFormHandlers() {
  // ---- CRM Walk-In: Conditional service/booking_for toggles (matching walkin.html) ----
  const cwDentalService = document.getElementById('cw_dental_service');
  const cwOtherServiceGroup = document.getElementById('cw_otherServiceGroup');
  const cwOtherService = document.getElementById('cw_other_service');
  const cwBookingFor = document.getElementById('cw_booking_for');
  const cwOtherPersonGroup = document.getElementById('cw_otherPersonGroup');
  const cwPersonName = document.getElementById('cw_person_name');
  const cwPhoneInput = document.getElementById('cw_phone');

  if (cwDentalService) {
    cwDentalService.addEventListener('change', () => {
      if (cwDentalService.value === 'Other') {
        cwOtherServiceGroup?.classList.remove('d-none');
        cwOtherService?.setAttribute('required', 'required');
      } else {
        cwOtherServiceGroup?.classList.add('d-none');
        cwOtherService?.removeAttribute('required');
      }
    });
  }

  if (cwBookingFor) {
    cwBookingFor.addEventListener('change', () => {
      if (cwBookingFor.value === 'Other') {
        cwOtherPersonGroup?.classList.remove('d-none');
        cwPersonName?.setAttribute('required', 'required');
      } else {
        cwOtherPersonGroup?.classList.add('d-none');
        cwPersonName?.removeAttribute('required');
      }
    });
  }

  // Phone auto-sanitize on input (strip leading 91 / 0)
  if (cwPhoneInput) {
    cwPhoneInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '');
      if (val.length === 12 && val.startsWith('91')) val = val.slice(2);
      else if (val.length === 11 && val.startsWith('0')) val = val.slice(1);
      e.target.value = val.slice(0, 10);
    });
  }

  // Reset hidden groups when modal closes
  const crmWalkinModalEl = document.getElementById('crmWalkinModal');
  if (crmWalkinModalEl) {
    crmWalkinModalEl.addEventListener('hidden.bs.modal', () => {
      document.getElementById('crmWalkinForm')?.reset();
      cwOtherServiceGroup?.classList.add('d-none');
      cwOtherPersonGroup?.classList.add('d-none');
      if (cwOtherService) cwOtherService.removeAttribute('required');
      if (cwPersonName) cwPersonName.removeAttribute('required');
      const tokenAlert = document.getElementById('cw_tokenResultAlert');
      if (tokenAlert) tokenAlert.classList.add('d-none');
    });
  }

  // Doctor Form Submit
  document.getElementById('doctorForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('d_id').value;
    const payload = {
      name: document.getElementById('d_name').value,
      specialization: document.getElementById('d_specialization').value,
      qualification: document.getElementById('d_qualification').value,
      experience: document.getElementById('d_experience').value,
      contact: document.getElementById('d_contact').value,
      email: document.getElementById('d_email').value,
      available_days: document.getElementById('d_days').value,
      available_time: document.getElementById('d_time').value
    };

    try {
      const url = id ? `/api/doctors/${id}` : '/api/doctors';
      const method = id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        bootstrap.Modal.getInstance(document.getElementById('doctorModal')).hide();
        showToast('Doctor profile saved successfully!', 'success');
        fetchDoctorsList();
        loadDoctorsDropdown();
      } else {
        showToast(data.message || 'Error saving doctor.', 'danger');
      }
    } catch (e) {
      showToast('Failed to save doctor.', 'danger');
    }
  });

  // Patient Form Submit
  document.getElementById('patientForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('p_id').value;

    const rawPhone = document.getElementById('p_phone').value;
    const cleanPhone = sanitizeIndianMobile(rawPhone);
    if (!isValidIndianMobile(cleanPhone)) {
      showToast('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.', 'warning');
      document.getElementById('p_phone')?.focus();
      return;
    }

    const submitBtn = document.getElementById('patientSubmitBtn');
    const origBtnHtml = submitBtn ? submitBtn.innerHTML : 'Save Patient Details';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i> Saving...';
    }

    const payload = {
      name: document.getElementById('p_name').value.trim(),
      phone: cleanPhone,
      email: document.getElementById('p_email').value.trim(),
      gender: document.getElementById('p_gender').value,
      blood_group: document.getElementById('p_blood').value.trim(),
      dob: document.getElementById('p_dob').value || null,
      emergency_contact: sanitizeIndianMobile(document.getElementById('p_emergency').value) || document.getElementById('p_emergency').value.trim(),
      medical_history: document.getElementById('p_medical').value.trim(),
      allergy: document.getElementById('p_allergy').value.trim(),
      current_medication: document.getElementById('p_medication').value.trim(),
      outstanding_balance: parseFloat(document.getElementById('p_balance').value || 0),
      address: document.getElementById('p_address').value.trim()
    };

    try {
      const url = id ? `/api/patients/${id}` : '/api/patients';
      const method = id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        const modalEl = document.getElementById('patientModal');
        if (modalEl) {
          const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
          bsModal.hide();
        }
        document.getElementById('patientForm')?.reset();
        document.getElementById('p_id').value = '';
        showToast(id ? 'Patient record updated successfully!' : 'Patient registered successfully!', 'success');
        await fetchPatientsList();
        loadDashboardStats();
      } else {
        showToast(data.message || 'Error saving patient.', 'danger');
      }
    } catch (e) {
      console.error('Save patient error:', e);
      showToast('Failed to save patient record.', 'danger');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origBtnHtml;
      }
    }
  });
}

// Utility: INR Formatter
function formatINR(amount) {
  const num = parseFloat(amount || 0);
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ========================================================
// 16. INDIAN 10-DIGIT MOBILE NUMBER SANITIZER & VALIDATOR
// ========================================================
function sanitizeIndianMobile(val) {
  if (!val) return '';
  let str = String(val).replace(/\D/g, '');
  if (str.length === 12 && str.startsWith('91')) {
    str = str.slice(2);
  } else if (str.length === 11 && str.startsWith('0')) {
    str = str.slice(1);
  }
  return str.slice(0, 10);
}

function isValidIndianMobile(phone) {
  const clean = sanitizeIndianMobile(phone);
  return /^[6-9]\d{9}$/.test(clean);
}

function initIndianPhoneSanitizer() {
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (!t) return;
    const isPhoneField = t.type === 'tel' || 
      t.id === 'phone' || 
      t.id === 'cw_phone' || 
      t.id === 'p_phone' || 
      t.id === 'p_emergency' || 
      t.id === 'eb_phone' || 
      t.id === 'new_user_phone' || 
      t.id === 'd_contact';

    if (isPhoneField) {
      const original = t.value;
      const cleaned = sanitizeIndianMobile(original);
      if (original !== cleaned) {
        t.value = cleaned;
      }
    }
  });
}

// ========================================================
// 17. NOTIFICATION HUB & AUTOMATION ENGINE (WhatsApp & Make.com)
// ========================================================
let notifDataStore = {
  templates: [],
  settings: {},
  patients: [],
  bookings: [],
  history: [],
  logs: [],
  counts: {},
  cohort_list: []
};

let activeSelectedRecipient = null;
let activeRecipientMode = 'single'; // 'single' or 'batch'
let selectedCohortPatientIds = new Set();
let currentCohortFilter = 'all';

async function loadNotificationCenter() {
  try {
    const res = await fetch('/api/notifications', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const data = await res.json();
    if (!data.success) {
      showToast(data.message || 'Failed to load notifications data', 'danger');
      return;
    }

    notifDataStore = {
      templates: data.templates || [],
      settings: data.settings || {},
      patients: data.patients || [],
      bookings: data.bookings || [],
      history: data.history || [],
      logs: data.recent_logs || [],
      counts: data.counts || {},
      cohort_list: data.cohort_list || []
    };

    renderNotifRecipientOptions();
    renderNotifTemplateOptions();
    renderNotifLogsTable();
    updateChannelBadge();

    // Populate Cohort Quick Match Template Dropdown
    populateCohortQuickTemplateSelect();

    // Render Cohort Bifurcation Table & Filter Badges
    updateCohortFilterBadges();
    renderCohortTable();

    // Default clinic branding in preview
    const previewClinic = document.getElementById('previewClinicName');
    if (previewClinic) {
      previewClinic.innerText = `${notifDataStore.settings.clinic_name || 'Dental'} Clinic`;
    }

    const previewAddress = document.getElementById('previewBtnAddress');
    if (previewAddress) {
      previewAddress.innerText = notifDataStore.settings.clinic_address || 'Clinic Location';
    }

    // Trigger initial preview render
    renderNotificationPreview();
  } catch (err) {
    console.error('loadNotificationCenter error:', err);
    showToast('Network error while loading notification center', 'danger');
  }
}

function renderNotifRecipientOptions() {
  const sel = document.getElementById('notifPatientSelector');
  if (!sel) return;

  let html = '<option value="">-- Choose Patient or Appointment --</option>';

  // Optgroup 1: Active Bookings & Consultations
  if (notifDataStore.bookings && notifDataStore.bookings.length > 0) {
    html += '<optgroup label="📅 Active Bookings & Today Queue">';
    notifDataStore.bookings.forEach(b => {
      const token = b.visual_token ? `[${b.visual_token}] ` : '';
      const doc = b.doctor_name ? ` • ${b.doctor_name}` : '';
      html += `<option value="booking_${b.id}">
        ${escapeHtml(token)}${escapeHtml(b.patient_name || 'Patient')} (${escapeHtml(b.phone || '-')}) • ${escapeHtml(b.booking_date || '')} ${escapeHtml(b.booking_time || '')}${escapeHtml(doc)}
      </option>`;
    });
    html += '</optgroup>';
  }

  // Optgroup 2: Completed Treatments (for Reviews & Post-Op)
  if (notifDataStore.history && notifDataStore.history.length > 0) {
    html += '<optgroup label="🩺 Recent Completed Treatments">';
    notifDataStore.history.slice(0, 20).forEach(h => {
      const treatment = h.treatment_performed || h.service_name || 'Treatment';
      html += `<option value="history_${h.id}">
        [Completed] ${escapeHtml(h.patient_name || 'Patient')} (${escapeHtml(h.phone || '-')}) • ${escapeHtml(treatment)}
      </option>`;
    });
    html += '</optgroup>';
  }

  // Optgroup 3: Registered Patients Directory (with outstanding balances)
  if (notifDataStore.patients && notifDataStore.patients.length > 0) {
    html += '<optgroup label="👥 All Registered Patients">';
    notifDataStore.patients.forEach(p => {
      const bal = parseFloat(p.outstanding_balance) > 0 ? ` • Due: ₹${parseFloat(p.outstanding_balance).toFixed(2)}` : '';
      html += `<option value="patient_${p.id}">
        [${p.patient_code || 'PT'}] ${escapeHtml(p.name)} (${escapeHtml(p.phone)})${bal}
      </option>`;
    });
    html += '</optgroup>';
  }

  sel.innerHTML = html;
}

function renderNotifTemplateOptions() {
  const sel = document.getElementById('notifTemplateSelector');
  if (!sel) return;

  let html = '';
  (notifDataStore.templates || []).forEach(t => {
    html += `<option value="${t.id}">${escapeHtml(t.name)} (${escapeHtml(t.title)})</option>`;
  });
  sel.innerHTML = html;
}

function onNotifRecipientSelected() {
  const sel = document.getElementById('notifPatientSelector');
  if (!sel) return;
  const val = sel.value;

  if (!val) {
    activeSelectedRecipient = null;
    clearNotifFormVariables();
    renderNotificationPreview();
    return;
  }

  const [type, idStr] = val.split('_');
  const id = parseInt(idStr, 10);
  const today = new Date().toISOString().split('T')[0];

  let pName = '';
  let phone = '';
  let doctor = '';
  let date = today;
  let time = '10:00 AM';
  let token = 'A001';
  let treatment = 'General Dental Consultation';
  let dueAmount = 0;
  let bookingId = null;
  let patientId = null;

  if (type === 'booking') {
    const b = (notifDataStore.bookings || []).find(x => x.id === id);
    if (b) {
      bookingId = b.id;
      pName = b.patient_name || '';
      phone = b.phone || '';
      doctor = b.doctor_name || 'Dr. Alexander Wright';
      date = b.booking_date || today;
      time = b.booking_time || '10:00 AM';
      token = b.visual_token || 'A001';
      treatment = b.service_name || 'Dental Consultation';
      dueAmount = parseFloat(b.final_amount) || 0;
    }
  } else if (type === 'history') {
    const h = (notifDataStore.history || []).find(x => x.id === id);
    if (h) {
      bookingId = h.booking_id || null;
      pName = h.patient_name || '';
      phone = h.phone || '';
      doctor = h.doctor_name || 'Dr. Alexander Wright';
      date = h.appointment_date || today;
      time = h.appointment_time || '10:00 AM';
      token = h.visual_token || 'A001';
      treatment = h.treatment_performed || h.service_name || 'Dental Treatment';
      dueAmount = parseFloat(h.due_amount) || 0;
    }
  } else if (type === 'patient') {
    const p = (notifDataStore.patients || []).find(x => x.id === id);
    if (p) {
      patientId = p.id;
      pName = p.name || '';
      phone = p.phone || '';
      doctor = 'Dr. Alexander Wright';
      token = p.patient_code || 'A001';
      dueAmount = parseFloat(p.outstanding_balance) || 0;
    }
  }

  activeSelectedRecipient = {
    type,
    id,
    bookingId,
    patientId,
    pName,
    phone,
    doctor,
    date,
    time,
    token,
    treatment,
    dueAmount
  };

  // Populate dynamic form variables
  document.getElementById('notifVarPatientName').value = pName;
  document.getElementById('notifVarPhone').value = sanitizeIndianMobile(phone);
  document.getElementById('notifVarDoctor').value = doctor || 'Dr. Alexander Wright';
  document.getElementById('notifVarDate').value = date;
  document.getElementById('notifVarTime').value = time;
  document.getElementById('notifVarToken').value = token;
  document.getElementById('notifVarTreatment').value = treatment;
  document.getElementById('notifVarDueAmount').value = dueAmount || '0.00';

  const basePay = notifDataStore.settings.payment_link_base || 'https://pay.dentalclinic.com/invoice/';
  document.getElementById('notifVarPaymentLink').value = `${basePay}${bookingId || patientId || 'ref'}`;
  document.getElementById('notifVarReviewLink').value = notifDataStore.settings.google_review_link || 'https://g.page/r/dental-clinic/review';

  // If patient has pending balance, auto-switch to Payment Reminder template
  if (dueAmount > 0 && type === 'patient') {
    const tplSel = document.getElementById('notifTemplateSelector');
    if (tplSel) tplSel.value = 'tpl_payment_reminder';
  } else if (type === 'history') {
    const tplSel = document.getElementById('notifTemplateSelector');
    if (tplSel) tplSel.value = 'tpl_review_request';
  }

  renderNotificationPreview();
}

function onNotifTemplateChanged() {
  resetTemplateBody();
}

function resetTemplateBody() {
  const tplId = document.getElementById('notifTemplateSelector')?.value;
  const tpl = (notifDataStore.templates || []).find(t => t.id === tplId) || notifDataStore.templates[0];
  if (!tpl) return;

  const interpolated = interpolateTemplate(tpl.text);
  const msgArea = document.getElementById('notifMessageText');
  if (msgArea) msgArea.value = interpolated;

  renderNotificationPreview(true);
}

function interpolateTemplate(rawTemplate) {
  if (!rawTemplate) return '';

  const pName = document.getElementById('notifVarPatientName')?.value || 'Valued Patient';
  const doctor = document.getElementById('notifVarDoctor')?.value || 'Dr. Alexander Wright';
  const date = document.getElementById('notifVarDate')?.value || new Date().toISOString().split('T')[0];
  const time = document.getElementById('notifVarTime')?.value || '10:00 AM';
  const token = document.getElementById('notifVarToken')?.value || 'A001';
  const treatment = document.getElementById('notifVarTreatment')?.value || 'Dental Consultation';
  const dueAmt = document.getElementById('notifVarDueAmount')?.value || '0.00';
  const payLink = document.getElementById('notifVarPaymentLink')?.value || 'https://pay.dental.com/inv';
  const reviewLink = document.getElementById('notifVarReviewLink')?.value || 'https://g.page/r/dental/review';
  const clinicName = notifDataStore.settings.clinic_name || 'Dental';
  const clinicAddress = notifDataStore.settings.clinic_address || '104 Healthcare Boulevard';
  const clinicPhone = notifDataStore.settings.clinic_phone || '+91 90334 74123';

  return rawTemplate
    .replace(/\{\{patient_name\}\}/g, pName)
    .replace(/\{\{doctor_name\}\}/g, doctor)
    .replace(/\{\{date\}\}/g, date)
    .replace(/\{\{time\}\}/g, time)
    .replace(/\{\{token\}\}/g, token)
    .replace(/\{\{treatment_name\}\}/g, treatment)
    .replace(/\{\{due_amount\}\}/g, dueAmt)
    .replace(/\{\{payment_link\}\}/g, payLink)
    .replace(/\{\{review_link\}\}/g, reviewLink)
    .replace(/\{\{clinic_name\}\}/g, clinicName)
    .replace(/\{\{clinic_address\}\}/g, clinicAddress)
    .replace(/\{\{clinic_phone\}\}/g, clinicPhone);
}

function renderNotificationPreview(fromManualEdit = false) {
  const tplId = document.getElementById('notifTemplateSelector')?.value;
  const tpl = (notifDataStore.templates || []).find(t => t.id === tplId) || notifDataStore.templates[0];

  let bodyText = '';
  if (fromManualEdit) {
    bodyText = document.getElementById('notifMessageText')?.value || '';
  } else {
    bodyText = interpolateTemplate(tpl ? tpl.text : '');
    const msgArea = document.getElementById('notifMessageText');
    if (msgArea) msgArea.value = bodyText;
  }

  // Update Preview Phone Elements
  const previewBody = document.getElementById('previewMessageBody');
  if (previewBody) previewBody.innerText = bodyText;

  const previewTplTitle = document.getElementById('previewTemplateTitle');
  if (previewTplTitle) previewTplTitle.innerText = tpl ? tpl.name : 'Notification';

  const charCountEl = document.getElementById('notifCharCount');
  if (charCountEl) charCountEl.innerText = `${bodyText.length} chars`;

  // Action Buttons in WhatsApp preview
  const btnContainer = document.getElementById('previewActionButtons');
  if (btnContainer && tpl) {
    const payLink = document.getElementById('notifVarPaymentLink')?.value || '';
    const reviewLink = document.getElementById('notifVarReviewLink')?.value || '';
    const clinicAddress = notifDataStore.settings.clinic_address || '104 Healthcare Boulevard';

    let buttonsHtml = '';
    if (tpl.category === 'payment_reminder') {
      buttonsHtml += `<a href="${escapeHtml(payLink)}" target="_blank" class="badge bg-warning text-dark border text-start py-2 px-2 text-decoration-none fw-semibold" style="font-size: 0.72rem;">
        <i class="fa-solid fa-receipt me-1"></i> Pay Outstanding Bill Now
      </a>`;
    } else if (tpl.category === 'review_request') {
      buttonsHtml += `<a href="${escapeHtml(reviewLink)}" target="_blank" class="badge bg-success text-white border text-start py-2 px-2 text-decoration-none fw-semibold" style="font-size: 0.72rem;">
        <i class="fa-solid fa-star me-1"></i> Leave 5-Star Google Review
      </a>`;
    } else {
      buttonsHtml += `<div class="badge bg-light text-primary border text-start py-2 px-2 fw-semibold" style="font-size: 0.72rem;">
        <i class="fa-solid fa-map-location-dot me-1"></i> ${escapeHtml(clinicAddress)}
      </div>`;
    }
    btnContainer.innerHTML = buttonsHtml;
  }

  // Build JSON Payload for preview inspector
  updatePayloadJsonInspector(tpl, bodyText);
}

function updatePayloadJsonInspector(tpl, bodyText) {
  const channel = document.querySelector('input[name="notifChannel"]:checked')?.value || 'whatsapp';
  const pName = document.getElementById('notifVarPatientName')?.value || '';
  const phone = document.getElementById('notifVarPhone')?.value || '';
  const doctor = document.getElementById('notifVarDoctor')?.value || '';
  const date = document.getElementById('notifVarDate')?.value || '';
  const time = document.getElementById('notifVarTime')?.value || '';
  const token = document.getElementById('notifVarToken')?.value || '';
  const treatment = document.getElementById('notifVarTreatment')?.value || '';
  const dueAmt = document.getElementById('notifVarDueAmount')?.value || '0.00';
  const payLink = document.getElementById('notifVarPaymentLink')?.value || '';
  const reviewLink = document.getElementById('notifVarReviewLink')?.value || '';

  const jsonPayload = {
    event: 'crm_notification_dispatched',
    channel,
    template_id: tpl?.id || 'tpl_custom',
    template_name: tpl?.name || 'Custom',
    recipient: {
      name: pName,
      phone: phone ? (phone.length === 10 ? `91${phone}` : phone) : ''
    },
    appointment: {
      token,
      doctor,
      date,
      time,
      treatment,
      due_amount: parseFloat(dueAmt) || 0
    },
    links: {
      payment_link: payLink,
      review_link: reviewLink
    },
    message: bodyText,
    timestamp: new Date().toISOString()
  };

  const preEl = document.getElementById('previewJsonPayload');
  if (preEl) {
    preEl.innerText = JSON.stringify(jsonPayload, null, 2);
  }
}

function updateChannelBadge() {
  const channel = document.querySelector('input[name="notifChannel"]:checked')?.value || 'whatsapp';
  const ind = document.getElementById('notifChannelIndicator');
  const sendBtn = document.getElementById('btnSendNotification');

  if (channel === 'whatsapp') {
    if (ind) {
      ind.className = 'badge bg-success-subtle text-success border border-success-subtle';
      ind.innerHTML = '<i class="fa-brands fa-whatsapp me-1"></i>Channel: WhatsApp API';
    }
    if (sendBtn) {
      sendBtn.className = 'btn btn-success fw-bold px-4 shadow-sm';
      sendBtn.innerHTML = '<i class="fa-brands fa-whatsapp me-1"></i> Send WhatsApp API';
    }
  } else {
    if (ind) {
      ind.className = 'badge bg-warning-subtle text-warning border border-warning-subtle';
      ind.innerHTML = '<i class="fa-solid fa-bolt me-1"></i>Channel: Make.com Webhook';
    }
    if (sendBtn) {
      sendBtn.className = 'btn btn-warning text-dark fw-bold px-4 shadow-sm';
      sendBtn.innerHTML = '<i class="fa-solid fa-bolt me-1"></i> Trigger Make.com';
    }
  }
  renderNotificationPreview();
}

function quickApplyScenario(category) {
  const tpl = (notifDataStore.templates || []).find(t => t.category === category);
  if (tpl) {
    const tplSel = document.getElementById('notifTemplateSelector');
    if (tplSel) tplSel.value = tpl.id;
  }

  // Pre-select matching recipient if empty
  const recipientSel = document.getElementById('notifPatientSelector');
  if (recipientSel && !recipientSel.value) {
    if (category === 'review_request' && notifDataStore.history.length > 0) {
      recipientSel.value = `history_${notifDataStore.history[0].id}`;
      onNotifRecipientSelected();
    } else if (category === 'payment_reminder') {
      const duePatient = notifDataStore.patients.find(p => parseFloat(p.outstanding_balance) > 0);
      if (duePatient) {
        recipientSel.value = `patient_${duePatient.id}`;
        onNotifRecipientSelected();
      }
    } else if (notifDataStore.bookings.length > 0) {
      recipientSel.value = `booking_${notifDataStore.bookings[0].id}`;
      onNotifRecipientSelected();
    }
  }

  resetTemplateBody();
  showToast(`Scenario "${tpl ? tpl.name : category}" applied to composer!`, 'info');
}

function clearNotifForm() {
  const recipientSel = document.getElementById('notifPatientSelector');
  if (recipientSel) recipientSel.value = '';
  activeSelectedRecipient = null;
  clearNotifFormVariables();
  resetTemplateBody();
}

function clearNotifFormVariables() {
  document.getElementById('notifVarPatientName').value = '';
  document.getElementById('notifVarPhone').value = '';
  document.getElementById('notifVarDoctor').value = '';
  document.getElementById('notifVarDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('notifVarTime').value = '10:00 AM';
  document.getElementById('notifVarToken').value = '';
  document.getElementById('notifVarTreatment').value = '';
  document.getElementById('notifVarDueAmount').value = '0.00';
  document.getElementById('notifVarPaymentLink').value = '';
  document.getElementById('notifVarReviewLink').value = '';
  document.getElementById('notifMessageText').value = '';
}

async function sendNotificationPayload() {
  const channel = document.querySelector('input[name="notifChannel"]:checked')?.value || 'whatsapp';
  const tplId = document.getElementById('notifTemplateSelector')?.value;
  const messageText = document.getElementById('notifMessageText')?.value || '';

  if (!messageText.trim()) {
    showToast('Message body cannot be empty.', 'warning');
    return;
  }

  // --- BATCH MULTI-PATIENT MODE ---
  if (activeRecipientMode === 'batch') {
    if (selectedCohortPatientIds.size === 0) {
      showToast('Please select at least 1 patient from the Excel Cohort Table below.', 'warning');
      scrollToCohortTable();
      return;
    }

    const selectedList = (notifDataStore.cohort_list || []).filter(c => selectedCohortPatientIds.has(c.id));
    if (selectedList.length === 0) {
      showToast('No matching patient records found for selection.', 'warning');
      return;
    }

    const sendBtn = document.getElementById('btnSendNotification');
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Sending to ${selectedList.length} Patients...`;
    }

    const recipientsPayload = selectedList.map(item => ({
      patient_id: item.id,
      name: item.name,
      phone: item.phone,
      doctor_name: item.doctor_name || 'Dr. Alexander Wright',
      date: item.next_appointment_date || new Date().toISOString().split('T')[0],
      time: item.next_appointment_time || '10:00 AM',
      token: item.next_token || 'A001',
      treatment: item.last_treatment || 'Dental Care',
      due_amount: item.outstanding_balance || 0,
      payment_link: `${notifDataStore.settings.payment_link_base || 'https://pay.dentalclinic.com/invoice/'}${item.id}`,
      review_link: notifDataStore.settings.google_review_link || 'https://g.page/r/dental-clinic/review'
    }));

    try {
      const res = await fetch('/api/notifications/dispatch-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({
          channel,
          template_id: tplId,
          recipients: recipientsPayload,
          custom_template_text: messageText
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast(`🎉 Success! Batch notifications sent to ${recipientsPayload.length} patients via ${channel === 'whatsapp' ? 'WhatsApp' : 'Make.com'}!`, 'success');
        loadNotificationCenter(); // Reload logs & table
      } else {
        showToast(data.message || 'Batch dispatch failed.', 'danger');
      }
    } catch (err) {
      console.error('sendBatchNotification error:', err);
      showToast('Network error while dispatching batch notification.', 'danger');
    } finally {
      if (sendBtn) {
        sendBtn.disabled = false;
        updateChannelBadge();
      }
    }
    return;
  }

  // --- SINGLE RECIPIENT MODE ---
  const phone = sanitizeIndianMobile(document.getElementById('notifVarPhone')?.value || '');
  const pName = document.getElementById('notifVarPatientName')?.value || 'Patient';

  if (!phone || phone.length < 10) {
    showToast('Please enter a valid 10-digit mobile number for the recipient.', 'warning');
    document.getElementById('notifVarPhone')?.focus();
    return;
  }

  const sendBtn = document.getElementById('btnSendNotification');
  if (sendBtn) {
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Dispatching...';
  }

  const payload = {
    channel,
    template_id: tplId,
    patient_id: activeSelectedRecipient?.patientId || null,
    booking_id: activeSelectedRecipient?.bookingId || null,
    recipient_phone: phone,
    recipient_name: pName,
    doctor_name: document.getElementById('notifVarDoctor')?.value || 'Dr. Alexander Wright',
    appointment_date: document.getElementById('notifVarDate')?.value || '',
    appointment_time: document.getElementById('notifVarTime')?.value || '',
    token: document.getElementById('notifVarToken')?.value || 'A001',
    treatment_name: document.getElementById('notifVarTreatment')?.value || '',
    due_amount: parseFloat(document.getElementById('notifVarDueAmount')?.value) || 0,
    payment_link: document.getElementById('notifVarPaymentLink')?.value || '',
    review_link: document.getElementById('notifVarReviewLink')?.value || '',
    rendered_message: messageText
  };

  try {
    const res = await fetch('/api/notifications/dispatch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      showToast(`Success! Dispatched via ${channel === 'whatsapp' ? 'WhatsApp' : 'Make.com'} to ${pName} (${phone})`, 'success');
      loadNotificationCenter(); // Reload logs
    } else {
      showToast(data.message || 'Notification dispatch failed.', 'danger');
    }
  } catch (err) {
    console.error('sendNotificationPayload error:', err);
    showToast('Network error while dispatching notification.', 'danger');
  } finally {
    if (sendBtn) {
      sendBtn.disabled = false;
      updateChannelBadge();
    }
  }
}

// ----------------------------------------------------
// MULTI-PATIENT COHORT BIFURCATION & SPREADSHEET ENGINE
// ----------------------------------------------------
function toggleRecipientMode(mode) {
  activeRecipientMode = mode;
  const singleWrap = document.getElementById('singleRecipientWrap');
  const batchWrap = document.getElementById('batchRecipientWrap');
  const singleRadio = document.getElementById('modeSingle');
  const batchRadio = document.getElementById('modeBatch');

  if (mode === 'single') {
    if (singleRadio) singleRadio.checked = true;
    if (singleWrap) singleWrap.classList.remove('d-none');
    if (batchWrap) batchWrap.classList.add('d-none');
  } else {
    if (batchRadio) batchRadio.checked = true;
    if (singleWrap) singleWrap.classList.add('d-none');
    if (batchWrap) batchWrap.classList.remove('d-none');
    updateBatchPillsDisplay();
  }
  updateChannelBadge();
}

function scrollToCohortTable() {
  const el = document.getElementById('cohortSpreadsheetSection');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function updateCohortFilterBadges() {
  const counts = notifDataStore.counts || {};
  document.getElementById('badgeCohortAll').innerText = counts.all || 0;
  document.getElementById('badgeCohortTomorrow').innerText = counts.tomorrow || 0;
  document.getElementById('badgeCohortVisited30').innerText = counts.visited_30d || 0;
  document.getElementById('badgeCohortVisited3090').innerText = counts.not_visited_30_90d || 0;
  document.getElementById('badgeCohortNotVisited90').innerText = counts.not_visited_90d || 0;
  document.getElementById('badgeCohortNotVisited180').innerText = counts.not_visited_180d || 0;
  document.getElementById('badgeCohortNotVisited365').innerText = counts.not_visited_365d || 0;
  document.getElementById('badgeCohortNeverVisited').innerText = counts.never_visited || 0;
  document.getElementById('badgeCohortPaymentPending').innerText = counts.payment_pending || 0;
}

function filterCohortTable(filterKey) {
  currentCohortFilter = filterKey;

  // Update Active Pill UI
  const tabs = document.querySelectorAll('#cohortFilterTabs .nav-link');
  tabs.forEach(t => {
    if (t.getAttribute('data-cohort-filter') === filterKey) {
      t.classList.add('active');
    } else {
      t.classList.remove('active');
    }
  });

  // Automatically suggest matching template for convenience!
  const tplSel = document.getElementById('cohortQuickTemplateSelect');
  if (filterKey === 'tomorrow') {
    if (tplSel) tplSel.value = 'tpl_reminder_24h';
    syncCohortTemplateSelection();
  } else if (filterKey === 'visited_30d') {
    if (tplSel) tplSel.value = 'tpl_review_request';
    syncCohortTemplateSelection();
  } else if (filterKey === 'payment_pending') {
    if (tplSel) tplSel.value = 'tpl_payment_reminder';
    syncCohortTemplateSelection();
  } else if (filterKey.startsWith('not_visited')) {
    if (tplSel) tplSel.value = 'tpl_reschedule';
    syncCohortTemplateSelection();
  }

  renderCohortTable();
}

function populateCohortQuickTemplateSelect() {
  const sel = document.getElementById('cohortQuickTemplateSelect');
  if (!sel) return;

  let html = '<option value="">-- Match Template for Selected --</option>';
  (notifDataStore.templates || []).forEach(t => {
    html += `<option value="${t.id}">${escapeHtml(t.name)}</option>`;
  });
  sel.innerHTML = html;
}

function syncCohortTemplateSelection() {
  const cohortTpl = document.getElementById('cohortQuickTemplateSelect')?.value;
  if (!cohortTpl) return;

  const mainTplSel = document.getElementById('notifTemplateSelector');
  if (mainTplSel) {
    mainTplSel.value = cohortTpl;
    onNotifTemplateChanged();
  }
}

function getFilteredCohortList() {
  const allList = notifDataStore.cohort_list || [];
  const search = (document.getElementById('cohortSearchInput')?.value || '').toLowerCase().trim();

  return allList.filter(item => {
    // 1. Bifurcation Filter
    let matchFilter = true;
    if (currentCohortFilter === 'tomorrow') {
      matchFilter = item.is_tomorrow;
    } else if (currentCohortFilter === 'visited_30d') {
      matchFilter = item.days_since_visit !== null && item.days_since_visit <= 30;
    } else if (currentCohortFilter === 'not_visited_30_90d') {
      matchFilter = item.days_since_visit !== null && item.days_since_visit > 30 && item.days_since_visit <= 90;
    } else if (currentCohortFilter === 'not_visited_90d') {
      matchFilter = item.days_since_visit !== null && item.days_since_visit > 90;
    } else if (currentCohortFilter === 'not_visited_180d') {
      matchFilter = item.days_since_visit !== null && item.days_since_visit > 180;
    } else if (currentCohortFilter === 'not_visited_365d') {
      matchFilter = item.days_since_visit !== null && item.days_since_visit > 365;
    } else if (currentCohortFilter === 'never_visited') {
      matchFilter = !item.has_visited;
    } else if (currentCohortFilter === 'payment_pending') {
      matchFilter = item.outstanding_balance > 0;
    }

    if (!matchFilter) return false;

    // 2. Search query filter
    if (search) {
      const pName = (item.name || '').toLowerCase();
      const pPhone = (item.phone || '').toLowerCase();
      const pCode = (item.patient_code || '').toLowerCase();
      const pDoctor = (item.doctor_name || '').toLowerCase();
      const pTreatment = (item.last_treatment || '').toLowerCase();

      return pName.includes(search) || pPhone.includes(search) || pCode.includes(search) || pDoctor.includes(search) || pTreatment.includes(search);
    }

    return true;
  });
}

function renderCohortTable() {
  const tbody = document.getElementById('cohortSpreadsheetTbody');
  const visCountEl = document.getElementById('cohortVisibleCount');
  const selCountEl = document.getElementById('cohortTotalSelectedCount');
  const btnCohortCount = document.getElementById('btnSendCohortCount');
  const headerCheckbox = document.getElementById('cohortHeaderCheckbox');

  if (!tbody) return;

  const filtered = getFilteredCohortList();
  if (visCountEl) visCountEl.innerText = filtered.length;
  if (selCountEl) selCountEl.innerText = selectedCohortPatientIds.size;
  if (btnCohortCount) btnCohortCount.innerText = selectedCohortPatientIds.size;

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="11" class="text-center text-muted py-4"><i class="fa-solid fa-filter me-1"></i> No patients match this bifurcation filter or search query.</td></tr>';
    if (headerCheckbox) headerCheckbox.checked = false;
    return;
  }

  // Check if all visible are selected
  const allVisibleSelected = filtered.every(f => selectedCohortPatientIds.has(f.id));
  if (headerCheckbox) headerCheckbox.checked = allVisibleSelected && filtered.length > 0;

  let html = '';
  filtered.forEach(p => {
    const isChecked = selectedCohortPatientIds.has(p.id);
    const balanceText = p.outstanding_balance > 0 ? `<span class="badge bg-danger-subtle text-danger fw-bold">₹${p.outstanding_balance.toFixed(2)}</span>` : '<span class="text-muted">₹0.00</span>';
    const lastVisitText = p.last_visit_date ? `<span class="fw-semibold text-dark">${p.last_visit_date}</span>` : '<span class="text-muted fst-italic">None</span>';
    const nextApptText = p.next_appointment_date ? `<span class="badge bg-primary-subtle text-primary border">${p.next_appointment_date} ${p.next_appointment_time || ''}</span>` : '<span class="text-muted">-</span>';

    html += `<tr class="${isChecked ? 'table-primary' : ''}">
      <td class="text-center">
        <input type="checkbox" class="form-check-input cohort-row-checkbox" value="${p.id}" ${isChecked ? 'checked' : ''} onchange="onCohortRowCheckboxChanged(${p.id}, this.checked)">
      </td>
      <td class="font-monospace small fw-bold text-dark">${escapeHtml(p.patient_code)}</td>
      <td>
        <div class="fw-bold text-dark">${escapeHtml(p.name)}</div>
        <small class="text-muted" style="font-size: 0.72rem;">${escapeHtml(p.relation || 'Self')}</small>
      </td>
      <td class="small text-muted font-monospace">${escapeHtml(p.phone)}</td>
      <td>
        <span class="badge ${p.status_badge_class} py-1 px-2" style="font-size: 0.72rem;">
          ${escapeHtml(p.status_label)}
        </span>
        ${p.is_tomorrow ? '<span class="badge bg-danger ms-1" style="font-size: 0.65rem;">Tomorrow</span>' : ''}
      </td>
      <td class="small">${lastVisitText}</td>
      <td class="small text-muted" style="max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(p.last_treatment || 'Consultation')}">${escapeHtml(p.last_treatment || 'Consultation')}</td>
      <td class="small text-dark" style="white-space: nowrap;">${escapeHtml(p.doctor_name || 'Dr. Alexander Wright')}</td>
      <td class="small" style="white-space: nowrap;">${nextApptText}</td>
      <td class="small" style="white-space: nowrap;">${balanceText}</td>
      <td class="text-center" style="white-space: nowrap;">
        <button type="button" class="btn btn-outline-primary btn-sm py-0 px-2" onclick="selectSingleCohortPatientForComposer(${p.id})" title="Load into Single Composer">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
      </td>
    </tr>`;
  });

  tbody.innerHTML = html;
}

function onCohortRowCheckboxChanged(patientId, isChecked) {
  if (isChecked) {
    selectedCohortPatientIds.add(patientId);
  } else {
    selectedCohortPatientIds.delete(patientId);
  }

  updateBatchPillsDisplay();
  renderCohortTable();
}

function onCohortHeaderCheckboxChanged(headerCb) {
  const isChecked = headerCb.checked;
  const filtered = getFilteredCohortList();

  filtered.forEach(p => {
    if (isChecked) {
      selectedCohortPatientIds.add(p.id);
    } else {
      selectedCohortPatientIds.delete(p.id);
    }
  });

  updateBatchPillsDisplay();
  renderCohortTable();
}

function toggleSelectAllCohort(selectAll) {
  const filtered = getFilteredCohortList();
  filtered.forEach(p => {
    if (selectAll) {
      selectedCohortPatientIds.add(p.id);
    } else {
      selectedCohortPatientIds.delete(p.id);
    }
  });

  updateBatchPillsDisplay();
  renderCohortTable();
}

function updateBatchPillsDisplay() {
  const countSpan = document.getElementById('batchSelectedCount');
  const container = document.getElementById('batchSelectedPillsContainer');
  const btnCohortCount = document.getElementById('btnSendCohortCount');

  const count = selectedCohortPatientIds.size;
  if (countSpan) countSpan.innerText = count;
  if (btnCohortCount) btnCohortCount.innerText = count;

  if (!container) return;

  if (count === 0) {
    container.innerHTML = '<span class="text-muted small fst-italic">No patients selected yet. Check rows in the Patient Cohort Table below or click "Select All" in any tab.</span>';
    return;
  }

  const selectedList = (notifDataStore.cohort_list || []).filter(c => selectedCohortPatientIds.has(c.id));
  let html = '<div class="d-flex flex-wrap gap-1 align-items-center">';
  selectedList.slice(0, 30).forEach(p => {
    html += `<span class="badge bg-primary-subtle text-primary border d-inline-flex align-items-center gap-1 py-1 px-2" style="font-size: 0.75rem;">
      <span>${escapeHtml(p.name)} (${escapeHtml(p.phone)})</span>
      <i class="fa-solid fa-xmark text-danger cursor-pointer ms-1" onclick="removeBatchSelectedPatient(${p.id})"></i>
    </span>`;
  });

  if (selectedList.length > 30) {
    html += `<span class="badge bg-secondary text-white py-1 px-2">+${selectedList.length - 30} more</span>`;
  }

  html += `<button type="button" class="btn btn-link btn-sm text-danger p-0 ms-2 text-decoration-none" onclick="clearBatchSelectedPatients()">Clear All</button>`;
  html += '</div>';

  container.innerHTML = html;
}

function removeBatchSelectedPatient(patientId) {
  selectedCohortPatientIds.delete(patientId);
  updateBatchPillsDisplay();
  renderCohortTable();
}

function clearBatchSelectedPatients() {
  selectedCohortPatientIds.clear();
  updateBatchPillsDisplay();
  renderCohortTable();
}

function selectSingleCohortPatientForComposer(patientId) {
  toggleRecipientMode('single');
  const recipientSel = document.getElementById('notifPatientSelector');
  if (recipientSel) {
    recipientSel.value = `patient_${patientId}`;
    onNotifRecipientSelected();
  }

  const composerEl = document.getElementById('notificationComposeForm');
  if (composerEl) composerEl.scrollIntoView({ behavior: 'smooth' });
  showToast('Patient loaded into Single Notification Composer!', 'info');
}

function applySelectedCohortToBatchComposer() {
  if (selectedCohortPatientIds.size === 0) {
    showToast('Please check at least 1 patient in the table first.', 'warning');
    return;
  }

  toggleRecipientMode('batch');
  const composerEl = document.getElementById('notificationComposeForm');
  if (composerEl) composerEl.scrollIntoView({ behavior: 'smooth' });
  showToast(`${selectedCohortPatientIds.size} patients loaded into Batch Composer! Choose template & channel to send.`, 'success');
}

// Export to Excel CSV
function exportCohortToExcelCSV() {
  const filtered = getFilteredCohortList();
  if (filtered.length === 0) {
    showToast('No patient data to export in current filter.', 'warning');
    return;
  }

  const headers = ['Patient Code', 'Name', 'Phone', 'Relation', 'Visit Status', 'Last Visit Date', 'Days Since Visit', 'Last Treatment', 'Attending Doctor', 'Next Appt Date', 'Next Appt Time', 'Outstanding Balance'];
  const rows = filtered.map(p => [
    `"${p.patient_code || ''}"`,
    `"${(p.name || '').replace(/"/g, '""')}"`,
    `"${p.phone || ''}"`,
    `"${p.relation || 'Self'}"`,
    `"${p.status_label || ''}"`,
    `"${p.last_visit_date || ''}"`,
    p.days_since_visit !== null ? p.days_since_visit : '',
    `"${(p.last_treatment || '').replace(/"/g, '""')}"`,
    `"${(p.doctor_name || '').replace(/"/g, '""')}"`,
    `"${p.next_appointment_date || ''}"`,
    `"${p.next_appointment_time || ''}"`,
    p.outstanding_balance || 0
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `dental_patients_cohort_${currentCohortFilter}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast(`Excel CSV downloaded with ${filtered.length} patients!`, 'success');
}

function renderNotifLogsTable() {
  const tbody = document.getElementById('notifLogsTableBody');
  const countBadge = document.getElementById('notifLogCount');
  if (!tbody) return;

  const logs = notifDataStore.logs || [];
  if (countBadge) countBadge.innerText = `${logs.length} dispatches`;

  if (logs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">No dispatches recorded yet. Use the composer above to send your first message.</td></tr>';
    return;
  }

  let html = '';
  logs.forEach(l => {
    const timeFormatted = l.created_at ? new Date(l.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'Recent';
    const isSuccess = l.type === 'success';
    const badgeColor = isSuccess ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning border border-warning-subtle';
    const icon = isSuccess ? 'fa-check' : 'fa-triangle-exclamation';

    html += `<tr>
      <td class="text-nowrap small text-muted"><i class="fa-regular fa-clock me-1"></i>${timeFormatted}</td>
      <td class="fw-semibold text-dark">${escapeHtml(l.title)}</td>
      <td class="small text-muted">${escapeHtml(l.message)}</td>
      <td>
        <span class="badge ${badgeColor} py-1 px-2">
          <i class="fa-solid ${icon} me-1"></i>${isSuccess ? 'Delivered' : 'Dispatched'}
        </span>
      </td>
      <td>
        <button class="btn btn-sm btn-link p-0 text-decoration-none text-primary" onclick="showLogDetailsModal('${escapeHtml(l.title)}', '${escapeHtml(l.message)}')">
          <i class="fa-solid fa-eye me-1"></i>View
        </button>
      </td>
    </tr>`;
  });

  tbody.innerHTML = html;
}

function showLogDetailsModal(title, msg) {
  alert(`${title}\n\n${msg}`);
}

// Settings Modal Management
function openNotificationConfigModal() {
  const s = notifDataStore.settings || {};
  document.getElementById('cfg_whatsapp_api_url').value = s.whatsapp_api_url || '';
  document.getElementById('cfg_whatsapp_phone_number_id').value = s.whatsapp_phone_number_id || '';
  document.getElementById('cfg_whatsapp_api_token').value = s.whatsapp_api_token || '';
  document.getElementById('cfg_make_webhook_url').value = s.make_webhook_url || '';
  document.getElementById('cfg_make_scenario_review_url').value = s.make_scenario_review_url || '';
  document.getElementById('cfg_make_scenario_payment_url').value = s.make_scenario_payment_url || '';
  document.getElementById('cfg_google_review_link').value = s.google_review_link || '';
  document.getElementById('cfg_payment_link_base').value = s.payment_link_base || '';

  const modalEl = document.getElementById('notifConfigModal');
  if (modalEl) {
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }
}

async function saveNotificationConfigForm() {
  const body = {
    whatsapp_api_url: document.getElementById('cfg_whatsapp_api_url')?.value || '',
    whatsapp_phone_number_id: document.getElementById('cfg_whatsapp_phone_number_id')?.value || '',
    whatsapp_api_token: document.getElementById('cfg_whatsapp_api_token')?.value || '',
    make_webhook_url: document.getElementById('cfg_make_webhook_url')?.value || '',
    make_scenario_review_url: document.getElementById('cfg_make_scenario_review_url')?.value || '',
    make_scenario_payment_url: document.getElementById('cfg_make_scenario_payment_url')?.value || '',
    google_review_link: document.getElementById('cfg_google_review_link')?.value || '',
    payment_link_base: document.getElementById('cfg_payment_link_base')?.value || ''
  };

  try {
    const res = await fetch('/api/notifications/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (data.success) {
      showToast('Notification channels & scenario endpoints saved successfully!', 'success');
      const modalEl = document.getElementById('notifConfigModal');
      if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
      }
      loadNotificationCenter();
    } else {
      showToast(data.message || 'Failed to save configuration.', 'danger');
    }
  } catch (err) {
    console.error('saveNotificationConfigForm error:', err);
    showToast('Network error while saving settings.', 'danger');
  }
}

