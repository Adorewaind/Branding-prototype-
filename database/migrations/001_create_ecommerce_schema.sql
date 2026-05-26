-- 001_create_ecommerce_schema.sql
-- PostgreSQL schema for an e-commerce platform.
-- Designed to run on PostgreSQL 13+ and Supabase-compatible PostgreSQL.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

DO $$
BEGIN
  CREATE TYPE product_status AS ENUM ('draft', 'active', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'authorized', 'paid', 'failed', 'refunded', 'partially_refunded');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE shipment_status AS ENUM ('pending', 'label_created', 'in_transit', 'delivered', 'returned', 'lost');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT categories_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT categories_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT categories_not_self_parent CHECK (parent_id IS NULL OR parent_id <> id)
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  status product_status NOT NULL DEFAULT 'draft',
  brand TEXT,
  base_price_cents INTEGER NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT products_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT products_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT products_base_price_non_negative CHECK (base_price_cents >= 0),
  CONSTRAINT products_currency_uppercase CHECK (currency ~ '^[A-Z]{3}$'),
  CONSTRAINT products_published_when_active CHECK (status <> 'active' OR published_at IS NOT NULL)
);

CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  option_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  price_cents INTEGER NOT NULL,
  compare_at_price_cents INTEGER,
  cost_cents INTEGER,
  barcode TEXT UNIQUE,
  weight_grams INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT product_variants_sku_not_blank CHECK (btrim(sku) <> ''),
  CONSTRAINT product_variants_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT product_variants_price_non_negative CHECK (price_cents >= 0),
  CONSTRAINT product_variants_compare_price_non_negative CHECK (compare_at_price_cents IS NULL OR compare_at_price_cents >= 0),
  CONSTRAINT product_variants_cost_non_negative CHECK (cost_cents IS NULL OR cost_cents >= 0),
  CONSTRAINT product_variants_weight_non_negative CHECK (weight_grams IS NULL OR weight_grams >= 0),
  CONSTRAINT product_variants_compare_at_not_below_price CHECK (compare_at_price_cents IS NULL OR compare_at_price_cents >= price_cents)
);

CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL UNIQUE REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  quantity_reserved INTEGER NOT NULL DEFAULT 0,
  reorder_threshold INTEGER NOT NULL DEFAULT 0,
  restock_level INTEGER NOT NULL DEFAULT 0,
  location_code TEXT NOT NULL DEFAULT 'MAIN',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT inventory_quantity_on_hand_non_negative CHECK (quantity_on_hand >= 0),
  CONSTRAINT inventory_quantity_reserved_non_negative CHECK (quantity_reserved >= 0),
  CONSTRAINT inventory_reserved_not_above_on_hand CHECK (quantity_reserved <= quantity_on_hand),
  CONSTRAINT inventory_reorder_threshold_non_negative CHECK (reorder_threshold >= 0),
  CONSTRAINT inventory_restock_level_non_negative CHECK (restock_level >= 0),
  CONSTRAINT inventory_location_code_not_blank CHECK (btrim(location_code) <> '')
);

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT customers_email_basic_format CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  CONSTRAINT customers_first_name_not_blank CHECK (btrim(first_name) <> ''),
  CONSTRAINT customers_last_name_not_blank CHECK (btrim(last_name) <> '')
);

