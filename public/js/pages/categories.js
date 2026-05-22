async function renderCategories(container) {
  const data = await API.get('/api/categories');
  container.innerHTML = '<div class="d-flex justify-content-between align-items-center mb-3"><h4 class="mb-0">Categories</h4><button class="btn btn-primary" id="btn-add-category">+ Add Category</button></div><div id="categories-table"></div>';

  const cols = [
    { label: 'ID', key: 'id' },
    { label: 'Name', key: 'name' },
    { label: 'Description', key: 'description' }
  ];
  const actions = [
    { label: 'Edit', class: 'btn-outline-primary', onClick: row => editCategory(row) },
    { label: 'Delete', class: 'btn-outline-danger', onClick: row => deleteCategory(row.id) }
  ];
  document.getElementById('categories-table').appendChild(createTable({ columns: cols, data, actions }));

  document.getElementById('btn-add-category').addEventListener('click', () => editCategory(null));

  async function editCategory(row) {
    const isEdit = !!row;
    const body = `
      <div class="mb-3"><label class="form-label">Name</label><input class="form-control" id="cat-name" value="${row ? row.name : ''}"></div>
      <div class="mb-3"><label class="form-label">Description</label><textarea class="form-control" id="cat-desc" rows="3">${row ? (row.description || '') : ''}</textarea></div>`;
    showModal({
      title: isEdit ? 'Edit Category' : 'Add Category',
      body,
      onConfirm: async () => {
        const name = document.getElementById('cat-name').value.trim();
        if (!name) throw new Error('Name is required');
        const description = document.getElementById('cat-desc').value.trim();
        if (isEdit) await API.put(`/api/categories/${row.id}`, { name, description });
        else await API.post('/api/categories', { name, description });
        renderCategories(container);
      }
    });
  }

  async function deleteCategory(id) {
    if (!confirm('Delete this category?')) return;
    await API.del(`/api/categories/${id}`);
    renderCategories(container);
  }
}
