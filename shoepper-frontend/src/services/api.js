// ============================================================
// API SERVICE LAYER — connects to Java backend
// Base URL: http://localhost:8080
// ============================================================

const BASE_URL = "http://localhost:8080/api";

let _playerId = null;
export const setPlayerId = (id) => { _playerId = id; };
export const getPlayerId = () => _playerId;

async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function put(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  return res.json();
}

// ─── NORMALIZERS ─────────────────────────────────────────────
// Backend sends camelCase; frontend expects snake_case for legacy fields.

function normalizeItem(i) {
  if (!i) return null;
  return {
    instance_id: i.instanceId,
    item_id: i.itemId,
    item_name: i.itemName,
    condition: i.condition,
    is_replica: i.replica,   // isReplica() → serializer strips "is" → "replica"
    rarity: i.rarity || 'common',
    amount: i.amount || 1,
    craft_ingredient: i.craftIngredient,
    repair_ingredient: i.repairIngredient,
    craft_time: i.craftTime,
    repair_time: i.repairTime,
    brand_name: i.brandName,
    brand_multiplier: i.brandMultiplier,
    s_edition_name: i.sEditionName,
    s_edition_multiplier: i.sEditionMultiplier,
    celeb_name: i.celebName,
    celeb_multiplier: i.celebMultiplier,
  };
}

function normalizeInventory(inv) {
  if (!inv) return { size: 20, items: [], resources: [] };
  return {
    inventoryId: inv.inventoryId,
    size: inv.size || 20,
    resources: (inv.resources || []).map(r => ({
      resource_name: r.resourceName,
      resource_level: r.resourceLevel || 1,
      amount: r.amount,
      gather_exp: r.gatherExp,
    })),
    items: (inv.items || []).map(normalizeItem),
  };
}

export function normalizeCustomer(c) {
  if (!c) return null;
  return {
    _id: c._id || Math.random().toString(36).slice(2),
    customer_name: c.customerName || c.customer_name,
    patience: c.patience,
    greed: c.greed,
    wantsToBuy: c.wantsToBuy,
    offeredItem: c.offeredItem ? normalizeItem(c.offeredItem) : c._offeredItem || null,
    mood: 'neutral',
    currentOffer: null,
  };
}

export function normalizePlayer(p) {
  if (!p || p.error) return p;
  return {
    playerId: p.playerId,
    nickname: p.nickname,
    budget: p.budget,
    day: p.day,
    week: p.week,
    daysUntilRent: p.daysUntilRent,
    shop: p.shop ? {
      shop_name: p.shop.shopName,
      attraction_rate: p.shop.attractionRate,
      rent: p.shop.rent,
      recognition: p.shop.recognition,
    } : null,
    stats: (p.stats || []).map(s => ({
      stat_name: s.statName,
      stat_level: s.statLevel,
      effect_amnt: s.effectAmnt,
      exp: s.exp,
      exp_needed: s.expNeeded,
    })),
    skills: (p.skills || []).map(s => ({
      skill_name: s.skillName,
      skill_level: s.skillLevel,
      exp: s.exp,
      exp_needed: s.expNeeded,
      type: s.type,
      rarity_modifier: s.rarityModifier,
      quality_modifier: s.qualityModifier,
    })),
    playerInventory: normalizeInventory(p.playerInventory),
    shopInventory: normalizeInventory(p.shopInventory),
  };
}

// ─── PLAYER ──────────────────────────────────────────────────

export const createPlayer = async (nickname) => {
  const raw = await post("/players", { nickname });
  if (raw.error) return raw;
  const player = normalizePlayer(raw);
  setPlayerId(player.playerId);
  return { ...player, customers: [], activeTasks: [], gameOver: false };
};

// ─── SHOP ────────────────────────────────────────────────────

export const getShops = async () => get("/shops");

export const upgradeShop = async (player, newShopName) => {
  const raw = await put(`/players/${player.playerId}/shop`, { shopName: newShopName });
  if (raw.error) return raw;
  return { ...normalizePlayer(raw), customers: [], activeTasks: [], gameOver: false };
};

// ─── DAY ADVANCE ─────────────────────────────────────────────

