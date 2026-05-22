const pages = {
  dashboard: { title: 'Dashboard', render: renderDashboard },
  products: { title: 'Products', render: renderProducts },
  categories: { title: 'Categories', render: renderCategories },
  suppliers: { title: 'Suppliers', render: renderSuppliers },
  'purchase-orders': { title: 'Purchase Orders', render: renderPurchaseOrders },
  sales: { title: 'Sales', render: renderSales },
  'stock-movements': { title: 'Stock Movements', render: renderStockMovements },
};

let currentPage = 'dashboard';

function navigate(page) {
  currentPage = page;
  history.pushState(null, '', '#' + page);
  document.querySelectorAll('#sidebar .nav-link').forEach(l => l.classList.remove('active'));
  const link = document.querySelector(`#sidebar .nav-link[data-page="${page}"]`);
  if (link) link.classList.add('active');
  document.getElementById('page-title').textContent = pages[page].title;
  const content = document.getElementById('content');
  content.innerHTML = '<div class="text-center py-5"><div class="spinner-border" role="status"></div></div>';
  pages[page].render(content);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('menu-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
  });
  document.querySelectorAll('#sidebar .nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      navigate(link.dataset.page);
    });
  });
  const hash = location.hash.replace('#', '') || 'dashboard';
  navigate(pages[hash] ? hash : 'dashboard');
  window.addEventListener('popstate', () => {
    const hash = location.hash.replace('#', '') || 'dashboard';
    if (pages[hash]) navigate(hash);
  });
});
