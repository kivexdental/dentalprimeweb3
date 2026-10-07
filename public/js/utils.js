// Toast Notification System
function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container-custom');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container-custom';
    document.body.appendChild(container);
  }

  const bgClass = type === 'success' ? 'bg-success text-white' : type === 'danger' ? 'bg-danger text-white' : 'bg-info text-white';
  const icon = type === 'success' ? 'fa-check-circle' : type === 'danger' ? 'fa-triangle-exclamation' : 'fa-info-circle';

  const toastEl = document.createElement('div');
  toastEl.className = `toast align-items-center ${bgClass} border-0 show shadow mb-2`;
  toastEl.role = 'alert';
  toastEl.innerHTML = `
    <div class="d-flex p-3 align-items-center">
      <i class="fa-solid ${icon} me-2 fs-5"></i>
      <div class="toast-body p-0 fw-semibold">${message}</div>
      <button type="button" class="btn-close btn-close-white ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
    </div>
  `;

  container.appendChild(toastEl);

  setTimeout(() => {
    toastEl.remove();
  }, 4000);
}

// Global INR Currency Formatter
function formatINR(amount) {
  const num = parseFloat(amount || 0);
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Export Table to CSV
function exportTableToCSV(filename, tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;

  const rows = Array.from(table.querySelectorAll('tr'));
  const csv = rows.map(row => {
    const cols = Array.from(row.querySelectorAll('th, td'));
    return cols.map(c => `"${c.innerText.replace(/"/g, '""').trim()}"`).join(',');
  }).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Protocol & Environment Check
if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
  window.addEventListener('DOMContentLoaded', () => {
    const fileWarning = document.createElement('div');
    fileWarning.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999999;background:#b02a37;color:#fff;text-align:center;padding:12px 20px;font-family:sans-serif;font-weight:600;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
    fileWarning.innerHTML = '⚠️ <strong>Notice:</strong> You are viewing this file via <code>file://</code>. API and database connections require the server. Please open <a href="http://localhost:5000" style="color:#fff;text-decoration:underline;margin-left:5px;font-weight:bold;">http://localhost:5000</a> in your browser.';
    document.body.prepend(fileWarning);
  });
}
