// ============================================================
// MOCK DATA — Replace with API calls to Java/MySQL backend
// All functions mirror the DB queries described in the design doc
// ============================================================

export const SHOPS = [
  { shop_name: "Basic Shop",          attraction_rate: 5.00,  rent: 1000.00, recognition: 3 },
  { shop_name: "Advance Shop",        attraction_rate: 8.50,  rent: 2500.00, recognition: 7 },
  { shop_name: "Shop of the Legends", attraction_rate: 3.00,  rent: 5000.00, recognition: 10 },
];

export const RESOURCE_TYPES = [
  { resource_name: "Craft Resource Lv.1",  gather_exp: 10, resource_level: 1, gather_time: 30  },
  { resource_name: "Craft Resource Lv.2",  gather_exp: 25, resource_level: 2, gather_time: 60  },
  { resource_name: "Craft Resource Lv.3",  gather_exp: 50, resource_level: 3, gather_time: 120 },
  { resource_name: "Repair Resource Lv.1", gather_exp: 10, resource_level: 1, gather_time: 30  },
  { resource_name: "Repair Resource Lv.2", gather_exp: 25, resource_level: 2, gather_time: 60  },
  { resource_name: "Repair Resource Lv.3", gather_exp: 50, resource_level: 3, gather_time: 120 },
];

export const ITEM_RELATIONS = [
  { item_id: 1, item_name: "Sport Shoes",    craft_ingredient: "Craft Resource Lv.1",  craft_time: 60,  repair_ingredient: "Repair Resource Lv.1", repair_time: 120, base_price: 100 },
  { item_id: 2, item_name: "Leather Boots",  craft_ingredient: "Craft Resource Lv.2",  craft_time: 120, repair_ingredient: "Repair Resource Lv.2", repair_time: 240, base_price: 200 },
  { item_id: 3, item_name: "Stylist Shoes",  craft_ingredient: "Craft Resource Lv.3",  craft_time: 300, repair_ingredient: "Repair Resource Lv.3", repair_time: 600, base_price: 350 },
  { item_id: 4, item_name: "Slipper",        craft_ingredient: "Craft Resource Lv.1",  craft_time: 90,  repair_ingredient: "Repair Resource Lv.1", repair_time: 60,  base_price: 50  },
  { item_id: 5, item_name: "High Heels",     craft_ingredient: "Craft Resource Lv.2",  craft_time: 180, repair_ingredient: "Repair Resource Lv.2", repair_time: 120, base_price: 250 },
];

export const BRANDED_ITEMS = [
  { item_id: 1, brand_multiplier: 2.00, brand_name: "Nixe"       },
  { item_id: 2, brand_multiplier: 5.00, brand_name: "Balenciaga"  },
];

export const SPECIAL_EDITION_ITEMS = [
  { item_id: 3, s_edition_multiplier: 3.00, s_edition_name: "Judgement Day Special" },
  { item_id: 4, s_edition_multiplier: 6.00, s_edition_name: "World Cup 2006"        },
];

export const SIGNED_ITEMS = [
  { item_id: 2, celeb_multiplier: 4.00,  celeb_name: "Orkun Kökçü"  },
  { item_id: 3, celeb_multiplier: 10.00, celeb_name: "Lionel Messi"  },
];

export const CUSTOMER_NAMES = [
  "Mahmud","Bülent","Ali","Emre","Berke","Ahmet","Zeynep","Selin",
  "Kemal","Tarık","Fatma","Hasan","Murat","Gökhan","Deniz","Caner",
];

export const INITIAL_SKILLS = [
  { skill_name: "Craft Gathering",  skill_level: 1, type: "gathering", rarity_modifier: 0,   exp: 0, exp_needed: 100 },
  { skill_name: "Repair Gathering", skill_level: 1, type: "gathering", rarity_modifier: 0,   exp: 0, exp_needed: 100 },
  { skill_name: "Item Crafting",    skill_level: 1, type: "crafting",  quality_modifier: 0,  exp: 0, exp_needed: 100 },
  { skill_name: "Item Repair",      skill_level: 1, type: "crafting",  quality_modifier: 0,  exp: 0, exp_needed: 100 },
];

export const INITIAL_STATS = [
  { stat_name: "intelligence", stat_level: 1 },
  { stat_name: "charisma",     stat_level: 1 },
];

// Derived calculations (mirrors backend formulas)
export const calcTimeModifier  = (level) => (5.0 / 100) * level;
export const calcEffectAmount  = (level) => (5.0 / 100) * level;
export const calcQualityMod    = (level) => Math.min(50 + level * 0.5, 100);
export const calcRarityMod     = (level) => Math.min(level * 3, 100);

export const calcItemPrice = (item, itemInfo) => {
  const relation = ITEM_RELATIONS.find(r => r.item_id === item.item_id);
  if (!relation) return 0;
  let price = relation.base_price;

  // condition modifier
  price *= (itemInfo.condition / 100);

  // replica reduction
  if (itemInfo.is_replica) price *= 0.6;

  // brand multiplier
  const branded = BRANDED_ITEMS.find(b => b.item_id === item.item_id);
  if (branded) price *= branded.brand_multiplier;

  // special edition multiplier
  const special = SPECIAL_EDITION_ITEMS.find(s => s.item_id === item.item_id);
  if (special) price *= special.s_edition_multiplier;

  // signed multiplier
  const signed = SIGNED_ITEMS.find(s => s.item_id === item.item_id);
  if (signed) price *= signed.celeb_multiplier;

  return Math.round(price);
};

export const generateCustomer = (shopRecognition) => {
  const name = CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)];
  // Higher recognition → greedier, less patient customers
  const greed    = Math.min(10, Math.floor(Math.random() * 6) + shopRecognition);
  const patience = Math.max(1,  Math.floor(Math.random() * 8) - Math.floor(shopRecognition / 3));
  const wantsToBuy = Math.random() > 0.4; // 60% buy, 40% sell
  const itemRelation = ITEM_RELATIONS[Math.floor(Math.random() * ITEM_RELATIONS.length)];
  const condition = Math.floor(Math.random() * 60) + 20; // 20-80

  return {
    customer_name: name,
    patience,
    greed,
    wantsToBuy,
    offeredItem: {
      item_id: itemRelation.item_id,
      item_name: itemRelation.item_name,
      condition,
      is_replica: false,
      rarity: "common",
    },
    currentOffer: null,
    mood: "neutral", // neutral, happy, angry
  };
};
