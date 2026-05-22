const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---- Categories ----
app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, description } = req.body;
    const [result] = await pool.query('INSERT INTO categories (name, description) VALUES (?, ?)', [name, description || null]);
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    await pool.query('UPDATE categories SET name = ?, description = ? WHERE id = ?', [name, description || null, req.params.id]);
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    rows[0] ? res.json(rows[0]) : res.status(404).json({ error: 'Not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    result.affectedRows ? res.json({ success: true }) : res.status(404).json({ error: 'Not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Products ----
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.name'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products/low-stock', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.stock_quantity <= p.reorder_level ORDER BY p.stock_quantity ASC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [req.params.id]
    );
    rows[0] ? res.json(rows[0]) : res.status(404).json({ error: 'Not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, sku, category_id, unit_price, stock_quantity, reorder_level, description } = req.body;
    const [result] = await pool.query(
      'INSERT INTO products (name, sku, category_id, unit_price, stock_quantity, reorder_level, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, sku, category_id || null, unit_price || 0, stock_quantity || 0, reorder_level || 5, description || null]
    );
    const [rows] = await pool.query('SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, sku, category_id, unit_price, stock_quantity, reorder_level, description } = req.body;
    await pool.query(
      'UPDATE products SET name=?, sku=?, category_id=?, unit_price=?, stock_quantity=?, reorder_level=?, description=? WHERE id=?',
      [name, sku, category_id || null, unit_price || 0, stock_quantity || 0, reorder_level || 5, description || null, req.params.id]
    );
    const [rows] = await pool.query('SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [req.params.id]);
    rows[0] ? res.json(rows[0]) : res.status(404).json({ error: 'Not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    result.affectedRows ? res.json({ success: true }) : res.status(404).json({ error: 'Not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Suppliers ----
app.get('/api/suppliers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM suppliers ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/suppliers', async (req, res) => {
  try {
    const { name, contact_person, email, phone, address } = req.body;
    const [result] = await pool.query('INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES (?, ?, ?, ?, ?)',
      [name, contact_person || null, email || null, phone || null, address || null]);
    const [rows] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/suppliers/:id', async (req, res) => {
  try {
    const { name, contact_person, email, phone, address } = req.body;
    await pool.query('UPDATE suppliers SET name=?, contact_person=?, email=?, phone=?, address=? WHERE id=?',
      [name, contact_person || null, email || null, phone || null, address || null, req.params.id]);
    const [rows] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
    rows[0] ? res.json(rows[0]) : res.status(404).json({ error: 'Not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
    result.affectedRows ? res.json({ success: true }) : res.status(404).json({ error: 'Not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Purchase Orders ----
app.get('/api/purchase-orders', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT po.*, s.name AS supplier_name FROM purchase_orders po JOIN suppliers s ON po.supplier_id = s.id ORDER BY po.created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/purchase-orders/:id', async (req, res) => {
  try {
    const [po] = await pool.query(
      'SELECT po.*, s.name AS supplier_name FROM purchase_orders po JOIN suppliers s ON po.supplier_id = s.id WHERE po.id = ?', [req.params.id]
    );
    if (!po[0]) return res.status(404).json({ error: 'Not found' });
    const [items] = await pool.query(
      'SELECT poi.*, p.name AS product_name FROM purchase_order_items poi JOIN products p ON poi.product_id = p.id WHERE poi.purchase_order_id = ?', [req.params.id]
    );
    res.json({ ...po[0], items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/purchase-orders', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { supplier_id, order_date, items } = req.body;
    let total = 0;
    for (const item of items) {
      total += item.quantity * item.unit_price;
    }
    const [poResult] = await conn.query(
      'INSERT INTO purchase_orders (supplier_id, order_date, total_amount) VALUES (?, ?, ?)',
      [supplier_id, order_date, total]
    );
    for (const item of items) {
      await conn.query(
        'INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [poResult.insertId, item.product_id, item.quantity, item.unit_price]
      );
    }
    await conn.commit();
    const [rows] = await pool.query(
      'SELECT po.*, s.name AS supplier_name FROM purchase_orders po JOIN suppliers s ON po.supplier_id = s.id WHERE po.id = ?', [poResult.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

app.post('/api/purchase-orders/:id/receive', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [po] = await conn.query('SELECT * FROM purchase_orders WHERE id = ? AND status = ?', [req.params.id, 'pending']);
    if (!po[0]) {
      await conn.rollback();
      return res.status(400).json({ error: 'Order not found or already received' });
    }
    const [items] = await conn.query('SELECT * FROM purchase_order_items WHERE purchase_order_id = ?', [req.params.id]);
    for (const item of items) {
      await conn.query('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?', [item.quantity, item.product_id]);
      await conn.query(
        'INSERT INTO stock_movements (product_id, type, quantity, reference_type, reference_id, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [item.product_id, 'in', item.quantity, 'purchase', req.params.id, 'Purchase order received']
      );
    }
    await conn.query('UPDATE purchase_orders SET status = ? WHERE id = ?', ['received', req.params.id]);
    await conn.commit();
    const [rows] = await pool.query(
      'SELECT po.*, s.name AS supplier_name FROM purchase_orders po JOIN suppliers s ON po.supplier_id = s.id WHERE po.id = ?', [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

app.delete('/api/purchase-orders/:id', async (req, res) => {
  try {
    const [po] = await pool.query('SELECT status FROM purchase_orders WHERE id = ?', [req.params.id]);
    if (!po[0]) return res.status(404).json({ error: 'Not found' });
    if (po[0].status !== 'pending') return res.status(400).json({ error: 'Can only delete pending orders' });
    await pool.query('DELETE FROM purchase_orders WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Sales ----
app.get('/api/sales', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sales ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sales/:id', async (req, res) => {
  try {
    const [sale] = await pool.query('SELECT * FROM sales WHERE id = ?', [req.params.id]);
    if (!sale[0]) return res.status(404).json({ error: 'Not found' });
    const [items] = await pool.query(
      'SELECT si.*, p.name AS product_name FROM sale_items si JOIN products p ON si.product_id = p.id WHERE si.sale_id = ?', [req.params.id]
    );
    res.json({ ...sale[0], items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sales', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { sale_date, items } = req.body;
    let total = 0;
    for (const item of items) {
      total += item.quantity * item.unit_price;
    }
    const [saleResult] = await conn.query('INSERT INTO sales (sale_date, total_amount) VALUES (?, ?)', [sale_date, total]);
    for (const item of items) {
      await conn.query('INSERT INTO sale_items (sale_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [saleResult.insertId, item.product_id, item.quantity, item.unit_price]);
      await conn.query('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?', [item.quantity, item.product_id]);
      await conn.query(
        'INSERT INTO stock_movements (product_id, type, quantity, reference_type, reference_id, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [item.product_id, 'out', item.quantity, 'sale', saleResult.insertId, 'Sale completed']
      );
    }
    await conn.commit();
    const [rows] = await pool.query('SELECT * FROM sales WHERE id = ?', [saleResult.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// ---- Stock Movements ----
app.get('/api/stock-movements', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT sm.*, p.name AS product_name FROM stock_movements sm JOIN products p ON sm.product_id = p.id ORDER BY sm.created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Dashboard ----
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const [products] = await pool.query('SELECT COUNT(*) AS count FROM products');
    const [categories] = await pool.query('SELECT COUNT(*) AS count FROM categories');
    const [suppliers] = await pool.query('SELECT COUNT(*) AS count FROM suppliers');
    const [lowStock] = await pool.query('SELECT COUNT(*) AS count FROM products WHERE stock_quantity <= reorder_level');
    const [pendingPOs] = await pool.query("SELECT COUNT(*) AS count FROM purchase_orders WHERE status = 'pending'");
    const [recentSales] = await pool.query('SELECT COALESCE(SUM(total_amount), 0) AS total FROM sales WHERE sale_date >= CURDATE() - INTERVAL 7 DAY');
    const [recentSalesList] = await pool.query('SELECT * FROM sales ORDER BY created_at DESC LIMIT 5');
    const [lowStockProducts] = await pool.query(
      'SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.stock_quantity <= p.reorder_level ORDER BY p.stock_quantity ASC LIMIT 5'
    );
    res.json({
      total_products: products[0].count,
      total_categories: categories[0].count,
      total_suppliers: suppliers[0].count,
      low_stock_count: lowStock[0].count,
      pending_po_count: pendingPOs[0].count,
      recent_sales_total: recentSales[0].total,
      recent_sales: recentSalesList,
      low_stock_products: lowStockProducts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
