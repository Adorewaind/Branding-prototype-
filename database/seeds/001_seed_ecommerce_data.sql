-- 001_seed_ecommerce_data.sql
-- Representative seed data for the e-commerce schema.
-- Run after database/migrations/001_create_ecommerce_schema.sql.

BEGIN;

WITH inserted_categories AS (
  INSERT INTO categories (id, parent_id, name, slug, description, display_order, is_active)
  VALUES
    ('10000000-0000-0000-0000-000000000001', NULL, 'Apparel', 'apparel', 'Clothing and wearable merchandise.', 10, TRUE),
    ('10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'T-Shirts', 't-shirts', 'Everyday short-sleeve shirts.', 11, TRUE),
    ('10000000-0000-0000-0000-000000000003', NULL, 'Accessories', 'accessories', 'Bags, drinkware, and lifestyle accessories.', 20, TRUE),
    ('10000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', 'Drinkware', 'drinkware', 'Reusable cups and bottles.', 21, TRUE)
  ON CONFLICT (id) DO NOTHING
  RETURNING id
)
SELECT COUNT(*) FROM inserted_categories;

WITH inserted_products AS (
  INSERT INTO products (id, category_id, name, slug, description, status, brand, base_price_cents, currency, is_featured, published_at)
  VALUES
    (
      '20000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000002',
      'Signature Logo Tee',
      'signature-logo-tee',
      'A soft cotton tee with the signature storefront logo printed on the chest.',
      'active',
      'Acme Commerce',
      2400,
      'USD',
      TRUE,
      NOW() - INTERVAL '14 days'
    ),
    (
      '20000000-0000-0000-0000-000000000002',
      '10000000-0000-0000-0000-000000000003',
      'Canvas Market Tote',
      'canvas-market-tote',
      'Durable organic canvas tote for daily errands and weekend shopping.',
      'active',
      'Acme Commerce',
      1800,
      'USD',
      FALSE,
      NOW() - INTERVAL '10 days'
    ),
    (
      '20000000-0000-0000-0000-000000000003',
      '10000000-0000-0000-0000-000000000004',
      'Insulated Travel Tumbler',
      'insulated-travel-tumbler',
      'Double-wall stainless steel tumbler that keeps drinks hot or cold.',
      'active',
      'Acme Commerce',
      3200,
      'USD',
      TRUE,
      NOW() - INTERVAL '7 days'
    )
  ON CONFLICT (id) DO NOTHING
  RETURNING id
)
SELECT COUNT(*) FROM inserted_products;

WITH inserted_variants AS (
  INSERT INTO product_variants (id, product_id, sku, name, option_values, price_cents, compare_at_price_cents, cost_cents, barcode, weight_grams, is_active)
  VALUES
    ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'TEE-BLK-S', 'Black / Small', '{"color":"Black","size":"S"}', 2400, 3000, 900, '850000000001', 180, TRUE),
    ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'TEE-BLK-M', 'Black / Medium', '{"color":"Black","size":"M"}', 2400, 3000, 900, '850000000002', 190, TRUE),
    ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'TEE-WHT-M', 'White / Medium', '{"color":"White","size":"M"}', 2400, 3000, 900, '850000000003', 190, TRUE),
    ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', 'TOTE-NAT-STD', 'Natural / Standard', '{"color":"Natural","size":"Standard"}', 1800, NULL, 650, '850000000004', 260, TRUE),
    ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000003', 'TUMBLER-BLUE-20OZ', 'Blue / 20 oz', '{"color":"Blue","capacity":"20 oz"}', 3200, 3800, 1400, '850000000005', 420, TRUE),
    ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000003', 'TUMBLER-BLACK-20OZ', 'Black / 20 oz', '{"color":"Black","capacity":"20 oz"}', 3200, 3800, 1400, '850000000006', 420, TRUE)
  ON CONFLICT (id) DO NOTHING
  RETURNING id
)
SELECT COUNT(*) FROM inserted_variants;

INSERT INTO inventory (id, variant_id, quantity_on_hand, quantity_reserved, reorder_threshold, restock_level, location_code)
VALUES
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 42, 3, 10, 75, 'MAIN'),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 64, 5, 10, 75, 'MAIN'),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 28, 2, 10, 75, 'MAIN'),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', 95, 4, 15, 120, 'MAIN'),
  ('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', 18, 1, 12, 60, 'MAIN'),
  ('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000006', 8, 0, 12, 60, 'MAIN')
ON CONFLICT (variant_id) DO NOTHING;

INSERT INTO customers (id, email, first_name, last_name, phone, marketing_opt_in, stripe_customer_id)
VALUES
  ('50000000-0000-0000-0000-000000000001', 'maya.chen@example.com', 'Maya', 'Chen', '+14155550101', TRUE, 'cus_seed_maya_chen'),
  ('50000000-0000-0000-0000-000000000002', 'jordan.rivera@example.com', 'Jordan', 'Rivera', '+14155550102', FALSE, 'cus_seed_jordan_rivera'),
  ('50000000-0000-0000-0000-000000000003', 'samira.patel@example.com', 'Samira', 'Patel', '+14155550103', TRUE, 'cus_seed_samira_patel')
