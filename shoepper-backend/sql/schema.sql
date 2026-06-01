
CREATE DATABASE IF NOT EXISTS shoepper_simulator_db;
USE shoepper_simulator_db;

-- Player
CREATE TABLE IF NOT EXISTS Player (
    player_id   INT AUTO_INCREMENT PRIMARY KEY,
    nickname    VARCHAR(50) NOT NULL UNIQUE,
    budget      DECIMAL(10,2) NOT NULL DEFAULT 5000.00,
    INDEX idx_player_nickname (nickname)
);

-- PlayerStats
CREATE TABLE IF NOT EXISTS PlayerStats (
    player_id   INT NOT NULL,
    stat_name   VARCHAR(50) NOT NULL,
    stat_level  INT NOT NULL DEFAULT 1,
    effect_amnt DECIMAL(10,5) AS ((5.0 / 100) * stat_level) STORED,
    PRIMARY KEY (player_id, stat_name),
    FOREIGN KEY (player_id) REFERENCES Player(player_id) ON DELETE CASCADE,
    CHECK (stat_level BETWEEN 1 AND 100)
);

-- Skills
CREATE TABLE IF NOT EXISTS Skills (
    skill_name    VARCHAR(50) PRIMARY KEY,
    skill_level   INT NOT NULL DEFAULT 1,
    time_modifier DECIMAL(10,5) AS ((5.0 / 100) * skill_level) STORED,
    CHECK (skill_level BETWEEN 1 AND 100)
);

-- GatheringSkills
CREATE TABLE IF NOT EXISTS GatheringSkills (
    skill_name      VARCHAR(50) PRIMARY KEY,
    skill_level     INT NOT NULL DEFAULT 1,
    rarity_modifier DECIMAL(6,2) NOT NULL DEFAULT 0,
    FOREIGN KEY (skill_name) REFERENCES Skills(skill_name) ON DELETE CASCADE,
    CHECK (skill_level BETWEEN 1 AND 100)
);

-- CraftingSkills
CREATE TABLE IF NOT EXISTS CraftingSkills (
    skill_name       VARCHAR(100) PRIMARY KEY,
    skill_level      INT NOT NULL DEFAULT 1,
    quality_modifier DECIMAL(6,2) NOT NULL DEFAULT 0,
    FOREIGN KEY (skill_name) REFERENCES Skills(skill_name) ON DELETE CASCADE,
    CHECK (skill_level BETWEEN 1 AND 100)
);

-- PlayerHasSkills
CREATE TABLE IF NOT EXISTS PlayerHasSkills (
    player_id  INT NOT NULL,
    skill_name VARCHAR(50) NOT NULL,
    exp        INT NOT NULL DEFAULT 0,
    exp_needed INT NOT NULL DEFAULT 100,
    PRIMARY KEY (player_id, skill_name),
    FOREIGN KEY (player_id)  REFERENCES Player(player_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_name) REFERENCES Skills(skill_name) ON DELETE CASCADE
);

-- Shop
CREATE TABLE IF NOT EXISTS Shop (
    shop_name       VARCHAR(100) PRIMARY KEY,
    attraction_rate DECIMAL(5,2) NOT NULL,
    rent            DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    recognition     INT NOT NULL
);

-- PlayerOwnsShop
CREATE TABLE IF NOT EXISTS PlayerOwnsShop (
    player_id   INT NOT NULL,
    shop_name   VARCHAR(100) NOT NULL,
    day         INT NOT NULL DEFAULT 1,
    week        INT NOT NULL DEFAULT 1,
    days_until_rent INT NOT NULL DEFAULT 7,
    PRIMARY KEY (player_id),
    FOREIGN KEY (player_id)  REFERENCES Player(player_id) ON DELETE CASCADE,
    FOREIGN KEY (shop_name)  REFERENCES Shop(shop_name)
);

-- Customer
CREATE TABLE IF NOT EXISTS Customer (
    shop_name     VARCHAR(100) NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    patience      INT NOT NULL,
    greed         INT NOT NULL,
    PRIMARY KEY (shop_name, customer_name),
    FOREIGN KEY (shop_name) REFERENCES Shop(shop_name) ON DELETE CASCADE
);

-- Inventory
CREATE TABLE IF NOT EXISTS Inventory (
    inventory_id INT NOT NULL,
    player_id    INT NOT NULL,
    size         INT NOT NULL DEFAULT 20,
    PRIMARY KEY (player_id, inventory_id),
    FOREIGN KEY (player_id) REFERENCES Player(player_id) ON DELETE CASCADE,
    CHECK (size > 0)
);

