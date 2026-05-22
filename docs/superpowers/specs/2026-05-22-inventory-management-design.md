# Inventory Management System — Design Spec

## Stack
- **Backend:** Node.js + Express.js
- **Database:** MariaDB 11.4 (MySQL-compatible)
- **Frontend:** Vanilla JavaScript + Bootstrap 5 (CDN)
- **Server:** Node.js HTTP server with REST API

## Database Schema

### categories
| Column      | Type         | Constraints       |
|-------------|--------------|-------------------|
| id          | INT          | PK, AUTO_INCREMENT|
| name        | VARCHAR(100) | NOT NULL, UNIQUE  |
| description | TEXT         | NULLABLE          |
| created_at  | TIMESTAMP    | DEFAULT NOW       |

### products
| Column         | Type         | Constraints              |
|----------------|--------------|--------------------------|
| id             | INT          | PK, AUTO_INCREMENT       |
| name           | VARCHAR(200) | NOT NULL                 |
| sku            | VARCHAR(50)  | NOT NULL, UNIQUE         |
| category_id    | INT          | FK → categories.id       |
| unit_price     | DECIMAL(10,2)| NOT NULL                 |
| stock_quantity | INT          | NOT NULL DEFAULT 0       |
| reorder_level  | INT          | NOT NULL DEFAULT 5       |
| description    | TEXT         | NULLABLE                 |
| created_at     | TIMESTAMP    | DEFAULT NOW              |

### suppliers
| Column         | Type         | Constraints        |
|----------------|--------------|--------------------|
| id             | INT          | PK, AUTO_INCREMENT |
| name           | VARCHAR(200) | NOT NULL           |
| contact_person | VARCHAR(100) | NULLABLE           |
| email          | VARCHAR(100) | NULLABLE           |
| phone          | VARCHAR(50)  | NULLABLE           |
| address        | TEXT         | NULLABLE           |
| created_at     | TIMESTAMP    | DEFAULT NOW        |

### purchase_orders
| Column       | Type          | Constraints                         |
|--------------|---------------|-------------------------------------|
| id           | INT           | PK, AUTO_INCREMENT                  |
| supplier_id  | INT           | FK → suppliers.id                   |
| order_date   | DATE          | NOT NULL                            |
| status       | ENUM('pending','received','cancelled') | DEFAULT 'pending' |
| total_amount | DECIMAL(12,2) | NOT NULL DEFAULT 0                  |
| created_at   | TIMESTAMP     | DEFAULT NOW                         |

### purchase_order_items
| Column            | Type          | Constraints                   |
|-------------------|---------------|-------------------------------|
| id                | INT           | PK, AUTO_INCREMENT            |
| purchase_order_id | INT           | FK → purchase_orders.id       |
| product_id        | INT           | FK → products.id              |
| quantity          | INT           | NOT NULL                      |
| unit_price        | DECIMAL(10,2) | NOT NULL                      |

### sales
| Column       | Type          | Constraints        |
|--------------|---------------|--------------------|
| id           | INT           | PK, AUTO_INCREMENT |
| sale_date    | DATE          | NOT NULL           |
| total_amount | DECIMAL(12,2) | NOT NULL DEFAULT 0 |
| created_at   | TIMESTAMP     | DEFAULT NOW        |

### sale_items
| Column      | Type          | Constraints        |
|-------------|---------------|--------------------|
| id          | INT           | PK, AUTO_INCREMENT |
| sale_id     | INT           | FK → sales.id      |
| product_id  | INT           | FK → products.id   |
| quantity    | INT           | NOT NULL           |
| unit_price  | DECIMAL(10,2) | NOT NULL           |

### stock_movements
| Column         | Type         | Constraints                          |
|----------------|--------------|--------------------------------------|
| id             | INT          | PK, AUTO_INCREMENT                   |
| product_id     | INT          | FK → products.id                     |
| type           | ENUM('in','out') | NOT NULL                          |
| quantity       | INT          | NOT NULL                             |
| reference_type | VARCHAR(50)  | NOT NULL ('purchase','sale')         |
| reference_id   | INT          | NOT NULL                             |
| notes          | TEXT         | NULLABLE                             |
| created_at     | TIMESTAMP    | DEFAULT NOW                          |

## API Endpoints

```
GET    /api/categories              — List all
POST   /api/categories              — Create
GET    /api/categories/:id          — Get one
PUT    /api/categories/:id          — Update
DELETE /api/categories/:id          — Delete

GET    /api/products                — List all (with category name)
POST   /api/products                — Create
GET    /api/products/:id            — Get one
PUT    /api/products/:id            — Update
DELETE /api/products/:id            — Delete
GET    /api/products/low-stock      — Low stock alerts

GET    /api/suppliers               — List all
POST   /api/suppliers               — Create
GET    /api/suppliers/:id           — Get one
PUT    /api/suppliers/:id           — Update
DELETE /api/suppliers/:id           — Delete

GET    /api/purchase-orders         — List all (with supplier name)
POST   /api/purchase-orders         — Create (with items)
GET    /api/purchase-orders/:id     — Get one (with items)
POST   /api/purchase-orders/:id/receive  — Mark received, update stock
DELETE /api/purchase-orders/:id     — Delete (if pending)

GET    /api/sales                   — List all
POST   /api/sales                   — Create (with items, deduct stock)
GET    /api/sales/:id               — Get one (with items)

GET    /api/stock-movements         — List all (with product name)

GET    /api/dashboard/stats         — Summary counts
```

## Frontend Pages

1. **Login** — Simple auth gate (hardcoded creds or basic setup)
2. **Dashboard** — Summary cards (total products, low stock count, recent sales, pending POs)
3. **Products** — CRUD table with search, category filter, low stock badge
4. **Categories** — CRUD table
5. **Suppliers** — CRUD table
6. **Purchase Orders** — List + Create form (select supplier, pick products, add line items) + Receive action
7. **Sales** — POS-style checkout (select products, cart, complete sale) + Sales history table
8. **Stock Movements** — Read-only log of all stock changes

## Layout

- Fixed sidebar navigation on left
- Top header bar with page title
- Main content area
- Responsive: sidebar collapses on mobile

## Data Flow

1. **Purchase Received:** POST /purchase-orders/:id/receive → update PO status, increase product stock, log stock_movements
2. **Sale Created:** POST /sales → create sale + items, decrease product stock, log stock_movements
3. **Dashboard:** GET /dashboard/stats → aggregate counts from products, sales, POs

## Files

```
D:\Projects\inventory-management\
├── server.js                 — Express server + API routes
├── db.js                     — MySQL connection pool
├── schema.sql                — Database schema
├── package.json
├── public\
│   ├── index.html            — SPA shell
│   ├── css\
│   │   └── style.css         — Custom styles
│   └── js\
│       ├── app.js            — Router, layout, navigation
│       ├── api.js            — fetch wrapper for API calls
│       ├── pages\
│       │   ├── dashboard.js
│       │   ├── products.js
│       │   ├── categories.js
│       │   ├── suppliers.js
│       │   ├── purchase-orders.js
│       │   ├── sales.js
│       │   └── stock-movements.js
│       └── components\
│           └── table.js      — Reusable table helpers
└── docs\
    └── superpowers\specs\
        └── 2026-05-22-inventory-management-design.md
```

## Error Handling

- All API routes return `{ error: "message" }` on failure
- Frontend catches fetch errors and shows Bootstrap alerts
- Stock operations are wrapped in transactions
