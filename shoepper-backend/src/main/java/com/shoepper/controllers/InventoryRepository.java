package com.shoepper.controllers;

import com.shoepper.db.Database;
import com.shoepper.models.ItemInfo;

import java.sql.*;

public class InventoryRepository {

    // ─── RESOURCES ───────────────────────────────────────────

    /** Adds amount to an existing resource or inserts a new row */
    public void addResource(int playerId, int inventoryId, String resourceName, int amount) throws SQLException {
        try (Connection conn = Database.getConnection()) {
            String check = "SELECT amount FROM ResourceInInventory WHERE player_id = ? AND inventory_id = ? AND resource_name = ?";
            try (PreparedStatement ps = conn.prepareStatement(check)) {
                ps.setInt(1, playerId); ps.setInt(2, inventoryId); ps.setString(3, resourceName);
                ResultSet rs = ps.executeQuery();
                if (rs.next()) {
                    // Update existing
                    try (PreparedStatement upd = conn.prepareStatement(
                        "UPDATE ResourceInInventory SET amount = amount + ? WHERE player_id = ? AND inventory_id = ? AND resource_name = ?")) {
                        upd.setInt(1, amount); upd.setInt(2, playerId);
                        upd.setInt(3, inventoryId); upd.setString(4, resourceName);
                        upd.executeUpdate();
                    }
                } else {
                    // Insert new
                    try (PreparedStatement ins = conn.prepareStatement(
                        "INSERT INTO ResourceInInventory (player_id, inventory_id, resource_name, amount) VALUES (?, ?, ?, ?)")) {
                        ins.setInt(1, playerId); ins.setInt(2, inventoryId);
                        ins.setString(3, resourceName); ins.setInt(4, amount);
                        ins.executeUpdate();
                    }
                }
            }
        }
    }

    /** Deducts resource; deletes row if amount reaches 0 */
    public boolean consumeResource(int playerId, int inventoryId, String resourceName, int amount) throws SQLException {
        try (Connection conn = Database.getConnection()) {
            String check = "SELECT amount FROM ResourceInInventory WHERE player_id = ? AND inventory_id = ? AND resource_name = ?";
            try (PreparedStatement ps = conn.prepareStatement(check)) {
                ps.setInt(1, playerId); ps.setInt(2, inventoryId); ps.setString(3, resourceName);
                ResultSet rs = ps.executeQuery();
                if (!rs.next() || rs.getInt("amount") < amount) return false;
                int remaining = rs.getInt("amount") - amount;
                if (remaining == 0) {
                    try (PreparedStatement del = conn.prepareStatement(
                        "DELETE FROM ResourceInInventory WHERE player_id = ? AND inventory_id = ? AND resource_name = ?")) {
                        del.setInt(1, playerId); del.setInt(2, inventoryId); del.setString(3, resourceName);
                        del.executeUpdate();
                    }
                } else {
                    try (PreparedStatement upd = conn.prepareStatement(
                        "UPDATE ResourceInInventory SET amount = ? WHERE player_id = ? AND inventory_id = ? AND resource_name = ?")) {
                        upd.setInt(1, remaining); upd.setInt(2, playerId);
                        upd.setInt(3, inventoryId); upd.setString(4, resourceName);
                        upd.executeUpdate();
                    }
                }
                return true;
            }
        }
    }

    /** Returns current slot count (distinct items + distinct resources) in an inventory */
    public int getSlotCount(int playerId, int inventoryId) throws SQLException {
        try (Connection conn = Database.getConnection()) {
            int count = 0;
            String res = "SELECT COUNT(*) FROM ResourceInInventory WHERE player_id = ? AND inventory_id = ?";
            try (PreparedStatement ps = conn.prepareStatement(res)) {
                ps.setInt(1, playerId); ps.setInt(2, inventoryId);
                ResultSet rs = ps.executeQuery();
                if (rs.next()) count += rs.getInt(1);
            }
            String item = "SELECT COUNT(*) FROM ItemInfo WHERE player_id = ? AND inventory_id = ?";
            try (PreparedStatement ps = conn.prepareStatement(item)) {
                ps.setInt(1, playerId); ps.setInt(2, inventoryId);
                ResultSet rs = ps.executeQuery();
                if (rs.next()) count += rs.getInt(1);
            }
            return count;
        }
    }

