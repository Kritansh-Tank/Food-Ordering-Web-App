-- ============================================
-- Food Ordering App - Supabase Schema & Seed
-- ============================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'member')),
  country VARCHAR(50) NOT NULL CHECK (country IN ('India', 'America')),
  stripe_customer_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RESTAURANTS TABLE
-- ============================================
CREATE TABLE restaurants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  cuisine VARCHAR(100) NOT NULL,
  country VARCHAR(50) NOT NULL CHECK (country IN ('India', 'America')),
  description TEXT,
  image_url TEXT,
  rating DECIMAL(2,1) DEFAULT 4.0,
  delivery_time VARCHAR(50) DEFAULT '30-45 min',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MENU ITEMS TABLE
-- ============================================
CREATE TABLE menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(50),
  image_url TEXT,
  is_vegetarian BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'placed', 'cancelled')),
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  country VARCHAR(50) NOT NULL CHECK (country IN ('India', 'America')),
  stripe_payment_intent_id VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORDER ITEMS TABLE
-- ============================================
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PAYMENT METHODS TABLE
-- ============================================
CREATE TABLE payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_method_id VARCHAR(200) NOT NULL,
  card_last4 VARCHAR(4),
  card_brand VARCHAR(20),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_restaurants_country ON restaurants(country);
CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_country ON orders(country);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);

-- ============================================
-- SEED DATA: USERS
-- ============================================
INSERT INTO users (name, email, role, country) VALUES
  ('Nick Fury', 'nick.fury@shield.com', 'admin', 'America'),
  ('Captain Marvel', 'captain.marvel@shield.com', 'manager', 'India'),
  ('Captain America', 'captain.america@shield.com', 'manager', 'America'),
  ('Thanos', 'thanos@shield.com', 'member', 'India'),
  ('Thor', 'thor@shield.com', 'member', 'India'),
  ('Travis', 'travis@shield.com', 'member', 'America');

-- ============================================
-- SEED DATA: RESTAURANTS (India)
-- ============================================
INSERT INTO restaurants (name, cuisine, country, description, rating, delivery_time) VALUES
  ('Tandoori Nights', 'North Indian', 'India', 'Authentic North Indian cuisine with tandoori specialties and rich curries.', 4.5, '25-35 min'),
  ('Dosa Palace', 'South Indian', 'India', 'Classic South Indian breakfast and meals — crispy dosas, idlis, and vadas.', 4.3, '20-30 min'),
  ('Mumbai Street Eats', 'Street Food', 'India', 'The best of Mumbai street food — vada pav, pav bhaji, bhel puri and more.', 4.7, '15-25 min');

-- ============================================
-- SEED DATA: RESTAURANTS (America)
-- ============================================
INSERT INTO restaurants (name, cuisine, country, description, rating, delivery_time) VALUES
  ('Liberty Burgers', 'American', 'America', 'Gourmet burgers, crispy fries, and thick milkshakes — the American dream.', 4.4, '20-30 min'),
  ('NYC Pizza Co.', 'Italian-American', 'America', 'New York-style thin crust pizzas with classic and creative toppings.', 4.6, '25-35 min'),
  ('Tex-Mex Cantina', 'Mexican', 'America', 'Bold Tex-Mex flavors — burritos, tacos, nachos, and loaded quesadillas.', 4.2, '20-30 min');

-- ============================================
-- SEED DATA: MENU ITEMS (Tandoori Nights)
-- ============================================
INSERT INTO menu_items (restaurant_id, name, description, price, category, is_vegetarian)
SELECT r.id, items.name, items.description, items.price, items.category, items.is_veg
FROM restaurants r
CROSS JOIN (VALUES
  ('Butter Chicken', 'Tender chicken in creamy tomato-butter gravy', 320.00, 'Main Course', false),
  ('Paneer Tikka', 'Marinated cottage cheese grilled in tandoor', 280.00, 'Starters', true),
  ('Dal Makhani', 'Slow-cooked black lentils in creamy gravy', 220.00, 'Main Course', true),
  ('Garlic Naan', 'Soft tandoor-baked bread with garlic topping', 60.00, 'Breads', true),
  ('Chicken Biryani', 'Fragrant basmati rice layered with spiced chicken', 350.00, 'Rice', false)
) AS items(name, description, price, category, is_veg)
WHERE r.name = 'Tandoori Nights';

-- ============================================
-- SEED DATA: MENU ITEMS (Dosa Palace)
-- ============================================
INSERT INTO menu_items (restaurant_id, name, description, price, category, is_vegetarian)
SELECT r.id, items.name, items.description, items.price, items.category, items.is_veg
FROM restaurants r
CROSS JOIN (VALUES
  ('Masala Dosa', 'Crispy rice crepe filled with spiced potato', 150.00, 'Dosas', true),
  ('Idli Sambar', 'Steamed rice cakes served with lentil soup', 120.00, 'Breakfast', true),
  ('Medu Vada', 'Crispy fried lentil donuts with chutneys', 100.00, 'Snacks', true),
  ('Rava Upma', 'Semolina cooked with spices and vegetables', 110.00, 'Breakfast', true),
  ('Filter Coffee', 'Traditional South Indian filter coffee', 50.00, 'Beverages', true)
) AS items(name, description, price, category, is_veg)
WHERE r.name = 'Dosa Palace';

