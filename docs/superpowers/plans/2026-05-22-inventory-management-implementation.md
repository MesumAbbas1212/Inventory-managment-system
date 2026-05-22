# Inventory Management System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete inventory management system with products, stock, purchase orders, and sales management.

**Architecture:** Node.js/Express REST API backend serving a vanilla JS single-page application. MariaDB for persistence. Bootstrap 5 for UI. All API calls use fetch() with JSON.

**Tech Stack:** Node.js 24, Express 4, mysql2, MariaDB 11.4, Bootstrap 5, vanilla JS

---

### Task 1: Project Scaffold and Database Setup

**Files:**
- Create: `D:\Projects\inventory-management\package.json`
- Create: `D:\Projects\inventory-management\db.js`
- Create: `D:\Projects\inventory-management\schema.sql`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "inventory-management",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "node server.js",
    "db:init": "mysql -u root < schema.sql"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.9.0",
    "cors": "^2.8.5"
  }
}
```

- [ ] **Step 2: Create db.js — database connection pool**

```js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '',
  database: 'inventory_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
```

- [ ] **Step 3: Create schema.sql**

Run: `mysql -u root -e "CREATE DATABASE IF NOT EXISTS inventory_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`

```sql
USE inventory_db;

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  sku VARCHAR(50) NOT NULL UNIQUE,
  category_id INT,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_quantity INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 5,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(50),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS purchase_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT NOT NULL,
  order_date DATE NOT NULL,
  status ENUM('pending','received','cancelled') DEFAULT 'pending',
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_date DATE NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS stock_movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  type ENUM('in','out') NOT NULL,
  quantity INT NOT NULL,
  reference_type VARCHAR(50) NOT NULL,
  reference_id INT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;
```

- [ ] **Step 4: Run the schema against the database**

Run: `& "D:\mysql\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS inventory_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`
Then run: `& "D:\mysql\mysql.exe" -u root inventory_db < "D:\Projects\inventory-management\schema.sql"`

- [ ] **Step 5: Install npm dependencies**

Run: `cd D:\Projects\inventory-management; npm install`

---

### Task 2: Express Server with All API Routes

**Files:**
- Create: `D:\Projects\inventory-management\server.js`

- [ ] **Step 1: Create server.js with all API endpoints**

```js
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
```

---

### Task 3: Frontend — Shell, Styles, Router, API Layer

**Files:**
- Create: `D:\Projects\inventory-management\public\index.html`
- Create: `D:\Projects\inventory-management\public\css\style.css`
- Create: `D:\Projects\inventory-management\public\js\api.js`
- Create: `D:\Projects\inventory-management\public\js\app.js`

- [ ] **Step 1: Create index.html — SPA shell with sidebar layout**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inventory Management System</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="css/style.css" rel="stylesheet">
</head>
<body>
  <div class="d-flex" id="wrapper">
    <div class="bg-dark text-white" id="sidebar">
      <div class="sidebar-heading fs-5 fw-bold py-3 px-3 border-bottom border-secondary">Inventory</div>
      <ul class="nav flex-column">
        <li class="nav-item"><a href="#" class="nav-link text-white-50" data-page="dashboard">Dashboard</a></li>
        <li class="nav-item"><a href="#" class="nav-link text-white-50" data-page="products">Products</a></li>
        <li class="nav-item"><a href="#" class="nav-link text-white-50" data-page="categories">Categories</a></li>
        <li class="nav-item"><a href="#" class="nav-link text-white-50" data-page="suppliers">Suppliers</a></li>
        <li class="nav-item"><a href="#" class="nav-link text-white-50" data-page="purchase-orders">Purchase Orders</a></li>
        <li class="nav-item"><a href="#" class="nav-link text-white-50" data-page="sales">Sales</a></li>
        <li class="nav-item"><a href="#" class="nav-link text-white-50" data-page="stock-movements">Stock Movements</a></li>
      </ul>
    </div>
    <div id="page-content-wrapper" class="w-100">
      <nav class="navbar navbar-expand-lg navbar-light bg-light border-bottom px-3">
        <button class="btn btn-sm btn-outline-secondary" id="menu-toggle">☰</button>
        <span class="ms-3 fw-bold" id="page-title">Dashboard</span>
      </nav>
      <div class="container-fluid p-4" id="content">
        <div class="text-center py-5"><div class="spinner-border" role="status"></div></div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
  <script src="js/api.js"></script>
  <script src="js/components/table.js"></script>
  <script src="js/pages/dashboard.js"></script>
  <script src="js/pages/categories.js"></script>
  <script src="js/pages/products.js"></script>
  <script src="js/pages/suppliers.js"></script>
  <script src="js/pages/purchase-orders.js"></script>
  <script src="js/pages/sales.js"></script>
  <script src="js/pages/stock-movements.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create style.css**