    public int getInventorySize(int playerId, int inventoryId) throws SQLException {
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(
                "SELECT size FROM Inventory WHERE player_id = ? AND inventory_id = ?")) {
            ps.setInt(1, playerId); ps.setInt(2, inventoryId);
            ResultSet rs = ps.executeQuery();
            return rs.next() ? rs.getInt("size") : 20;
        }
    }

    // ─── ITEMS ───────────────────────────────────────────────

    /** Inserts a new item into an inventory */
    public void addItem(int playerId, int inventoryId, int itemId, int condition,
                        boolean isReplica, String rarity) throws SQLException {
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(
                "INSERT INTO ItemInfo (item_id, inventory_id, player_id, amount, `condition`, is_replica, rarity) " +
                "VALUES (?, ?, ?, 1, ?, ?, ?)")) {
            ps.setInt(1, itemId); ps.setInt(2, inventoryId); ps.setInt(3, playerId);
            ps.setInt(4, condition); ps.setBoolean(5, isReplica); ps.setString(6, rarity);
            ps.executeUpdate();
        }
    }

    /** Removes an item from an inventory */
    public void removeItem(int playerId, int inventoryId, int itemId) throws SQLException {
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(
                "DELETE FROM ItemInfo WHERE player_id = ? AND inventory_id = ? AND item_id = ?")) {
            ps.setInt(1, playerId); ps.setInt(2, inventoryId); ps.setInt(3, itemId);
            ps.executeUpdate();
        }
    }

    /** Moves an item between inventories atomically */
    public void moveItem(int playerId, int fromInventoryId, int toInventoryId,
                         ItemInfo item) throws SQLException {
        try (Connection conn = Database.getConnection()) {
            conn.setAutoCommit(false);
            try {
                removeItemConn(conn, playerId, fromInventoryId, item.getItemId());
                addItemConn(conn, playerId, toInventoryId, item.getItemId(),
                           item.getCondition(), item.isReplica(), item.getRarity());
                conn.commit();
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            }
        }
    }

    /** Updates item condition (after repair) */
    public void updateItemCondition(int playerId, int inventoryId, int itemId, int newCondition) throws SQLException {
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(
                "UPDATE ItemInfo SET `condition` = ? WHERE player_id = ? AND inventory_id = ? AND item_id = ?")) {
            ps.setInt(1, newCondition); ps.setInt(2, playerId);
            ps.setInt(3, inventoryId); ps.setInt(4, itemId);
            ps.executeUpdate();
        }
    }

    private void removeItemConn(Connection conn, int playerId, int inventoryId, int itemId) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement(
            "DELETE FROM ItemInfo WHERE player_id = ? AND inventory_id = ? AND item_id = ?")) {
            ps.setInt(1, playerId); ps.setInt(2, inventoryId); ps.setInt(3, itemId);
            ps.executeUpdate();
        }
    }

    private void addItemConn(Connection conn, int playerId, int inventoryId, int itemId,
                             int condition, boolean isReplica, String rarity) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement(
            "INSERT INTO ItemInfo (item_id, inventory_id, player_id, amount, `condition`, is_replica, rarity) " +
            "VALUES (?, ?, ?, 1, ?, ?, ?)")) {
            ps.setInt(1, itemId); ps.setInt(2, inventoryId); ps.setInt(3, playerId);
            ps.setInt(4, condition); ps.setBoolean(5, isReplica); ps.setString(6, rarity);
            ps.executeUpdate();
        }
    }
}
