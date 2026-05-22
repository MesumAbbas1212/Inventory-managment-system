async function renderDashboard(container) {
  const data = await API.get('/api/dashboard/stats');
  container.innerHTML = `
    <div class="row g-3 mb-4">
      <div class="col-md-3"><div class="card card-dashboard border-primary"><div class="card-body text-center"><h5 class="card-title text-primary">${data.total_products}</h5><p class="card-text text-muted">Products</p></div></div></div>
      <div class="col-md-3"><div class="card card-dashboard border-success"><div class="card-body text-center"><h5 class="card-title text-success">${data.total_categories}</h5><p class="card-text text-muted">Categories</p></div></div></div>
      <div class="col-md-3"><div class="card card-dashboard border-info"><div class="card-body text-center"><h5 class="card-title text-info">${data.total_suppliers}</h5><p class="card-text text-muted">Suppliers</p></div></div></div>
      <div class="col-md-3"><div class="card card-dashboard border-warning"><div class="card-body text-center"><h5 class="card-title ${data.low_stock_count > 0 ? 'text-danger' : 'text-warning'}">${data.low_stock_count}</h5><p class="card-text text-muted">Low Stock Items</p></div></div></div>
    </div>
    <div class="row g-3 mb-4">
      <div class="col-md-3"><div class="card card-dashboard border-secondary"><div class="card-body text-center"><h5 class="card-title">${data.pending_po_count}</h5><p class="card-text text-muted">Pending POs</p></div></div></div>
      <div class="col-md-3"><div class="card card-dashboard border-success"><div class="card-body text-center"><h5 class="card-title text-success">$${Number(data.recent_sales_total).toFixed(2)}</h5><p class="card-text text-muted">Sales (7 days)</p></div></div></div>
    </div>
    <div class="row g-3">
      <div class="col-md-6">
        <div class="card"><div class="card-header fw-bold">Recent Sales</div><div class="card-body p-0" id="recent-sales-table"></div></div>
      </div>
      <div class="col-md-6">
        <div class="card"><div class="card-header fw-bold text-danger">Low Stock Products</div><div class="card-body p-0" id="low-stock-table"></div></div>
      </div>
    </div>`;

  const salesCols = [
    { label: 'Date', key: 'sale_date' },
    { label: 'Amount', key: 'total_amount', render: v => `$${Number(v).toFixed(2)}` }
  ];
  document.getElementById('recent-sales-table').appendChild(createTable({ columns: salesCols, data: data.recent_sales }));

  const stockCols = [
    { label: 'Product', key: 'name' },
    { label: 'Stock', key: 'stock_quantity', render: v => `<span class="low-stock">${v}</span>` },
    { label: 'Reorder At', key: 'reorder_level' }
  ];
  document.getElementById('low-stock-table').appendChild(createTable({ columns: stockCols, data: data.low_stock_products }));
}