export const advanceDay = async (player) => {
  const result = await post(`/players/${player.playerId}/nextday`, {});
  // If the backend errored (or returned no player), keep the current player intact
  // instead of spreading `undefined` into a player with no budget/shop — that would
  // crash the StatusBar on the next render.
  if (result.error || !result.player) {
    return { ...player, error: result.error || 'Failed to advance day' };
  }
  const normalized = normalizePlayer(result.player);
  const customers = (result.customers || []).map(normalizeCustomer);
  return { ...normalized, customers, activeTasks: [], gameOver: result.gameOver };
};

// ─── RESOURCES ───────────────────────────────────────────────

export const startGathering = async (player, resourceName) => {
  const raw = await post(`/players/${player.playerId}/gather`, { resourceName });
  if (raw.error) return { ...player, error: raw.error };
  return { ...normalizePlayer(raw), customers: player.customers || [], activeTasks: [], gameOver: false };
};

export const completeGathering = async (player, _task) => player;

// ─── CRAFTING ────────────────────────────────────────────────

export const startCrafting = async (player, itemId) => {
  const raw = await post(`/players/${player.playerId}/craft`, { itemId: String(itemId) });
  if (raw.error) return { ...player, error: raw.error };
  return { ...normalizePlayer(raw), customers: player.customers || [], activeTasks: [], gameOver: false };
};

export const completeCrafting = async (player, _task) => player;

// ─── REPAIRING ───────────────────────────────────────────────

export const startRepair = async (player, item, fromInventory) => {
  const inventoryId = fromInventory === "player"
    ? player.playerInventory?.inventoryId ?? 1
    : player.shopInventory?.inventoryId ?? 2;

  const raw = await post(`/players/${player.playerId}/repair`, {
    itemId:      String(item.item_id),
    instanceId:  String(item.instance_id),
    inventoryId: String(inventoryId),
    condition:   String(item.condition),
  });

  if (raw.error) return { ...player, error: raw.error };
  return { ...normalizePlayer(raw), customers: player.customers || [], activeTasks: [], gameOver: false };
};

export const completeRepair = async (player, _task) => player;

// ─── INVENTORY MOVE ──────────────────────────────────────────

export const moveItemInventory = async (player, item, fromInventory) => {
  const toId = fromInventory === "player" ? 2 : 1;

  const raw = await post(`/players/${player.playerId}/move`, {
    instanceId:    String(item.instance_id),
    toInventoryId: String(toId),
  });

  if (raw.error) return { ...player, error: raw.error };
  return { ...normalizePlayer(raw), customers: player.customers || [], activeTasks: [], gameOver: false };
};

// ─── TRADE ───────────────────────────────────────────────────

export const processTransaction = async (player, item, price, direction) => {
  const inventoryId = direction === "sell"
    ? (player.shopInventory?.inventoryId ?? 2)
    : (player.playerInventory?.inventoryId ?? 1);

  const raw = await post(`/players/${player.playerId}/trade`, {
    direction,
    itemId:       String(item.item_id),
    instanceId:   String(item.instance_id ?? 0),
    inventoryId:  String(inventoryId),
    price:        String(price),
    condition:    String(item.condition),
    customerName: item.customerName ?? "",
  });

  if (raw.error) return { ...player, error: raw.error };
  return { ...normalizePlayer(raw), customers: player.customers || [], activeTasks: [], gameOver: false };
};

// ─── RENT ────────────────────────────────────────────────────

export const payRent = async (player) => player;

// ─── PRICE CALCULATION ───────────────────────────────────────

import { BRANDED_ITEMS, SPECIAL_EDITION_ITEMS, SIGNED_ITEMS, ITEM_RELATIONS } from '../data/mockData';

export const calcItemPrice = (item, itemInfo) => {
  const relation = ITEM_RELATIONS.find(r => r.item_id === (item.item_id ?? item.itemId));
  if (!relation) return 0;
  let price = relation.base_price;
  price *= ((itemInfo.condition ?? 100) / 100);
  if (itemInfo.is_replica || itemInfo.replica) price *= 0.6;
  const branded = BRANDED_ITEMS.find(b => b.item_id === (item.item_id ?? item.itemId));
  if (branded) price *= branded.brand_multiplier;
  const special = SPECIAL_EDITION_ITEMS.find(s => s.item_id === (item.item_id ?? item.itemId));
  if (special) price *= special.s_edition_multiplier;
  const signed = SIGNED_ITEMS.find(s => s.item_id === (item.item_id ?? item.itemId));
  if (signed) price *= signed.celeb_multiplier;
  return Math.round(price);
};
