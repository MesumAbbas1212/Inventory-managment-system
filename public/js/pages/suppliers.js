async function renderSuppliers(container) {
  const data = await API.get('/api/suppliers');
  container.innerHTML = '<div class="d-flex justify-content-between align-items-center mb-3"><h4 class="mb-0">Suppliers</h4><button class="btn btn-primary" id="btn-add-supplier">+ Add Supplier</button></div><div id="suppliers-table"></div>';

  const cols = [
    { label: 'Name', key: 'name' },
    { label: 'Contact', key: 'contact_person' },
    { label: 'Email', key: 'email' },
    { label: 'Phone', key: 'phone' },
    { label: 'Address', key: 'address' }
  ];
  const actions = [
    { label: 'Edit', class: 'btn-outline-primary', onClick: row => editSupplier(row) },
    { label: 'Delete', class: 'btn-outline-danger', onClick: row => deleteSupplier(row.id) }
  ];
  document.getElementById('suppliers-table').appendChild(createTable({ columns: cols, data, actions }));
  document.getElementById('btn-add-supplier').addEventListener('click', () => editSupplier(null));

  async function editSupplier(row) {
    const isEdit = !!row;
    const body = `
      <div class="mb-2"><label class="form-label">Name</label><input class="form-control" id="sup-name" value="${isEdit ? row.name : ''}"></div>
      <div class="mb-2"><label class="form-label">Contact Person</label><input class="form-control" id="sup-contact" value="${isEdit ? (row.contact_person || '') : ''}"></div>
      <div class="row mb-2">
        <div class="col"><label class="form-label">Email</label><input class="form-control" id="sup-email" value="${isEdit ? (row.email || '') : ''}"></div>
        <div class="col"><label class="form-label">Phone</label><input class="form-control" id="sup-phone" value="${isEdit ? (row.phone || '') : ''}"></div>
      </div>
      <div class="mb-2"><label class="form-label">Address</label><textarea class="form-control" id="sup-address" rows="2">${isEdit ? (row.address || '') : ''}</textarea></div>`;
    showModal({
      title: isEdit ? 'Edit Supplier' : 'Add Supplier',
      body,
      onConfirm: async () => {
        const name = document.getElementById('sup-name').value.trim();
        if (!name) throw new Error('Name is required');
        const payload = {
          name,
          contact_person: document.getElementById('sup-contact').value.trim() || null,
          email: document.getElementById('sup-email').value.trim() || null,
          phone: document.getElementById('sup-phone').value.trim() || null,
          address: document.getElementById('sup-address').value.trim() || null
        };
        if (isEdit) await API.put(`/api/suppliers/${row.id}`, payload);
        else await API.post('/api/suppliers', payload);
        renderSuppliers(container);
      }
    });
  }

  async function deleteSupplier(id) {
    if (!confirm('Delete this supplier?')) return;
    await API.del(`/api/suppliers/${id}`);
    renderSuppliers(container);
  }
}