ON CONFLICT (id) DO NOTHING;

INSERT INTO customer_addresses (id, customer_id, label, recipient_name, line1, line2, city, region, postal_code, country_code, is_default_shipping, is_default_billing)
VALUES
  ('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'Home', 'Maya Chen', '101 Market Street', 'Apt 8B', 'San Francisco', 'CA', '94105', 'US', TRUE, TRUE),
  ('60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', 'Home', 'Jordan Rivera', '225 River Road', NULL, 'Austin', 'TX', '78701', 'US', TRUE, TRUE),
  ('60000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000003', 'Home', 'Samira Patel', '77 Lakeside Avenue', 'Unit 12', 'Chicago', 'IL', '60601', 'US', TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO orders (
  id,
  order_number,
  customer_id,
  status,
  payment_status,
  currency,
  subtotal_cents,
  discount_cents,
  tax_cents,
  shipping_cents,
  total_cents,
  billing_address,
  shipping_address,
  placed_at,
  paid_at
)
VALUES
  (
    '70000000-0000-0000-0000-000000000001',
    'ACME-1001',
    '50000000-0000-0000-0000-000000000001',
    'delivered',
    'paid',
    'USD',
    5600,
    500,
    420,
    0,
    5520,
    '{"recipient_name":"Maya Chen","line1":"101 Market Street","line2":"Apt 8B","city":"San Francisco","region":"CA","postal_code":"94105","country_code":"US"}',
    '{"recipient_name":"Maya Chen","line1":"101 Market Street","line2":"Apt 8B","city":"San Francisco","region":"CA","postal_code":"94105","country_code":"US"}',
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '6 days'
  ),
  (
    '70000000-0000-0000-0000-000000000002',
    'ACME-1002',
    '50000000-0000-0000-0000-000000000002',
    'shipped',
    'paid',
    'USD',
    3600,
    0,
    297,
    599,
    4496,
    '{"recipient_name":"Jordan Rivera","line1":"225 River Road","city":"Austin","region":"TX","postal_code":"78701","country_code":"US"}',
    '{"recipient_name":"Jordan Rivera","line1":"225 River Road","city":"Austin","region":"TX","postal_code":"78701","country_code":"US"}',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  ),
  (
    '70000000-0000-0000-0000-000000000003',
    'ACME-1003',
    '50000000-0000-0000-0000-000000000003',
    'pending',
    'pending',
    'USD',
    3200,
    0,
    264,
    599,
    4063,
    '{"recipient_name":"Samira Patel","line1":"77 Lakeside Avenue","line2":"Unit 12","city":"Chicago","region":"IL","postal_code":"60601","country_code":"US"}',
    '{"recipient_name":"Samira Patel","line1":"77 Lakeside Avenue","line2":"Unit 12","city":"Chicago","region":"IL","postal_code":"60601","country_code":"US"}',
    NOW() - INTERVAL '1 hour',
    NULL
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (id, order_id, product_id, variant_id, sku, product_name, variant_name, quantity, unit_price_cents, discount_cents, tax_cents, line_total_cents)
VALUES
  ('80000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'TEE-BLK-M', 'Signature Logo Tee', 'Black / Medium', 1, 2400, 200, 181, 2381),
  ('80000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000005', 'TUMBLER-BLUE-20OZ', 'Insulated Travel Tumbler', 'Blue / 20 oz', 1, 3200, 300, 239, 3139),
  ('80000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000004', 'TOTE-NAT-STD', 'Canvas Market Tote', 'Natural / Standard', 2, 1800, 0, 297, 3897),
  ('80000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000006', 'TUMBLER-BLACK-20OZ', 'Insulated Travel Tumbler', 'Black / 20 oz', 1, 3200, 0, 264, 3464)
ON CONFLICT (id) DO NOTHING;

INSERT INTO payments (id, order_id, provider, provider_payment_id, status, amount_cents, currency, processed_at, metadata)
VALUES
  ('90000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 'stripe', 'pi_seed_1001', 'paid', 5520, 'USD', NOW() - INTERVAL '6 days', '{"card_brand":"visa","last4":"4242"}'),
  ('90000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000002', 'stripe', 'pi_seed_1002', 'paid', 4496, 'USD', NOW() - INTERVAL '2 days', '{"card_brand":"mastercard","last4":"4444"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO shipments (id, order_id, carrier, tracking_number, status, shipped_at, delivered_at)
VALUES
  ('a0000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 'UPS', '1ZSEED1001', 'delivered', NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days'),
  ('a0000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000002', 'USPS', '9400SEED1002', 'in_transit', NOW() - INTERVAL '1 day', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO reviews (id, product_id, customer_id, order_item_id, rating, title, body, is_verified_purchase, is_approved)
VALUES
  ('b0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', 5, 'Great everyday tee', 'The fabric is soft, the print looks sharp, and the medium fit was accurate.', TRUE, TRUE),
  ('b0000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000002', 4, 'Keeps coffee hot', 'The tumbler feels sturdy and kept my coffee warm for the whole commute.', TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

COMMIT;