CREATE TABLE customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label TEXT,
  recipient_name TEXT NOT NULL,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  region TEXT,
  postal_code TEXT NOT NULL,
  country_code CHAR(2) NOT NULL,
  is_default_shipping BOOLEAN NOT NULL DEFAULT FALSE,
  is_default_billing BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT customer_addresses_recipient_not_blank CHECK (btrim(recipient_name) <> ''),
  CONSTRAINT customer_addresses_line1_not_blank CHECK (btrim(line1) <> ''),
  CONSTRAINT customer_addresses_city_not_blank CHECK (btrim(city) <> ''),
  CONSTRAINT customer_addresses_postal_code_not_blank CHECK (btrim(postal_code) <> ''),
  CONSTRAINT customer_addresses_country_code_uppercase CHECK (country_code ~ '^[A-Z]{2}$')
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  status order_status NOT NULL DEFAULT 'pending',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  shipping_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  billing_address JSONB NOT NULL,
  shipping_address JSONB NOT NULL,
  placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT orders_order_number_not_blank CHECK (btrim(order_number) <> ''),
  CONSTRAINT orders_currency_uppercase CHECK (currency ~ '^[A-Z]{3}$'),
  CONSTRAINT orders_amounts_non_negative CHECK (
    subtotal_cents >= 0 AND discount_cents >= 0 AND tax_cents >= 0 AND shipping_cents >= 0 AND total_cents >= 0
  ),
  CONSTRAINT orders_total_matches_components CHECK (total_cents = subtotal_cents - discount_cents + tax_cents + shipping_cents),
  CONSTRAINT orders_discount_not_above_subtotal CHECK (discount_cents <= subtotal_cents),
  CONSTRAINT orders_paid_timestamp_when_paid CHECK (payment_status NOT IN ('paid', 'refunded', 'partially_refunded') OR paid_at IS NOT NULL),
  CONSTRAINT orders_cancelled_timestamp_when_cancelled CHECK (status <> 'cancelled' OR cancelled_at IS NOT NULL)
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  variant_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  line_total_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT order_items_sku_not_blank CHECK (btrim(sku) <> ''),
  CONSTRAINT order_items_names_not_blank CHECK (btrim(product_name) <> '' AND btrim(variant_name) <> ''),
  CONSTRAINT order_items_quantity_positive CHECK (quantity > 0),
  CONSTRAINT order_items_amounts_non_negative CHECK (unit_price_cents >= 0 AND discount_cents >= 0 AND tax_cents >= 0 AND line_total_cents >= 0),
  CONSTRAINT order_items_line_total_matches_components CHECK (line_total_cents = quantity * unit_price_cents - discount_cents + tax_cents),
  CONSTRAINT order_items_discount_not_above_line_subtotal CHECK (discount_cents <= quantity * unit_price_cents)
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_payment_id TEXT UNIQUE,
  status payment_status NOT NULL DEFAULT 'pending',
  amount_cents INTEGER NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  processed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT payments_provider_not_blank CHECK (btrim(provider) <> ''),
  CONSTRAINT payments_amount_positive CHECK (amount_cents > 0),
  CONSTRAINT payments_currency_uppercase CHECK (currency ~ '^[A-Z]{3}$')
);

CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  carrier TEXT,
  tracking_number TEXT UNIQUE,
  status shipment_status NOT NULL DEFAULT 'pending',
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT shipments_tracking_not_blank CHECK (tracking_number IS NULL OR btrim(tracking_number) <> ''),
  CONSTRAINT shipments_delivered_after_shipped CHECK (delivered_at IS NULL OR shipped_at IS NULL OR delivered_at >= shipped_at)
);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  order_item_id UUID UNIQUE REFERENCES order_items(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL,
  title TEXT,
  body TEXT,
  is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reviews_rating_between_1_and_5 CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT reviews_title_not_blank CHECK (title IS NULL OR btrim(title) <> ''),
  CONSTRAINT reviews_body_not_blank CHECK (body IS NULL OR btrim(body) <> ''),
  CONSTRAINT reviews_unique_customer_product UNIQUE (product_id, customer_id)
);

CREATE TRIGGER categories_set_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER products_set_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER product_variants_set_updated_at
BEFORE UPDATE ON product_variants
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER inventory_set_updated_at
BEFORE UPDATE ON inventory
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER customers_set_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER customer_addresses_set_updated_at
BEFORE UPDATE ON customer_addresses
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER orders_set_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER payments_set_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER shipments_set_updated_at
BEFORE UPDATE ON shipments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER reviews_set_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_active_display ON categories(is_active, display_order, name);

CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_status_published_at ON products(status, published_at DESC);
CREATE INDEX idx_products_featured_active ON products(is_featured, published_at DESC) WHERE status = 'active';
CREATE INDEX idx_products_name_trgm_fallback ON products USING btree (lower(name));

CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_active_product ON product_variants(product_id, is_active);
CREATE INDEX idx_product_variants_options_gin ON product_variants USING GIN (option_values);

CREATE INDEX idx_inventory_variant_id ON inventory(variant_id);
CREATE INDEX idx_inventory_low_stock ON inventory(location_code, quantity_on_hand, reorder_threshold)
  WHERE quantity_on_hand <= reorder_threshold;

CREATE INDEX idx_customer_addresses_customer_id ON customer_addresses(customer_id);
CREATE UNIQUE INDEX idx_customer_addresses_one_default_shipping
  ON customer_addresses(customer_id)
  WHERE is_default_shipping;
CREATE UNIQUE INDEX idx_customer_addresses_one_default_billing
  ON customer_addresses(customer_id)
  WHERE is_default_billing;

CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status_placed_at ON orders(status, placed_at DESC);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_placed_at ON orders(placed_at DESC);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_items_variant_id ON order_items(variant_id);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);

CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_shipments_status ON shipments(status);

CREATE INDEX idx_reviews_product_approved_created ON reviews(product_id, is_approved, created_at DESC);
CREATE INDEX idx_reviews_customer_id ON reviews(customer_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

COMMIT;
