-- rename products.description -> short_description, add long_description
ALTER TABLE products RENAME COLUMN description TO short_description;
ALTER TABLE products ADD COLUMN long_description TEXT;
