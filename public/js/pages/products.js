async function renderProducts(container) {
  const [products, categories] = await Promise.all([
    API.get('/api/products'),
    API.get('/api/categories')
  ]);
  container.innerHTML = '<div class="d-flex justify-content-between align-items-center mb-3"><h4 class="mb-0">Products</h4><div><button class="btn btn-warning btn-sm me-2" id="btn-low-stock">Low Stock</button><button class="btn btn-primary" id="btn-add-product">+ Add Product</button></div></div><div id="products-table"></div>';

  const cols = [
    { label: 'SKU', key: 'sku' },
    { label: 'Name', key: 'name' },
    { label: 'Category', key: 'category_name' },
    { label: 'Price', key: 'unit_price', render: v => `$${Number(v).toFixed(2)}` },
    { label: 'Stock', key: 'stock_quantity', render: (v, row) => {
      if (v <= row.reorder_level) return `<span class="low-stock">${v} <span class="badge-low-stock">Low</span></span>`;
      return v;
    }},
    { label: 'Reorder', key: 'reorder_level' }
  ];
  const actions = [
    { label: 'Edit', class: 'btn-outline-primary', onClick: row => editProduct(row) },
    { label: 'Delete', class: 'btn-outline-danger', onClick: row => deleteProduct(row.id) }
  ];
  document.getElementById('products-table').appendChild(createTable({ columns: cols, data: products, actions }));

  document.getElementById('btn-add-product').addEventListener('click', () => editProduct(null));
  document.getElementById('btn-low-stock').addEventListener('click', async () => {
    const lowStock = await API.get('/api/products/low-stock');
    const cols = [
      { label: 'SKU', key: 'sku' },
      { label: 'Name', key: 'name' },
      { label: 'Category', key: 'category_name' },
      { label: 'Stock', key: 'stock_quantity', render: v => `<span class="low-stock">${v}</span>` },
      { label: 'Reorder At', key: 'reorder_level' }
    ];
    showModal({
      title: 'Low Stock Products',
      body: '<div id="low-stock-modal-table"></div>',
      confirmText: 'Close',
      onConfirm: async () => {}
    });
    document.getElementById('low-stock-modal-table').appendChild(createTable({ columns: cols, data: lowStock }));
  });

  async function editProduct(row) {
    const isEdit = !!row;
    const catOpts = categories.map(c => `<option value="${c.id}" ${isEdit && row.category_id == c.id ? 'selected' : ''}>${c.name}</option>`).join('');
    const body = `
      <div class="mb-2"><label class="form-label">Name</label><input class="form-control" id="prod-name" value="${isEdit ? row.name : ''}"></div>
      <div class="mb-2"><label class="form-label">SKU</label><input class="form-control" id="prod-sku" value="${isEdit ? row.sku : ''}"></div>
      <div class="mb-2"><label class="form-label">Category</label><select class="form-select" id="prod-cat"><option value="">-- None --</option>${catOpts}</select></div>
      <div class="row mb-2">
        <div class="col"><label class="form-label">Price</label><input type="number" step="0.01" class="form-control" id="prod-price" value="${isEdit ? row.unit_price : '0'}"></div>
        <div class="col"><label class="form-label">Stock</label><input type="number" class="form-control" id="prod-stock" value="${isEdit ? row.stock_quantity : '0'}"></div>
        <div class="col"><label class="form-label">Reorder Level</label><input type="number" class="form-control" id="prod-reorder" value="${isEdit ? row.reorder_level : '5'}"></div>
      </div>
      <div class="mb-2"><label class="form-label">Description</label><textarea class="form-control" id="prod-desc" rows="2">${isEdit ? (row.description || '') : ''}</textarea></div>`;
    showModal({
      title: isEdit ? 'Edit Product' : 'Add Product',
      body,
      onConfirm: async () => {
        const name = document.getElementById('prod-name').value.trim();
        const sku = document.getElementById('prod-sku').value.trim();
        if (!name || !sku) throw new Error('Name and SKU are required');
        const payload = {
          name,
          sku,
          category_id: document.getElementById('prod-cat').value || null,
          unit_price: parseFloat(document.getElementById('prod-price').value) || 0,
          stock_quantity: parseInt(document.getElementById('prod-stock').value) || 0,
          reorder_level: parseInt(document.getElementById('prod-reorder').value) || 5,
          description: document.getElementById('prod-desc').value.trim() || null
        };
        if (isEdit) await API.put(`/api/products/${row.id}`, payload);
        else await API.post('/api/products', payload);
        renderProducts(container);
      }
    });
  }

  async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    await API.del(`/api/products/${id}`);
    renderProducts(container);
  }
}
