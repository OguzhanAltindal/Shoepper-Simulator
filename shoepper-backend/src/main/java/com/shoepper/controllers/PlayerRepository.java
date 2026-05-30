package com.shoepper.controllers;

import com.shoepper.db.Database;
import com.shoepper.models.*;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * All database operations related to Player, PlayerStats, PlayerSkills,
 * PlayerOwnsShop, Inventory.
 */
public class PlayerRepository {

    // ─── CREATE ──────────────────────────────────────────────

    /**
     * Registers a new player with starting stats, skills, inventories and shop.
     * Returns the fully populated Player object.
     */
    public Player createPlayer(String nickname) throws SQLException {
        try (Connection conn = Database.getConnection()) {
            conn.setAutoCommit(false);
            try {
                // 1. Insert player
                int playerId;
                String insertPlayer = "INSERT INTO Player (nickname, budget) VALUES (?, 5000.00)";
                try (PreparedStatement ps = conn.prepareStatement(insertPlayer, Statement.RETURN_GENERATED_KEYS)) {
                    ps.setString(1, nickname);
                    ps.executeUpdate();
                    ResultSet rs = ps.getGeneratedKeys();
                    rs.next();
                    playerId = rs.getInt(1);
                }

                // 2. Starting stats
                String insertStat = "INSERT INTO PlayerStats (player_id, stat_name, stat_level) VALUES (?, ?, 1)";
                try (PreparedStatement ps = conn.prepareStatement(insertStat)) {
                    for (String stat : new String[]{"intelligence", "charisma"}) {
                        ps.setInt(1, playerId);
                        ps.setString(2, stat);
                        ps.addBatch();
                    }
                    ps.executeBatch();
                }

                // 3. Starting skills
                String insertPHS = "INSERT INTO PlayerHasSkills (player_id, skill_name, exp, exp_needed) VALUES (?, ?, 0, 100)";
                try (PreparedStatement ps = conn.prepareStatement(insertPHS)) {
                    for (String skill : new String[]{"Craft Gathering","Repair Gathering","Item Crafting","Item Repair"}) {
                        ps.setInt(1, playerId);
                        ps.setString(2, skill);
                        ps.addBatch();
                    }
                    ps.executeBatch();
                }

                // 4. Player inventory (inventory_id = 1)
                String insertInv = "INSERT INTO Inventory (inventory_id, player_id, size) VALUES (?, ?, 20)";
                try (PreparedStatement ps = conn.prepareStatement(insertInv)) {
                    ps.setInt(1, 1); ps.setInt(2, playerId); ps.executeUpdate();
                    ps.setInt(1, 2); ps.setInt(2, playerId); ps.executeUpdate();
                }

                String insertPI = "INSERT INTO PlayerInventory (inventory_id, player_id) VALUES (1, ?)";
                try (PreparedStatement ps = conn.prepareStatement(insertPI)) {
                    ps.setInt(1, playerId); ps.executeUpdate();
                }

                // 5. Shop inventory (inventory_id = 2) linked to Basic Shop
                String insertSI = "INSERT INTO ShopInventory (inventory_id, player_id, shop_name) VALUES (2, ?, 'Basic Shop')";
                try (PreparedStatement ps = conn.prepareStatement(insertSI)) {
                    ps.setInt(1, playerId); ps.executeUpdate();
                }

                // 6. Player owns Basic Shop
                String insertOwns = "INSERT INTO PlayerOwnsShop (player_id, shop_name, day, week, days_until_rent) VALUES (?, 'Basic Shop', 1, 1, 7)";
                try (PreparedStatement ps = conn.prepareStatement(insertOwns)) {
                    ps.setInt(1, playerId); ps.executeUpdate();
                }

                // 7. Starting resources (player inventory)
                String insertRes = "INSERT INTO ResourceInInventory (player_id, inventory_id, resource_name, amount) VALUES (?, 1, ?, ?)";
                try (PreparedStatement ps = conn.prepareStatement(insertRes)) {
                    Object[][] startRes = {
                        {"Craft Resource Lv.1", 5},
                        {"Craft Resource Lv.2", 3},
                        {"Repair Resource Lv.1", 2}
                    };
                    for (Object[] r : startRes) {
                        ps.setInt(1, playerId);
                        ps.setString(2, (String) r[0]);
                        ps.setInt(3, (int) r[1]);
                        ps.addBatch();
                    }
                    ps.executeBatch();
                }

                // 8. Starting items in shop inventory
                String insertItem = "INSERT INTO ItemInfo (item_id, inventory_id, player_id, amount, `condition`, is_replica, rarity) VALUES (?, 2, ?, 1, ?, 0, 'common')";
                try (PreparedStatement ps = conn.prepareStatement(insertItem)) {
                    ps.setInt(1, 1); ps.setInt(2, playerId); ps.setInt(3, 85); ps.addBatch();
                    ps.setInt(1, 2); ps.setInt(2, playerId); ps.setInt(3, 60); ps.addBatch();
                    ps.executeBatch();
                }

                conn.commit();
                return getPlayerById(playerId);

            } catch (SQLException e) {
                conn.rollback();
                throw e;
            }
        }
    }

