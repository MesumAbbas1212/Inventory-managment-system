async function renderPurchaseOrders(container) {
  const [pos, suppliers, products] = await Promise.all([
    API.get('/api/purchase-orders'),
    API.get('/api/suppliers'),
    API.get('/api/products')
  ]);
  container.innerHTML = '<div class="d-flex justify-content-between align-items-center mb-3"><h4 class="mb-0">Purchase Orders</h4><button class="btn btn-primary" id="btn-add-po">+ New Purchase Order</button></div><div id="po-table"></div>';

  const cols = [
    { label: 'PO #', key: 'id' },
    { label: 'Supplier', key: 'supplier_name' },
    { label: 'Date', key: 'order_date' },
    { label: 'Amount', key: 'total_amount', render: v => `$${Number(v).toFixed(2)}` },
    { label: 'Status', key: 'status', render: v => {
      const badge = { pending: 'warning', received: 'success', cancelled: 'secondary' };
      return `<span class="badge bg-${badge[v] || 'secondary'}">${v}</span>`;
    }}
  ];
  const actions = [
    { label: 'View', class: 'btn-outline-info btn-sm', onClick: row => viewPO(row) },
    { label: 'Receive', class: 'btn-outline-success btn-sm', onClick: row => receivePO(row.id) },
    { label: 'Delete', class: 'btn-outline-danger btn-sm', onClick: row => deletePO(row.id) }
  ];
  document.getElementById('po-table').appendChild(createTable({ columns: cols, data: pos, actions }));
  document.getElementById('btn-add-po').addEventListener('click', () => createPO());

  async function createPO() {
    const supOpts = suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    const prodOpts = products.map(p => `<option value="${p.id}" data-price="${p.unit_price}">${p.name} ($${Number(p.unit_price).toFixed(2)})</option>`).join('');
    const today = new Date().toISOString().split('T')[0];
    let body = `
      <div class="mb-2"><label class="form-label">Supplier</label><select class="form-select" id="po-supplier">${supOpts}</select></div>
      <div class="mb-2"><label class="form-label">Order Date</label><input type="date" class="form-control" id="po-date" value="${today}"></div>
      <hr><h6>Items</h6>
      <div id="po-items"><div class="row g-1 mb-1 po-item">
        <div class="col-5"><select class="form-select form-select-sm po-product">${prodOpts}</select></div>
        <div class="col-3"><input type="number" class="form-control form-select-sm po-qty" placeholder="Qty" value="1" min="1"></div>
        <div class="col-3"><input type="number" step="0.01" class="form-control form-select-sm po-price" placeholder="Price" value="0"></div>
        <div class="col-1"><button class="btn btn-sm btn-outline-danger remove-po-item">×</button></div>
      </div></div>
      <button class="btn btn-sm btn-outline-secondary mt-1" id="add-po-item">+ Add Item</button>`;
    showModal({
      title: 'New Purchase Order',
      body,
      onConfirm: async () => {
        const supplier_id = parseInt(document.getElementById('po-supplier').value);
        const order_date = document.getElementById('po-date').value;
        if (!supplier_id) throw new Error('Select a supplier');
        if (!order_date) throw new Error('Select a date');
        const itemEls = document.querySelectorAll('.po-item');
        const items = [];
        itemEls.forEach(el => {
          const prod = parseInt(el.querySelector('.po-product').value);
          const qty = parseInt(el.querySelector('.po-qty').value) || 1;
          const price = parseFloat(el.querySelector('.po-price').value) || 0;
          if (prod) items.push({ product_id: prod, quantity: qty, unit_price: price });
        });
        if (items.length === 0) throw new Error('Add at least one item');
        await API.post('/api/purchase-orders', { supplier_id, order_date, items });
        renderPurchaseOrders(container);
      }
    });
    document.getElementById('add-po-item').addEventListener('click', () => {
      const items = document.getElementById('po-items');
      const first = items.querySelector('.po-item');
      const clone = first.cloneNode(true);
      clone.querySelectorAll('input').forEach(i => { if (i.type === 'number' && i.value === '1') i.value = '1'; else if (i.type === 'number') i.value = '0'; });
      items.appendChild(clone);
      clone.querySelector('.remove-po-item').addEventListener('click', () => clone.remove());
    });
    document.querySelectorAll('.remove-po-item').forEach(btn => btn.addEventListener('click', function() {
      if (document.querySelectorAll('.po-item').length > 1) this.closest('.po-item').remove();
    }));
    document.querySelectorAll('.po-product').forEach(sel => sel.addEventListener('change', function() {
      this.closest('.po-item').querySelector('.po-price').value = this.options[this.selectedIndex].dataset.price || '0';
    }));
  }

  async function viewPO(row) {
    const po = await API.get(`/api/purchase-orders/${row.id}`);
    const itemsHtml = po.items.map(i => `<tr><td>${i.product_name}</td><td>${i.quantity}</td><td>$${Number(i.unit_price).toFixed(2)}</td><td>$${(i.quantity * i.unit_price).toFixed(2)}</td></tr>`).join('');
    const body = `
      <p><strong>Supplier:</strong> ${po.supplier_name}<br><strong>Date:</strong> ${po.order_date}<br><strong>Status:</strong> <span class="badge bg-${po.status === 'received' ? 'success' : po.status === 'pending' ? 'warning' : 'secondary'}">${po.status}</span><br><strong>Total:</strong> $${Number(po.total_amount).toFixed(2)}</p>
      <table class="table table-sm"><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>${itemsHtml}</tbody></table>`;
    showModal({ title: `Purchase Order #${po.id}`, body, confirmText: 'Close', onConfirm: async () => {} });
  }

  async function receivePO(id) {
    if (!confirm('Mark this purchase order as received? This will update stock quantities.')) return;
    await API.post(`/api/purchase-orders/${id}/receive`);
    renderPurchaseOrders(container);
  }

  async function deletePO(id) {
    if (!confirm('Delete this purchase order?')) return;
    await API.del(`/api/purchase-orders/${id}`);
    renderPurchaseOrders(container);
  }
}
