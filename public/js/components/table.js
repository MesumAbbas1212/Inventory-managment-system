function createTable({ columns, data, actions }) {
  const table = document.createElement('table');
  table.className = 'table table-striped table-hover align-middle';
  const thead = document.createElement('thead');
  thead.className = 'table-dark';
  const headerRow = document.createElement('tr');
  columns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col.label;
    th.style.cursor = col.sortable ? 'pointer' : '';
    headerRow.appendChild(th);
  });
  if (actions) headerRow.appendChild(document.createElement('th'));
  thead.appendChild(headerRow);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  if (data.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = columns.length + (actions ? 1 : 0);
    td.className = 'text-center text-muted py-4';
    td.textContent = 'No data found';
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    data.forEach((row, i) => {
      const tr = document.createElement('tr');
      columns.forEach(col => {
        const td = document.createElement('td');
        const val = col.render ? col.render(row[col.key], row) : row[col.key];
        if (val instanceof HTMLElement) td.appendChild(val);
        else td.textContent = val ?? '-';
        tr.appendChild(td);
      });
      if (actions) {
        const td = document.createElement('td');
        td.className = 'text-end';
        actions.forEach(a => {
          const btn = document.createElement('button');
          btn.className = `btn btn-sm ${a.class || 'btn-outline-primary'} me-1`;
          btn.textContent = a.label;
          btn.addEventListener('click', () => a.onClick(row));
          td.appendChild(btn);
        });
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    });
  }
  table.appendChild(tbody);
  return table;
}

function showModal({ title, body, onConfirm, confirmText = 'Save', cancelText = 'Cancel' }) {
  const modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.tabIndex = -1;
  modal.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">${title}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">${body}</div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${cancelText}</button>
          <button type="button" class="btn btn-primary" id="modal-confirm">${confirmText}</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();
  document.getElementById('modal-confirm').addEventListener('click', async () => {
    const btn = document.getElementById('modal-confirm');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
    try {
      await onConfirm();
      bsModal.hide();
      modal.addEventListener('hidden.bs.modal', () => modal.remove());
    } catch (e) {
      alert(e.message);
      btn.disabled = false;
      btn.textContent = confirmText;
    }
  });
  modal.addEventListener('hidden.bs.modal', () => modal.remove());
  return { modal, bsModal };
}
