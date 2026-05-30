// ============================================================
// API SERVICE LAYER — connects to Java backend
// Base URL: http://localhost:8080
// To switch back to mock data, replace fetch() calls with
// the mock functions from mockData.js
// ============================================================

const BASE_URL = "http://localhost:8080/api";

// Stored player ID across calls (set after login)
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

async function del(path) {
  const res = await fetch(`${BASE_URL}${path}`, { method: "DELETE" });
  return res.json();
}

// ─── PLAYER ──────────────────────────────────────────────────

export const createPlayer = async (nickname) => {
  const player = await post("/players", { nickname });
  setPlayerId(player.playerId);
  // Backend doesn't return customers on create — generate empty list
  return { ...player, customers: [], activeTasks: [], gameOver: false };
};

// ─── SHOP ────────────────────────────────────────────────────

export const getShops = async () => get("/shops");

export const upgradeShop = async (player, newShopName) => {
  const updated = await put(`/players/${player.playerId}/shop`, { shopName: newShopName });
  return { ...updated, customers: [], activeTasks: [], gameOver: false };
};

// ─── DAY ADVANCE ─────────────────────────────────────────────

export const advanceDay = async (player) => {
  const result = await post(`/players/${player.playerId}/nextday`, {});
  // result = { player, customers, gameOver }
  return { ...result.player, customers: result.customers || [], activeTasks: [], gameOver: result.gameOver };
};

// ─── RESOURCES ───────────────────────────────────────────────

export const startGathering = async (player, resourceName) => {
  const updated = await post(`/players/${player.playerId}/gather`, { resourceName });
  return { ...updated, customers: player.customers || [], activeTasks: [], gameOver: false };
};

// completeGathering is now a no-op (gathering is instant — handled by startGathering)
export const completeGathering = async (player, _task) => player;

// ─── CRAFTING ────────────────────────────────────────────────

export const startCrafting = async (player, itemId) => {
  const updated = await post(`/players/${player.playerId}/craft`, { itemId: String(itemId) });
  if (updated.error) return { ...player, error: updated.error };
  return { ...updated, customers: player.customers || [], activeTasks: [], gameOver: false };
};

export const completeCrafting = async (player, _task) => player;

// ─── REPAIRING ───────────────────────────────────────────────

export const startRepair = async (player, item, fromInventory) => {
  const inventoryId = fromInventory === "player"
    ? player.playerInventory?.inventoryId ?? 1
    : player.shopInventory?.inventoryId ?? 2;

  const result = await post(`/players/${player.playerId}/repair`, {
    itemId:      String(item.item_id ?? item.itemId),
    inventoryId: String(inventoryId),
    condition:   String(item.condition),
  });

  if (result.error) return { ...player, error: result.error };
  return { ...result, customers: player.customers || [], activeTasks: [], gameOver: false };
};

export const completeRepair = async (player, _task) => player;

// ─── TRADE ───────────────────────────────────────────────────

export const processTransaction = async (player, item, price, direction) => {
  const inventoryId = direction === "sell"
    ? (player.shopInventory?.inventoryId ?? 2)
    : (player.playerInventory?.inventoryId ?? 1);

  const result = await post(`/players/${player.playerId}/trade`, {
    direction,
    itemId:       String(item.item_id ?? item.itemId),
    inventoryId:  String(inventoryId),
    price:        String(price),
    condition:    String(item.condition),
    customerName: item.customerName ?? "",
  });

  if (result.error) return { ...player, error: result.error };
  return { ...result, customers: player.customers || [], activeTasks: [], gameOver: false };
};

// ─── INVENTORY MOVE ──────────────────────────────────────────

export const moveItemInventory = async (player, item, fromInventory) => {
  const fromId = fromInventory === "player" ? 1 : 2;
  const toId   = fromInventory === "player" ? 2 : 1;

  const result = await post(`/players/${player.playerId}/move`, {
    itemId:        String(item.item_id ?? item.itemId),
    fromInventoryId: String(fromId),
    toInventoryId:   String(toId),
    condition:     String(item.condition),
    isReplica:     String(item.is_replica ?? item.isReplica ?? false),
    rarity:        item.rarity ?? "common",
  });

  return { ...result, customers: player.customers || [], activeTasks: [], gameOver: false };
};

// ─── RENT ────────────────────────────────────────────────────

export const payRent = async (player) => {
  // Rent is handled inside advanceDay on the backend
  return player;
};

// ─── PRICE CALCULATION ───────────────────────────────────────
// Kept on frontend — pure function, no DB needed

import { BRANDED_ITEMS, SPECIAL_EDITION_ITEMS, SIGNED_ITEMS, ITEM_RELATIONS } from '../data/mockData';

export const calcItemPrice = (item, itemInfo) => {
  const relation = ITEM_RELATIONS.find(r => r.item_id === (item.item_id ?? item.itemId));
  if (!relation) return 0;
  let price = relation.base_price;
  price *= (itemInfo.condition / 100);
  if (itemInfo.is_replica || itemInfo.isReplica) price *= 0.6;
  const branded = BRANDED_ITEMS.find(b => b.item_id === (item.item_id ?? item.itemId));
  if (branded) price *= branded.brand_multiplier;
  const special = SPECIAL_EDITION_ITEMS.find(s => s.item_id === (item.item_id ?? item.itemId));
  if (special) price *= special.s_edition_multiplier;
  const signed = SIGNED_ITEMS.find(s => s.item_id === (item.item_id ?? item.itemId));
  if (signed) price *= signed.celeb_multiplier;
  return Math.round(price);
};
