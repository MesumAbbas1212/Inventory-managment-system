async function renderStockMovements(container) {
  const data = await API.get('/api/stock-movements');
  container.innerHTML = '<h4 class="mb-3">Stock Movements</h4><div id="movements-table"></div>';

  const cols = [
    { label: 'Date', key: 'created_at', render: v => new Date(v).toLocaleString() },
    { label: 'Product', key: 'product_name' },
    { label: 'Type', key: 'type', render: v => `<span class="badge bg-${v === 'in' ? 'success' : 'danger'}">${v.toUpperCase()}</span>` },
    { label: 'Quantity', key: 'quantity' },
    { label: 'Reference', key: 'reference_type', render: (v, row) => `${v} #${row.reference_id}` },
    { label: 'Notes', key: 'notes' }
  ];
  document.getElementById('movements-table').appendChild(createTable({ columns: cols, data }));
}
