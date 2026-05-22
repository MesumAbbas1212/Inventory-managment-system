async function renderSales(container) {
  const [sales, products] = await Promise.all([
    API.get('/api/sales'),
    API.get('/api/products')
  ]);
  container.innerHTML = '<div class="d-flex justify-content-between align-items-center mb-3"><h4 class="mb-0">Sales</h4><button class="btn btn-primary" id="btn-new-sale">+ New Sale</button></div><div id="sales-table"></div>';

  const cols = [
    { label: 'Sale #', key: 'id' },
    { label: 'Date', key: 'sale_date' },
    { label: 'Total', key: 'total_amount', render: v => `$${Number(v).toFixed(2)}` }
  ];
  const actions = [
    { label: 'View', class: 'btn-outline-info btn-sm', onClick: row => viewSale(row.id) }
  ];
  document.getElementById('sales-table').appendChild(createTable({ columns: cols, data: sales, actions }));
  document.getElementById('btn-new-sale').addEventListener('click', () => newSale());

  async function viewSale(id) {
    const sale = await API.get(`/api/sales/${id}`);
    const itemsHtml = sale.items.map(i => `<tr><td>${i.product_name}</td><td>${i.quantity}</td><td>$${Number(i.unit_price).toFixed(2)}</td><td>$${(i.quantity * i.unit_price).toFixed(2)}</td></tr>`).join('');
    const body = `
      <p><strong>Date:</strong> ${sale.sale_date}<br><strong>Total:</strong> $${Number(sale.total_amount).toFixed(2)}</p>
      <table class="table table-sm"><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>${itemsHtml}</tbody></table>`;
    showModal({ title: `Sale #${sale.id}`, body, confirmText: 'Close', onConfirm: async () => {} });
  }

  function newSale() {
    const today = new Date().toISOString().split('T')[0];
    const prodOpts = products.map(p => {
      const disabled = p.stock_quantity <= 0 ? 'disabled' : '';
      return `<option value="${p.id}" data-price="${p.unit_price}" data-stock="${p.stock_quantity}" ${disabled}>${p.name} (Stock: ${p.stock_quantity})</option>`;
    }).join('');
    let body = `
      <div class="mb-2"><label class="form-label">Sale Date</label><input type="date" class="form-control" id="sale-date" value="${today}"></div>
      <hr><h6>Items</h6>
      <div id="sale-items"><div class="row g-1 mb-1 sale-item">
        <div class="col-5"><select class="form-select form-select-sm sale-product">${prodOpts}</select></div>
        <div class="col-3"><input type="number" class="form-control form-select-sm sale-qty" placeholder="Qty" value="1" min="1"></div>
        <div class="col-3"><input type="number" step="0.01" class="form-control form-select-sm sale-price" placeholder="Price" value="0"></div>
        <div class="col-1"><button class="btn btn-sm btn-outline-danger remove-sale-item">×</button></div>
      </div></div>
      <button class="btn btn-sm btn-outline-secondary mt-1" id="add-sale-item">+ Add Item</button>
      <hr><h5 class="text-end">Total: $<span id="sale-total">0.00</span></h5>`;
    showModal({
      title: 'New Sale',
      body,
      onConfirm: async () => {
        const sale_date = document.getElementById('sale-date').value;
        if (!sale_date) throw new Error('Select a date');
        const itemEls = document.querySelectorAll('.sale-item');
        const items = [];
        itemEls.forEach(el => {
          const prod = parseInt(el.querySelector('.sale-product').value);
          const qty = parseInt(el.querySelector('.sale-qty').value) || 1;
          const price = parseFloat(el.querySelector('.sale-price').value) || 0;
          if (prod) items.push({ product_id: prod, quantity: qty, unit_price: price });
        });
        if (items.length === 0) throw new Error('Add at least one item');
        await API.post('/api/sales', { sale_date, items });
        renderSales(container);
      }
    });
    document.getElementById('add-sale-item').addEventListener('click', () => {
      const items = document.getElementById('sale-items');
      const first = items.querySelector('.sale-item');
      const clone = first.cloneNode(true);
      clone.querySelectorAll('input').forEach(i => { if (i.type === 'number') i.value = i.classList.contains('sale-qty') ? '1' : '0'; });
      items.appendChild(clone);
      clone.querySelector('.remove-sale-item').addEventListener('click', () => clone.remove());
      clone.querySelector('.sale-product').addEventListener('change', updateSalePrice);
      clone.querySelectorAll('input').forEach(i => i.addEventListener('input', updateSaleTotal));
    });
    document.querySelectorAll('.remove-sale-item').forEach(btn => btn.addEventListener('click', function() {
      if (document.querySelectorAll('.sale-item').length > 1) { this.closest('.sale-item').remove(); updateSaleTotal(); }
    }));
    document.querySelectorAll('.sale-product').forEach(sel => {
      sel.addEventListener('change', updateSalePrice);
    });
    document.querySelectorAll('input').forEach(i => i.addEventListener('input', updateSaleTotal));
    updateSaleTotal();

    function updateSalePrice() {
      const items = document.querySelectorAll('.sale-item');
      items.forEach(el => {
        const sel = el.querySelector('.sale-product');
        const priceInput = el.querySelector('.sale-price');
        if (sel.options[sel.selectedIndex]) {
          priceInput.value = sel.options[sel.selectedIndex].dataset.price || '0';
        }
      });
      updateSaleTotal();
    }

    function updateSaleTotal() {
      let total = 0;
      document.querySelectorAll('.sale-item').forEach(el => {
        const qty = parseFloat(el.querySelector('.sale-qty').value) || 0;
        const price = parseFloat(el.querySelector('.sale-price').value) || 0;
        total += qty * price;
      });
      document.getElementById('sale-total').textContent = total.toFixed(2);
    }
  }
}
