const pool = require('./db');

async function seed() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ============================================================
    // 1. Clear existing data (reverse FK order)
    // ============================================================
    console.log('Clearing existing data...');
    await conn.execute('DELETE FROM stock_movements');
    await conn.execute('DELETE FROM sale_items');
    await conn.execute('DELETE FROM sales');
    await conn.execute('DELETE FROM purchase_order_items');
    await conn.execute('DELETE FROM purchase_orders');
    await conn.execute('DELETE FROM products');
    await conn.execute('DELETE FROM suppliers');
    await conn.execute('DELETE FROM categories');

    // Reset auto-increment counters
    await conn.execute('ALTER TABLE categories AUTO_INCREMENT = 1');
    await conn.execute('ALTER TABLE products AUTO_INCREMENT = 1');
    await conn.execute('ALTER TABLE suppliers AUTO_INCREMENT = 1');
    await conn.execute('ALTER TABLE purchase_orders AUTO_INCREMENT = 1');
    await conn.execute('ALTER TABLE purchase_order_items AUTO_INCREMENT = 1');
    await conn.execute('ALTER TABLE sales AUTO_INCREMENT = 1');
    await conn.execute('ALTER TABLE sale_items AUTO_INCREMENT = 1');
    await conn.execute('ALTER TABLE stock_movements AUTO_INCREMENT = 1');

    // ============================================================
    // 2. Insert categories
    // ============================================================
    console.log('Inserting categories...');
    const categoryData = [
      ['Electronics', 'Electronic devices and accessories'],
      ['Clothing', 'Apparel and fashion items'],
      ['Food & Beverages', 'Food products and beverages'],
      ['Office Supplies', 'Stationery and office equipment'],
      ['Books', 'Printed and digital publications'],
      ['Furniture', 'Office and home furniture'],
      ['Sports & Outdoors', 'Sports equipment and outdoor recreation gear'],
      ['Health & Beauty', 'Health, wellness and personal care products']
    ];
    await conn.query('INSERT INTO categories (name, description) VALUES ?', [categoryData]);

    const [catRows] = await conn.execute('SELECT id, name FROM categories');
    const catMap = {};
    for (const row of catRows) {
      catMap[row.name] = row.id;
    }

    // ============================================================
    // 3. Insert suppliers
    // ============================================================
    console.log('Inserting suppliers...');
    const supplierData = [
      ['TechWorld Distributors', 'Robert Chen', 'robert.chen@techworld.com', '1-555-0101', '123 Innovation Drive, Suite 200, San Jose, CA 95112'],
      ['StyleCraft Apparel', 'Maria Lopez', 'maria.lopez@stylecraft.com', '1-555-0102', '456 Fashion Avenue, New York, NY 10018'],
      ['FreshSource Foods', 'James Wilson', 'james.wilson@freshsource.com', '1-555-0103', '789 Harvest Lane, Chicago, IL 60607'],
      ['OfficePro Supplies', 'Sarah Thompson', 'sarah.thompson@officepro.com', '1-555-0104', '321 Business Park Blvd, Dallas, TX 75201'],
      ['BookWorm Publishers', 'David Kim', 'david.kim@bookwormpub.com', '1-555-0105', '654 Literary Circle, Boston, MA 02110']
    ];
    await conn.query('INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES ?', [supplierData]);

    const [supRows] = await conn.execute('SELECT id, name FROM suppliers');
    const supMap = {};
    for (const row of supRows) {
      supMap[row.name] = row.id;
    }

    // ============================================================
    // 4. Insert products
    // ============================================================
    console.log('Inserting products...');
    const products = [
      { name: 'Wireless Bluetooth Headphones', sku: 'ELEC-001', cat: 'Electronics', price: 79.99, stock: 0, reorder: 10, desc: 'Premium over-ear wireless headphones with active noise cancellation and 30-hour battery life' },
      { name: 'USB-C Hub 7-in-1', sku: 'ELEC-002', cat: 'Electronics', price: 34.99, stock: 100, reorder: 20, desc: 'Compact 7-port USB-C hub with HDMI, USB 3.0, SD card reader and power delivery' },
      { name: 'Portable Power Bank 10000mAh', sku: 'ELEC-003', cat: 'Electronics', price: 24.99, stock: 0, reorder: 15, desc: 'High-capacity portable charger with dual USB output and LED indicator' },
      { name: 'Mechanical Keyboard RGB', sku: 'ELEC-004', cat: 'Electronics', price: 89.99, stock: 8, reorder: 10, desc: 'Full-size mechanical keyboard with customizable RGB backlighting and blue switches' },
      { name: 'Webcam 1080p', sku: 'ELEC-005', cat: 'Electronics', price: 49.99, stock: 30, reorder: 10, desc: 'Full HD 1080p webcam with built-in microphone and auto-focus' },
      { name: 'Cotton T-Shirt (Pack of 3)', sku: 'CLTH-001', cat: 'Clothing', price: 29.99, stock: 200, reorder: 50, desc: 'Soft cotton crew-neck t-shirts available in assorted colors, pack of 3' },
      { name: 'Denim Jacket', sku: 'CLTH-002', cat: 'Clothing', price: 69.99, stock: 15, reorder: 10, desc: 'Classic denim jacket with button front and chest pockets' },
      { name: 'Running Shoes', sku: 'CLTH-003', cat: 'Clothing', price: 119.99, stock: 3, reorder: 15, desc: 'Lightweight running shoes with cushioned sole and breathable mesh upper' },
      { name: 'Organic Green Tea (100 Bags)', sku: 'FOOD-001', cat: 'Food & Beverages', price: 12.99, stock: 80, reorder: 20, desc: 'Premium organic green tea, 100 individually wrapped tea bags' },
      { name: 'Dark Chocolate Almond Bar', sku: 'FOOD-002', cat: 'Food & Beverages', price: 3.99, stock: 0, reorder: 50, desc: 'Rich dark chocolate with whole almonds, 3.5 oz bar' },
      { name: 'Premium Ballpoint Pens (12-Pack)', sku: 'OFF-001', cat: 'Office Supplies', price: 8.99, stock: 500, reorder: 100, desc: 'Smooth-writing ballpoint pens with blue ink, medium point, pack of 12' },
      { name: 'A4 Copy Paper (5000 Sheets)', sku: 'OFF-002', cat: 'Office Supplies', price: 45.99, stock: 2, reorder: 10, desc: 'High-quality A4 copy paper, 80gsm, 5000 sheets per carton' },
      { name: 'Heavy Duty Stapler', sku: 'OFF-003', cat: 'Office Supplies', price: 14.99, stock: 45, reorder: 15, desc: 'Heavy-duty stapler with 100-sheet capacity, includes staple remover' },
      { name: 'JavaScript: The Good Parts', sku: 'BOOK-001', cat: 'Books', price: 29.99, stock: 25, reorder: 10, desc: 'A deep dive into the best features of JavaScript by Douglas Crockford' },
      { name: 'Clean Code', sku: 'BOOK-002', cat: 'Books', price: 39.99, stock: 12, reorder: 10, desc: 'A handbook of agile software craftsmanship by Robert C. Martin' },
      { name: 'The Great Gatsby', sku: 'BOOK-003', cat: 'Books', price: 11.99, stock: 60, reorder: 15, desc: "F. Scott Fitzgerald's classic American novel" },
      { name: 'Ergonomic Office Chair', sku: 'FURN-001', cat: 'Furniture', price: 349.99, stock: 5, reorder: 5, desc: 'Adjustable ergonomic office chair with lumbar support and breathable mesh back' },
      { name: 'Standing Desk Converter', sku: 'FURN-002', cat: 'Furniture', price: 199.99, stock: 7, reorder: 5, desc: 'Height-adjustable standing desk converter with dual monitor support' },
      { name: 'Premium Yoga Mat', sku: 'SPORT-001', cat: 'Sports & Outdoors', price: 24.99, stock: 40, reorder: 15, desc: 'Non-slip exercise yoga mat with carrying strap, 6mm thickness' },
      { name: 'Resistance Bands Set', sku: 'SPORT-002', cat: 'Sports & Outdoors', price: 19.99, stock: 0, reorder: 20, desc: 'Set of 5 resistance bands with different tension levels, includes door anchor' },
      { name: 'Vitamin C Serum', sku: 'HLTH-001', cat: 'Health & Beauty', price: 18.99, stock: 35, reorder: 10, desc: 'Vitamin C brightening facial serum with hyaluronic acid, 1 oz' },
      { name: 'Moisturizing Face Cream', sku: 'HLTH-002', cat: 'Health & Beauty', price: 14.99, stock: 4, reorder: 10, desc: 'Daily moisturizing face cream with SPF 15, suitable for all skin types' }
    ];

    const prodMap = {};
    for (const p of products) {
      const [result] = await conn.execute(
        'INSERT INTO products (name, sku, category_id, unit_price, stock_quantity, reorder_level, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [p.name, p.sku, catMap[p.cat], p.price, p.stock, p.reorder, p.desc]
      );
      prodMap[p.sku] = result.insertId;
    }

    // ============================================================
    // 5. Insert purchase orders with items and stock movements
    // ============================================================
    console.log('Inserting purchase orders...');

    // PO 1: Received - TechWorld Distributors
    const [po1] = await conn.execute(
      'INSERT INTO purchase_orders (supplier_id, order_date, status, total_amount) VALUES (?, ?, ?, ?)',
      [supMap['TechWorld Distributors'], '2026-05-01', 'received', 4450.00]
    );
    const po1Id = po1.insertId;

    const po1Items = [
      { sku: 'ELEC-001', qty: 50, price: 65.00 },
      { sku: 'ELEC-002', qty: 30, price: 25.00 },
      { sku: 'ELEC-003', qty: 25, price: 18.00 }
    ];
    for (const item of po1Items) {
      const productId = prodMap[item.sku];
      await conn.execute(
        'INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [po1Id, productId, item.qty, item.price]
      );
      await conn.execute(
        'INSERT INTO stock_movements (product_id, type, quantity, reference_type, reference_id, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [productId, 'in', item.qty, 'purchase', po1Id, `Received PO #${po1Id} from TechWorld Distributors`]
      );
      await conn.execute(
        'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
        [item.qty, productId]
      );
    }

    // PO 2: Cancelled - StyleCraft Apparel
    const [po2] = await conn.execute(
      'INSERT INTO purchase_orders (supplier_id, order_date, status, total_amount) VALUES (?, ?, ?, ?)',
      [supMap['StyleCraft Apparel'], '2026-05-10', 'cancelled', 3550.00]
    );
    const po2Id = po2.insertId;

    const po2Items = [
      { sku: 'CLTH-002', qty: 20, price: 50.00 },
      { sku: 'CLTH-003', qty: 30, price: 85.00 }
    ];
    for (const item of po2Items) {
      const productId = prodMap[item.sku];
      await conn.execute(
        'INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [po2Id, productId, item.qty, item.price]
      );
    }

    // PO 3: Pending - FreshSource Foods
    const [po3] = await conn.execute(
      'INSERT INTO purchase_orders (supplier_id, order_date, status, total_amount) VALUES (?, ?, ?, ?)',
      [supMap['FreshSource Foods'], '2026-05-20', 'pending', 1400.00]
    );
    const po3Id = po3.insertId;

    const po3Items = [
      { sku: 'FOOD-001', qty: 100, price: 9.00 },
      { sku: 'FOOD-002', qty: 200, price: 2.50 }
    ];
    for (const item of po3Items) {
      const productId = prodMap[item.sku];
      await conn.execute(
        'INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [po3Id, productId, item.qty, item.price]
      );
    }

    // ============================================================
    // 6. Insert sales with items and stock movements
    // ============================================================
    console.log('Inserting sales...');

    // Sale 1
    const [sale1] = await conn.execute(
      'INSERT INTO sales (sale_date, total_amount) VALUES (?, ?)',
      ['2026-05-05', 974.85]
    );
    const sale1Id = sale1.insertId;

    const sale1Items = [
      { sku: 'ELEC-001', qty: 10, price: 79.99 },
      { sku: 'ELEC-002', qty: 5, price: 34.99 }
    ];
    for (const item of sale1Items) {
      const productId = prodMap[item.sku];
      await conn.execute(
        'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [sale1Id, productId, item.qty, item.price]
      );
      await conn.execute(
        'INSERT INTO stock_movements (product_id, type, quantity, reference_type, reference_id, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [productId, 'out', item.qty, 'sale', sale1Id, `Sale #${sale1Id}`]
      );
      await conn.execute(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.qty, productId]
      );
    }

    // Sale 2
    const [sale2] = await conn.execute(
      'INSERT INTO sales (sale_date, total_amount) VALUES (?, ?)',
      ['2026-05-12', 819.95]
    );
    const sale2Id = sale2.insertId;

    const sale2Items = [
      { sku: 'ELEC-004', qty: 3, price: 89.99 },
      { sku: 'FURN-001', qty: 1, price: 349.99 },
      { sku: 'FURN-002', qty: 1, price: 199.99 }
    ];
    for (const item of sale2Items) {
      const productId = prodMap[item.sku];
      await conn.execute(
        'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [sale2Id, productId, item.qty, item.price]
      );
      await conn.execute(
        'INSERT INTO stock_movements (product_id, type, quantity, reference_type, reference_id, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [productId, 'out', item.qty, 'sale', sale2Id, `Sale #${sale2Id}`]
      );
      await conn.execute(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.qty, productId]
      );
    }

    // Sale 3
    const [sale3] = await conn.execute(
      'INSERT INTO sales (sale_date, total_amount) VALUES (?, ?)',
      ['2026-05-18', 1849.45]
    );
    const sale3Id = sale3.insertId;

    const sale3Items = [
      { sku: 'CLTH-001', qty: 50, price: 29.99 },
      { sku: 'CLTH-002', qty: 5, price: 69.99 }
    ];
    for (const item of sale3Items) {
      const productId = prodMap[item.sku];
      await conn.execute(
        'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [sale3Id, productId, item.qty, item.price]
      );
      await conn.execute(
        'INSERT INTO stock_movements (product_id, type, quantity, reference_type, reference_id, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [productId, 'out', item.qty, 'sale', sale3Id, `Sale #${sale3Id}`]
      );
      await conn.execute(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.qty, productId]
      );
    }

    // Sale 4
    const [sale4] = await conn.execute(
      'INSERT INTO sales (sale_date, total_amount) VALUES (?, ?)',
      ['2026-05-22', 624.73]
    );
    const sale4Id = sale4.insertId;

    const sale4Items = [
      { sku: 'CLTH-003', qty: 2, price: 119.99 },
      { sku: 'FOOD-001', qty: 20, price: 12.99 },
      { sku: 'SPORT-001', qty: 5, price: 24.99 }
    ];
    for (const item of sale4Items) {
      const productId = prodMap[item.sku];
      await conn.execute(
        'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [sale4Id, productId, item.qty, item.price]
      );
      await conn.execute(
        'INSERT INTO stock_movements (product_id, type, quantity, reference_type, reference_id, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [productId, 'out', item.qty, 'sale', sale4Id, `Sale #${sale4Id}`]
      );
      await conn.execute(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.qty, productId]
      );
    }

    await conn.commit();

    // ============================================================
    // Summary
    // ============================================================
    const [[{ count: catCount }]] = await pool.execute('SELECT COUNT(*) as count FROM categories');
    const [[{ count: prodCount }]] = await pool.execute('SELECT COUNT(*) as count FROM products');
    const [[{ count: supCount }]] = await pool.execute('SELECT COUNT(*) as count FROM suppliers');
    const [[{ count: poCount }]] = await pool.execute('SELECT COUNT(*) as count FROM purchase_orders');
    const [[{ count: poiCount }]] = await pool.execute('SELECT COUNT(*) as count FROM purchase_order_items');
    const [[{ count: saleCount }]] = await pool.execute('SELECT COUNT(*) as count FROM sales');
    const [[{ count: siCount }]] = await pool.execute('SELECT COUNT(*) as count FROM sale_items');
    const [[{ count: smCount }]] = await pool.execute('SELECT COUNT(*) as count FROM stock_movements');

    console.log('\n=== Seed Summary ===');
    console.log(`  Categories:        ${catCount}`);
    console.log(`  Products:          ${prodCount}`);
    console.log(`  Suppliers:         ${supCount}`);
    console.log(`  Purchase Orders:   ${poCount}`);
    console.log(`  PO Items:          ${poiCount}`);
    console.log(`  Sales:             ${saleCount}`);
    console.log(`  Sale Items:        ${siCount}`);
    console.log(`  Stock Movements:   ${smCount}`);
    console.log('====================\n');
    console.log('Seed completed successfully!');
  } catch (err) {
    await conn.rollback();
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    conn.release();
    await pool.end();
  }
}

seed();
