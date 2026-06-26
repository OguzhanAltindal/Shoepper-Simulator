USE shoepper_simulator_db;

-- Shops
INSERT IGNORE INTO Shop (shop_name, attraction_rate, rent, recognition) VALUES
('Basic Shop',          5.00, 1000.00, 3),
('Advance Shop',        8.50, 2500.00, 7),
('Shop of the Legends', 3.00, 5000.00, 10);

-- Skills (shared pool)
INSERT IGNORE INTO Skills (skill_name, skill_level) VALUES
('Craft Gathering',  1),
('Repair Gathering', 1),
('Item Crafting',    1),
('Item Repair',      1);

INSERT IGNORE INTO GatheringSkills (skill_name, skill_level, rarity_modifier) VALUES
('Craft Gathering',  1, 0),
('Repair Gathering', 1, 0);

INSERT IGNORE INTO CraftingSkills (skill_name, skill_level, quality_modifier) VALUES
('Item Crafting', 1, 0),
('Item Repair',   1, 0);

-- Resource types
INSERT IGNORE INTO ResourceType (resource_name, gather_exp, resource_level, gather_time) VALUES
('Craft Resource Lv.1',  10, 1, 30),
('Craft Resource Lv.2',  25, 2, 60),
('Craft Resource Lv.3',  50, 3, 120),
('Repair Resource Lv.1', 10, 1, 30),
('Repair Resource Lv.2', 25, 2, 60),
('Repair Resource Lv.3', 50, 3, 120);

-- Item base types
INSERT IGNORE INTO ItemRelation (item_id, item_name, craft_ingredient, craft_time, repair_ingredient, repair_time) VALUES
(1, 'Sport Shoes',   'Craft Resource Lv.1', 60,  'Repair Resource Lv.1', 120),
(2, 'Leather Boots', 'Craft Resource Lv.2', 120, 'Repair Resource Lv.2', 240),
(3, 'Stylist Shoes', 'Craft Resource Lv.3', 300, 'Repair Resource Lv.3', 600),
(4, 'Slipper',       'Craft Resource Lv.1', 90,  'Repair Resource Lv.1', 60),
(5, 'High Heels',    'Craft Resource Lv.2', 180, 'Repair Resource Lv.2', 120);

-- Branded items
INSERT IGNORE INTO BrandedItem (item_id, brand_multiplier, brand_name) VALUES
(1, 2.00, 'Nixe'),
(2, 5.00, 'Balenciaga');

-- Special edition items
INSERT IGNORE INTO SpecialEditionItem (item_id, s_edition_multiplier, s_edition_name) VALUES
(3, 3.00, 'Judgement Day Special'),
(4, 6.00, 'World Cup 2006');

-- Signed items
INSERT IGNORE INTO SignedItem (item_id, celeb_multiplier, celeb_name) VALUES
(2, 4.00,  'Orkun Kökçü'),
(3, 10.00, 'Lionel Messi');