```css
#sidebar {
  min-width: 240px;
  min-height: 100vh;
}
#sidebar .nav-link {
  padding: 0.6rem 1rem;
  border-radius: 0;
  transition: background 0.2s;
}
#sidebar .nav-link:hover, #sidebar .nav-link.active {
  background: rgba(255,255,255,0.1);
  color: #fff !important;
}
#menu-toggle {
  cursor: pointer;
}
.card-dashboard {
  transition: transform 0.2s;
}
.card-dashboard:hover {
  transform: translateY(-2px);
}
.low-stock {
  color: #dc3545;
  font-weight: 600;
}
.badge-low-stock {
  background: #dc3545;
  color: #fff;
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 10px;
}
@media (max-width: 768px) {
  #sidebar {
    min-width: 100%;
    min-height: auto;
  }
  #sidebar.collapsed {
    display: none;
  }
}
```

- [ ] **Step 3: Create api.js — fetch wrapper**

```js
const API = {
  async get(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },
  async post(url, data) {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },
  async put(url, data) {
    const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },
  async del(url) {
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  }
};
```

- [ ] **Step 4: Create app.js — SPA router**

```js
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
```

---

### Task 4: Frontend — Table Component

- [ ] **Step 1: Create public/js/components/table.js**

```js
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
```

---

### Task 5: Frontend — Dashboard Page

- [ ] **Step 1: Create public/js/pages/dashboard.js**

```js
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
```

---

### Task 6: Frontend — Categories Page

- [ ] **Step 1: Create public/js/pages/categories.js**

```js
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
```

---

### Task 7: Frontend — Products Page

- [ ] **Step 1: Create public/js/pages/products.js**

```js
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
```

---

### Task 8: Frontend — Suppliers Page

- [ ] **Step 1: Create public/js/pages/suppliers.js**

```js
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
```

---

### Task 9: Frontend — Purchase Orders Page

- [ ] **Step 1: Create public/js/pages/purchase-orders.js**

```js
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
```

---

### Task 10: Frontend — Sales Page

- [ ] **Step 1: Create public/js/pages/sales.js**

```js
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
```

---

### Task 11: Frontend — Stock Movements Page

- [ ] **Step 1: Create public/js/pages/stock-movements.js**

```js
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
```

---

### Task 12: Initialize Database and Test

- [ ] **Step 1: Create the database**

Run: `& "D:\mysql\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS inventory_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`

- [ ] **Step 2: Import the schema**

Run: `& "D:\mysql\mysql.exe" -u root inventory_db < "D:\Projects\inventory-management\schema.sql"`

- [ ] **Step 3: Verify tables exist**

Run: `& "D:\mysql\mysql.exe" -u root -e "USE inventory_db; SHOW TABLES;"`

Expected output: categories, products, suppliers, purchase_orders, purchase_order_items, sales, sale_items, stock_movements

- [ ] **Step 4: Install npm dependencies**

Run: `cd D:\Projects\inventory-management; npm install`

- [ ] **Step 5: Start the server**

Run: `cd D:\Projects\inventory-management; node server.js`

Expected: `Server running at http://localhost:3000`

- [ ] **Step 6: Open browser and verify**

Open http://localhost:3000 and verify the dashboard loads. Create a category, add a product, create a purchase order, receive it, create a sale.