-- PlayerInventory
CREATE TABLE IF NOT EXISTS PlayerInventory (
    inventory_id INT NOT NULL,
    player_id    INT NOT NULL,
    PRIMARY KEY (player_id, inventory_id),
    FOREIGN KEY (player_id, inventory_id) REFERENCES Inventory(player_id, inventory_id) ON DELETE CASCADE
);

-- ShopInventory
CREATE TABLE IF NOT EXISTS ShopInventory (
    inventory_id INT NOT NULL,
    player_id    INT NOT NULL,
    shop_name    VARCHAR(100) NOT NULL,
    PRIMARY KEY (player_id, inventory_id),
    FOREIGN KEY (player_id, inventory_id) REFERENCES Inventory(player_id, inventory_id) ON DELETE CASCADE,
    FOREIGN KEY (shop_name) REFERENCES Shop(shop_name)
);

-- ResourceType
CREATE TABLE IF NOT EXISTS ResourceType (
    resource_name  VARCHAR(50) PRIMARY KEY,
    gather_exp     INT NOT NULL,
    resource_level INT NOT NULL DEFAULT 1,
    gather_time    INT NOT NULL,
    CHECK (resource_level BETWEEN 1 AND 4)
);

-- ResourceInInventory
CREATE TABLE IF NOT EXISTS ResourceInInventory (
    player_id     INT NOT NULL,
    inventory_id  INT NOT NULL,
    resource_name VARCHAR(50) NOT NULL,
    amount        INT NOT NULL DEFAULT 0,
    PRIMARY KEY (player_id, inventory_id, resource_name),
    FOREIGN KEY (player_id, inventory_id) REFERENCES Inventory(player_id, inventory_id) ON DELETE CASCADE,
    FOREIGN KEY (resource_name) REFERENCES ResourceType(resource_name)
);

-- ItemRelation
CREATE TABLE IF NOT EXISTS ItemRelation (
    item_id          INT AUTO_INCREMENT PRIMARY KEY,
    item_name        VARCHAR(100) NOT NULL,
    craft_ingredient VARCHAR(200),
    craft_time       INT,
    repair_ingredient VARCHAR(200),
    repair_time      INT
);

-- ItemInfo
-- Each row is a single physical item instance, so the same item_id can appear
-- many times in one inventory with different conditions/rarities. The surrogate
-- instance_id key replaces the old (player_id, inventory_id, item_id) PK that
-- forced identical items to merge.
CREATE TABLE IF NOT EXISTS ItemInfo (
    instance_id  INT AUTO_INCREMENT PRIMARY KEY,
    item_id      INT NOT NULL,
    inventory_id INT NOT NULL,
    player_id    INT NOT NULL,
    amount       INT NOT NULL DEFAULT 1,
    `condition`  INT NOT NULL DEFAULT 100,
    is_replica   BOOLEAN NOT NULL DEFAULT FALSE,
    rarity       VARCHAR(50) NOT NULL DEFAULT 'common',
    FOREIGN KEY (item_id) REFERENCES ItemRelation(item_id),
    FOREIGN KEY (player_id, inventory_id) REFERENCES Inventory(player_id, inventory_id) ON DELETE CASCADE,
    INDEX idx_iteminfo_owner (player_id, inventory_id),
    INDEX idx_iteminfo_condition (`condition`),
    INDEX idx_iteminfo_rarity (rarity),
    CHECK (`condition` BETWEEN 0 AND 100)
);

-- BrandedItem
CREATE TABLE IF NOT EXISTS BrandedItem (
    item_id          INT PRIMARY KEY,
    brand_multiplier DECIMAL(5,2) NOT NULL,
    brand_name       VARCHAR(50) NOT NULL,
    FOREIGN KEY (item_id) REFERENCES ItemRelation(item_id)
);

-- SpecialEditionItem
CREATE TABLE IF NOT EXISTS SpecialEditionItem (
    item_id              INT PRIMARY KEY,
    s_edition_multiplier DECIMAL(5,2) NOT NULL,
    s_edition_name       VARCHAR(50) NOT NULL,
    FOREIGN KEY (item_id) REFERENCES ItemRelation(item_id)
);

-- SignedItem
CREATE TABLE IF NOT EXISTS SignedItem (
    item_id          INT PRIMARY KEY,
    celeb_multiplier DECIMAL(5,2) NOT NULL,
    celeb_name       VARCHAR(50) NOT NULL,
    FOREIGN KEY (item_id) REFERENCES ItemRelation(item_id)
);