    // ─── READ ─────────────────────────────────────────────────

    public Player getPlayerById(int playerId) throws SQLException {
        try (Connection conn = Database.getConnection()) {
            // Base player
            Player player = null;
            String sql = "SELECT p.player_id, p.nickname, p.budget, " +
                         "pos.shop_name, pos.day, pos.week, pos.days_until_rent " +
                         "FROM Player p " +
                         "JOIN PlayerOwnsShop pos ON pos.player_id = p.player_id " +
                         "WHERE p.player_id = ?";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setInt(1, playerId);
                ResultSet rs = ps.executeQuery();
                if (rs.next()) {
                    player = new Player();
                    player.setPlayerId(rs.getInt("player_id"));
                    player.setNickname(rs.getString("nickname"));
                    player.setBudget(rs.getDouble("budget"));
                    player.setDay(rs.getInt("day"));
                    player.setWeek(rs.getInt("week"));
                    player.setDaysUntilRent(rs.getInt("days_until_rent"));
                }
            }
            if (player == null) return null;

            // Shop
            player.setShop(getShopByPlayer(conn, playerId));

            // Stats
            player.setStats(getStats(conn, playerId));

            // Skills
            player.setSkills(getSkills(conn, playerId));

            // Inventories
            player.setPlayerInventory(getInventory(conn, playerId, 1));
            player.setShopInventory(getInventory(conn, playerId, 2));

            return player;
        }
    }

    public Player getPlayerByNickname(String nickname) throws SQLException {
        try (Connection conn = Database.getConnection()) {
            String sql = "SELECT player_id FROM Player WHERE nickname = ?";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, nickname);
                ResultSet rs = ps.executeQuery();
                if (rs.next()) return getPlayerById(rs.getInt("player_id"));
            }
        }
        return null;
    }

    private Shop getShopByPlayer(Connection conn, int playerId) throws SQLException {
        String sql = "SELECT s.shop_name, s.attraction_rate, s.rent, s.recognition " +
                     "FROM Shop s JOIN PlayerOwnsShop pos ON pos.shop_name = s.shop_name " +
                     "WHERE pos.player_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, playerId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return new Shop(rs.getString("shop_name"), rs.getDouble("attraction_rate"),
                                rs.getDouble("rent"), rs.getInt("recognition"));
            }
        }
        return null;
    }

    private List<PlayerStat> getStats(Connection conn, int playerId) throws SQLException {
        List<PlayerStat> stats = new ArrayList<>();
        String sql = "SELECT player_id, stat_name, stat_level, effect_amnt FROM PlayerStats WHERE player_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, playerId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                PlayerStat s = new PlayerStat();
                s.setPlayerId(rs.getInt("player_id"));
                s.setStatName(rs.getString("stat_name"));
                s.setStatLevel(rs.getInt("stat_level"));
                stats.add(s);
            }
        }
        return stats;
    }

    private List<PlayerSkill> getSkills(Connection conn, int playerId) throws SQLException {
        List<PlayerSkill> skills = new ArrayList<>();
        String sql = "SELECT phs.player_id, phs.skill_name, phs.exp, phs.exp_needed, " +
                     "sk.skill_level, " +
                     "gs.rarity_modifier, cs.quality_modifier " +
                     "FROM PlayerHasSkills phs " +
                     "JOIN Skills sk ON sk.skill_name = phs.skill_name " +
                     "LEFT JOIN GatheringSkills gs ON gs.skill_name = phs.skill_name " +
                     "LEFT JOIN CraftingSkills cs ON cs.skill_name = phs.skill_name " +
                     "WHERE phs.player_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, playerId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                PlayerSkill sk = new PlayerSkill();
                sk.setPlayerId(rs.getInt("player_id"));
                sk.setSkillName(rs.getString("skill_name"));
                sk.setSkillLevel(rs.getInt("skill_level"));
                sk.setExp(rs.getInt("exp"));
                sk.setExpNeeded(rs.getInt("exp_needed"));
                double rarity = rs.getDouble("rarity_modifier");
                double quality = rs.getDouble("quality_modifier");
                if (!rs.wasNull() && rarity > 0) {
                    sk.setType("gathering");
                    sk.setRarityModifier(rarity);
                } else {
                    sk.setType("crafting");
                    sk.setQualityModifier(quality);
                }
                skills.add(sk);
            }
        }
        return skills;
    }

    public Inventory getInventory(Connection conn, int playerId, int inventoryId) throws SQLException {
        Inventory inv = new Inventory();
        inv.setPlayerId(playerId);
        inv.setInventoryId(inventoryId);

        // Size
        String sizeSql = "SELECT size FROM Inventory WHERE player_id = ? AND inventory_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sizeSql)) {
            ps.setInt(1, playerId); ps.setInt(2, inventoryId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) inv.setSize(rs.getInt("size"));
        }

        // Resources
        List<ResourceInInventory> resources = new ArrayList<>();
        String resSql = "SELECT ri.resource_name, ri.amount, rt.resource_level, rt.gather_exp " +
                        "FROM ResourceInInventory ri " +
                        "JOIN ResourceType rt ON rt.resource_name = ri.resource_name " +
                        "WHERE ri.player_id = ? AND ri.inventory_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(resSql)) {
            ps.setInt(1, playerId); ps.setInt(2, inventoryId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                ResourceInInventory r = new ResourceInInventory();
                r.setPlayerId(playerId);
                r.setInventoryId(inventoryId);
                r.setResourceName(rs.getString("resource_name"));
                r.setAmount(rs.getInt("amount"));
                r.setResourceLevel(rs.getInt("resource_level"));
                r.setGatherExp(rs.getInt("gather_exp"));
                resources.add(r);
            }
        }
        inv.setResources(resources);

        // Items with full join
        List<ItemInfo> items = new ArrayList<>();
        String itemSql = "SELECT ii.item_id, ii.inventory_id, ii.player_id, ii.amount, " +
                         "ii.`condition`, ii.is_replica, ii.rarity, " +
                         "ir.item_name, ir.craft_ingredient, ir.craft_time, ir.repair_ingredient, ir.repair_time, " +
                         "b.brand_name, b.brand_multiplier, " +
                         "se.s_edition_name, se.s_edition_multiplier, " +
                         "si.celeb_name, si.celeb_multiplier " +
                         "FROM ItemInfo ii " +
                         "JOIN ItemRelation ir ON ir.item_id = ii.item_id " +
                         "LEFT JOIN BrandedItem b ON b.item_id = ii.item_id " +
                         "LEFT JOIN SpecialEditionItem se ON se.item_id = ii.item_id " +
                         "LEFT JOIN SignedItem si ON si.item_id = ii.item_id " +
                         "WHERE ii.player_id = ? AND ii.inventory_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(itemSql)) {
            ps.setInt(1, playerId); ps.setInt(2, inventoryId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                ItemInfo item = mapItemInfo(rs);
                items.add(item);
            }
        }
        inv.setItems(items);
        return inv;
    }

    private ItemInfo mapItemInfo(ResultSet rs) throws SQLException {
        ItemInfo item = new ItemInfo();
        item.setItemId(rs.getInt("item_id"));
        item.setInventoryId(rs.getInt("inventory_id"));
        item.setPlayerId(rs.getInt("player_id"));
        item.setAmount(rs.getInt("amount"));
        item.setCondition(rs.getInt("condition"));
        item.setReplica(rs.getBoolean("is_replica"));
        item.setRarity(rs.getString("rarity"));
        item.setItemName(rs.getString("item_name"));
        item.setCraftIngredient(rs.getString("craft_ingredient"));
        item.setCraftTime(rs.getInt("craft_time"));
        item.setRepairIngredient(rs.getString("repair_ingredient"));
        item.setRepairTime(rs.getInt("repair_time"));
        String brand = rs.getString("brand_name");
        if (brand != null) {
            item.setBrandName(brand);
            item.setBrandMultiplier(rs.getDouble("brand_multiplier"));
        }
        String edition = rs.getString("s_edition_name");
        if (edition != null) {
            item.setSEditionName(edition);
            item.setSEditionMultiplier(rs.getDouble("s_edition_multiplier"));
        }
        String celeb = rs.getString("celeb_name");
        if (celeb != null) {
            item.setCelebName(celeb);
            item.setCelebMultiplier(rs.getDouble("celeb_multiplier"));
        }
        return item;
    }

    // ─── UPDATE ───────────────────────────────────────────────

    public void updateBudget(int playerId, double newBudget) throws SQLException {
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement("UPDATE Player SET budget = ? WHERE player_id = ?")) {
            ps.setDouble(1, newBudget);
            ps.setInt(2, playerId);
            ps.executeUpdate();
        }
    }

    public void updateDayWeek(int playerId, int day, int week, int daysUntilRent) throws SQLException {
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(
                "UPDATE PlayerOwnsShop SET day = ?, week = ?, days_until_rent = ? WHERE player_id = ?")) {
            ps.setInt(1, day); ps.setInt(2, week); ps.setInt(3, daysUntilRent); ps.setInt(4, playerId);
            ps.executeUpdate();
        }
    }

    public void upgradeShop(int playerId, String newShopName) throws SQLException {
        try (Connection conn = Database.getConnection()) {
            // Update shop reference and shop inventory
            try (PreparedStatement ps = conn.prepareStatement(
                "UPDATE PlayerOwnsShop SET shop_name = ? WHERE player_id = ?")) {
                ps.setString(1, newShopName); ps.setInt(2, playerId); ps.executeUpdate();
            }
            try (PreparedStatement ps = conn.prepareStatement(
                "UPDATE ShopInventory SET shop_name = ? WHERE player_id = ?")) {
                ps.setString(1, newShopName); ps.setInt(2, playerId); ps.executeUpdate();
            }
        }
    }

    public void addSkillExp(int playerId, String skillName, int expGain) throws SQLException {
        try (Connection conn = Database.getConnection()) {
            // Get current exp
            int currentExp = 0, expNeeded = 100, currentLevel = 1;
            String getSql = "SELECT phs.exp, phs.exp_needed, sk.skill_level " +
                            "FROM PlayerHasSkills phs JOIN Skills sk ON sk.skill_name = phs.skill_name " +
                            "WHERE phs.player_id = ? AND phs.skill_name = ?";
            try (PreparedStatement ps = conn.prepareStatement(getSql)) {
                ps.setInt(1, playerId); ps.setString(2, skillName);
                ResultSet rs = ps.executeQuery();
                if (rs.next()) {
                    currentExp   = rs.getInt("exp");
                    expNeeded    = rs.getInt("exp_needed");
                    currentLevel = rs.getInt("skill_level");
                }
            }
            int newExp = currentExp + expGain;
            int newLevel = currentLevel;
            int newExpNeeded = expNeeded;
            if (newExp >= expNeeded && currentLevel < 100) {
                newExp = newExp - expNeeded;
                newExpNeeded = expNeeded + 50;
                newLevel = Math.min(100, currentLevel + 1);
                // Update skill level globally
                try (PreparedStatement ps = conn.prepareStatement(
                    "UPDATE Skills SET skill_level = ? WHERE skill_name = ?")) {
                    ps.setInt(1, newLevel); ps.setString(2, skillName); ps.executeUpdate();
                }
                // Update subtype skill level too
                try (PreparedStatement ps = conn.prepareStatement(
                    "UPDATE GatheringSkills SET skill_level = ? WHERE skill_name = ?")) {
                    ps.setInt(1, newLevel); ps.setString(2, skillName); ps.executeUpdate();
                }
                try (PreparedStatement ps = conn.prepareStatement(
                    "UPDATE CraftingSkills SET skill_level = ? WHERE skill_name = ?")) {
                    ps.setInt(1, newLevel); ps.setString(2, skillName); ps.executeUpdate();
                }
            }
            // Update exp in PlayerHasSkills
            try (PreparedStatement ps = conn.prepareStatement(
                "UPDATE PlayerHasSkills SET exp = ?, exp_needed = ? WHERE player_id = ? AND skill_name = ?")) {
                ps.setInt(1, newExp); ps.setInt(2, newExpNeeded);
                ps.setInt(3, playerId); ps.setString(4, skillName);
                ps.executeUpdate();
            }
        }
    }
}