-- ============================================
-- SEED DATA: MENU ITEMS (Mumbai Street Eats)
-- ============================================
INSERT INTO menu_items (restaurant_id, name, description, price, category, is_vegetarian)
SELECT r.id, items.name, items.description, items.price, items.category, items.is_veg
FROM restaurants r
CROSS JOIN (VALUES
  ('Vada Pav', 'Spicy potato fritter in a soft bun with chutneys', 40.00, 'Snacks', true),
  ('Pav Bhaji', 'Spiced mashed vegetables served with buttered bread', 120.00, 'Main Course', true),
  ('Bhel Puri', 'Puffed rice salad with chutneys and sev', 80.00, 'Snacks', true),
  ('Misal Pav', 'Spicy sprouted moth beans curry with bread', 130.00, 'Main Course', true),
  ('Cutting Chai', 'Half-cup of strong spiced tea', 20.00, 'Beverages', true)
) AS items(name, description, price, category, is_veg)
WHERE r.name = 'Mumbai Street Eats';

-- ============================================
-- SEED DATA: MENU ITEMS (Liberty Burgers)
-- ============================================
INSERT INTO menu_items (restaurant_id, name, description, price, category, is_vegetarian)
SELECT r.id, items.name, items.description, items.price, items.category, items.is_veg
FROM restaurants r
CROSS JOIN (VALUES
  ('Classic Smash Burger', 'Double smashed beef patty with American cheese', 12.99, 'Burgers', false),
  ('Bacon BBQ Burger', 'Beef patty with crispy bacon and BBQ sauce', 14.99, 'Burgers', false),
  ('Loaded Fries', 'Crispy fries topped with cheese, bacon, and jalapeños', 8.99, 'Sides', false),
  ('Veggie Burger', 'Black bean patty with avocado and chipotle mayo', 11.99, 'Burgers', true),
  ('Chocolate Milkshake', 'Thick and creamy chocolate milkshake', 6.99, 'Beverages', true)
) AS items(name, description, price, category, is_veg)
WHERE r.name = 'Liberty Burgers';

-- ============================================
-- SEED DATA: MENU ITEMS (NYC Pizza Co.)
-- ============================================
INSERT INTO menu_items (restaurant_id, name, description, price, category, is_vegetarian)
SELECT r.id, items.name, items.description, items.price, items.category, items.is_veg
FROM restaurants r
CROSS JOIN (VALUES
  ('Margherita Pizza', 'Classic tomato sauce, mozzarella, and fresh basil', 13.99, 'Pizzas', true),
  ('Pepperoni Pizza', 'Loaded with pepperoni and mozzarella cheese', 15.99, 'Pizzas', false),
  ('Garlic Knots', 'Soft bread knots tossed in garlic butter and parmesan', 5.99, 'Sides', true),
  ('Buffalo Wings', 'Crispy chicken wings tossed in buffalo sauce', 10.99, 'Sides', false),
  ('Tiramisu', 'Classic Italian coffee-flavored layered dessert', 7.99, 'Desserts', true)
) AS items(name, description, price, category, is_veg)
WHERE r.name = 'NYC Pizza Co.';

-- ============================================
-- SEED DATA: MENU ITEMS (Tex-Mex Cantina)
-- ============================================
INSERT INTO menu_items (restaurant_id, name, description, price, category, is_vegetarian)
SELECT r.id, items.name, items.description, items.price, items.category, items.is_veg
FROM restaurants r
CROSS JOIN (VALUES
  ('Chicken Burrito', 'Flour tortilla stuffed with rice, beans, and grilled chicken', 11.99, 'Burritos', false),
  ('Beef Tacos (3pc)', 'Seasoned ground beef in corn tortillas with toppings', 9.99, 'Tacos', false),
  ('Loaded Nachos', 'Tortilla chips with cheese, jalapeños, and sour cream', 8.99, 'Starters', true),
  ('Churros', 'Fried dough sticks coated in cinnamon sugar', 5.99, 'Desserts', true),
  ('Horchata', 'Traditional Mexican rice drink with cinnamon', 3.99, 'Beverages', true)
) AS items(name, description, price, category, is_veg)
WHERE r.name = 'Tex-Mex Cantina';

-- ============================================
-- Enable Row Level Security (optional, for direct Supabase access)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Allow full access via service role (used by Nest.js backend)
CREATE POLICY "Service role full access" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON restaurants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON menu_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON payment_methods FOR ALL USING (true) WITH CHECK (true);
