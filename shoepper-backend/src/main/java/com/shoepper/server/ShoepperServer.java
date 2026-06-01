package com.shoepper.server;

import com.shoepper.controllers.*;
import com.shoepper.models.*;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.*;

/**
 * Vanilla Java HTTP server using JDK's built-in com.sun.net.httpserver.
 * No external dependencies — just Java + JDBC.
 *
 * Endpoints:
 *   POST   /api/players                         — create player
 *   GET    /api/players/{id}                    — get player state
 *   POST   /api/players/{id}/nextday            — advance day
 *   PUT    /api/players/{id}/shop               — upgrade shop
 *   POST   /api/players/{id}/gather             — gather resource
 *   POST   /api/players/{id}/craft              — craft item
 *   POST   /api/players/{id}/repair             — repair item
 *   POST   /api/players/{id}/trade              — process trade
 *   POST   /api/players/{id}/move               — move item between inventories
 *   GET    /api/shops                           — list all shops
 *   DELETE /api/players/{id}/customers/{name}   — remove customer
 */
public class ShoepperServer {

    private static final int PORT = 8080;

    private final PlayerRepository    playerRepo    = new PlayerRepository();
    private final InventoryRepository inventoryRepo = new InventoryRepository();
    private final CustomerRepository  customerRepo  = new CustomerRepository();

    public void start() throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
        server.createContext("/api/", this::handle);
        server.setExecutor(null);
        server.start();
        System.out.println("Shoepper backend running on http://localhost:" + PORT);
    }

    // ─── ROUTING ─────────────────────────────────────────────

    private void handle(HttpExchange ex) throws IOException {
        // CORS headers — allow React dev server
        ex.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        ex.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        ex.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
        ex.getResponseHeaders().add("Content-Type", "application/json");

        if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
            ex.sendResponseHeaders(204, -1);
            return;
        }

        String path   = ex.getRequestURI().getPath();
        String method = ex.getRequestMethod();
        String[] parts = path.split("/");
        // parts: ["", "api", resource, {id?}, action?]

        try {
            if (path.equals("/api/shops") && method.equals("GET")) {
                handleGetShops(ex);
            } else if (path.equals("/api/players") && method.equals("POST")) {
                handleCreatePlayer(ex);
            } else if (parts.length >= 4 && parts[2].equals("players")) {
                int playerId = Integer.parseInt(parts[3]);
                if (parts.length == 4) {
                    handleGetPlayer(ex, playerId);
                } else {
                    String action = parts[4];
                    switch (action) {
                        case "nextday"   -> handleNextDay(ex, playerId);
                        case "shop"      -> handleUpgradeShop(ex, playerId);
                        case "gather"    -> handleGather(ex, playerId);
                        case "craft"     -> handleCraft(ex, playerId);
                        case "repair"    -> handleRepair(ex, playerId);
                        case "trade"     -> handleTrade(ex, playerId);
                        case "move"      -> handleMove(ex, playerId);
                        case "customers" -> {
                            if (parts.length >= 6 && method.equals("DELETE")) {
                                handleRemoveCustomer(ex, playerId, parts[5]);
                            } else sendError(ex, 404, "Not found");
                        }
                        default          -> sendError(ex, 404, "Unknown action: " + action);
                    }
                }
            } else {
                sendError(ex, 404, "Not found");
            }
        } catch (NumberFormatException e) {
            sendError(ex, 400, "Invalid player ID");
        } catch (SQLException e) {
            System.err.println("SQL error: " + e.getMessage());
            sendError(ex, 500, "Database error: " + e.getMessage());
        }
    }

    // ─── HANDLERS ────────────────────────────────────────────

    private void handleGetShops(HttpExchange ex) throws IOException, SQLException {
        List<Shop> shops = List.of(
            new Shop("Basic Shop",          5.00, 1000.00, 3),
            new Shop("Advance Shop",        8.50, 2500.00, 7),
            new Shop("Shop of the Legends", 3.00, 5000.00, 10)
        );
        sendJson(ex, 200, JsonSerializer.toJson(shops));
    }

    private void handleCreatePlayer(HttpExchange ex) throws IOException, SQLException {
        Map<String, String> body = readBody(ex);
        String nickname = body.get("nickname");
        if (nickname == null || nickname.isBlank()) {
            sendError(ex, 400, "nickname is required"); return;
        }
        // Check duplicate
        Player existing = playerRepo.getPlayerByNickname(nickname);
        if (existing != null) {
            sendJson(ex, 200, JsonSerializer.toJson(existing)); return;
        }
        Player player = playerRepo.createPlayer(nickname);
        sendJson(ex, 201, JsonSerializer.toJson(player));
    }

    private void handleGetPlayer(HttpExchange ex, int playerId) throws IOException, SQLException {
        Player player = playerRepo.getPlayerById(playerId);
        if (player == null) { sendError(ex, 404, "Player not found"); return; }
        sendJson(ex, 200, JsonSerializer.toJson(player));
    }

    private void handleNextDay(HttpExchange ex, int playerId) throws IOException, SQLException {
        Player player = playerRepo.getPlayerById(playerId);
        if (player == null) { sendError(ex, 404, "Player not found"); return; }

        int newDay          = player.getDay() + 1;
        int newDaysUntilRent = player.getDaysUntilRent() - 1;
        int newWeek         = player.getWeek();
        boolean gameOver    = false;

        if (newDaysUntilRent <= 0) {
            newWeek++;
            newDaysUntilRent = 7;
            double newBudget = player.getBudget() - player.getShop().getRent();
            playerRepo.updateBudget(playerId, newBudget);
            if (newBudget < 0) gameOver = true;
        }

        // Game over: capture the final state for the client, then erase the
        // player's data from the database (rent could not be paid / balance went
        // negative). No point generating customers for a deleted player.
        if (gameOver) {
            Player finalState = playerRepo.getPlayerById(playerId);
            playerRepo.deletePlayer(playerId);
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("player",    finalState);
            response.put("customers", List.of());
            response.put("gameOver",  true);
            sendJson(ex, 200, JsonSerializer.toJson(response));
            return;
        }

        playerRepo.updateDayWeek(playerId, newDay, newWeek, newDaysUntilRent);

        // Generate new customers
        List<Customer> customers = customerRepo.generateDailyCustomers(
            playerId,
            player.getShop().getShopName(),
            player.getShop().getAttractionRate(),
            player.getShop().getRecognition()
        );

        Player updated = playerRepo.getPlayerById(playerId);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("player",   updated);
        response.put("customers", customers);
        response.put("gameOver",  false);
        sendJson(ex, 200, JsonSerializer.toJson(response));
    }

    private void handleUpgradeShop(HttpExchange ex, int playerId) throws IOException, SQLException {
        Map<String, String> body = readBody(ex);
        String newShop = body.get("shopName");
        if (newShop == null) { sendError(ex, 400, "shopName required"); return; }
        playerRepo.upgradeShop(playerId, newShop);
        Player updated = playerRepo.getPlayerById(playerId);
        sendJson(ex, 200, JsonSerializer.toJson(updated));
    }

    private void handleGather(HttpExchange ex, int playerId) throws IOException, SQLException {
        Map<String, String> body = readBody(ex);
        String resourceName = body.get("resourceName");
        if (resourceName == null) { sendError(ex, 400, "resourceName required"); return; }

        // Check inventory space
        int slots = inventoryRepo.getSlotCount(playerId, 1);
        int size  = inventoryRepo.getInventorySize(playerId, 1);

        // Add resource (stacking allowed, new type needs space)
        inventoryRepo.addResource(playerId, 1, resourceName, 1);

        // Grant EXP
        String skillName = resourceName.toLowerCase().contains("craft") ? "Craft Gathering" : "Repair Gathering";
        int gatherExp = getGatherExp(resourceName);
        playerRepo.addSkillExp(playerId, skillName, gatherExp);

        Player updated = playerRepo.getPlayerById(playerId);
        sendJson(ex, 200, JsonSerializer.toJson(updated));
    }

    private void handleCraft(HttpExchange ex, int playerId) throws IOException, SQLException {
        Map<String, String> body = readBody(ex);
        int itemId = Integer.parseInt(body.getOrDefault("itemId", "0"));

        String craftIngredient = getCraftIngredient(itemId);
        if (craftIngredient == null) { sendError(ex, 400, "Unknown itemId"); return; }

        // Consume resource
        boolean ok = inventoryRepo.consumeResource(playerId, 1, craftIngredient, 1);
        if (!ok) { sendError(ex, 400, "Insufficient resources: " + craftIngredient); return; }

        // Check player inventory space
        int slots = inventoryRepo.getSlotCount(playerId, 1);
        int size  = inventoryRepo.getInventorySize(playerId, 1);
        if (slots >= size) { sendError(ex, 400, "Player inventory is full"); return; }

        // Compute condition from skill
        Player player = playerRepo.getPlayerById(playerId);
        int craftSkillLevel = player.getSkills().stream()
            .filter(s -> s.getSkillName().equals("Item Crafting"))
            .mapToInt(PlayerSkill::getSkillLevel).findFirst().orElse(1);
        int condition = (int) Math.min(50 + craftSkillLevel * 0.5, 100);

        inventoryRepo.addItem(playerId, 1, itemId, condition, true, "common");
        playerRepo.addSkillExp(playerId, "Item Crafting", 30);

        Player updated = playerRepo.getPlayerById(playerId);
        sendJson(ex, 200, JsonSerializer.toJson(updated));
    }

    private void handleRepair(HttpExchange ex, int playerId) throws IOException, SQLException {
        Map<String, String> body = readBody(ex);
        int itemId      = Integer.parseInt(body.getOrDefault("itemId", "0"));
        int instanceId  = Integer.parseInt(body.getOrDefault("instanceId", "0"));
        int currentCondition = Integer.parseInt(body.getOrDefault("condition", "50"));

        String repairIngredient = getRepairIngredient(itemId);
        if (repairIngredient == null) { sendError(ex, 400, "Unknown itemId"); return; }

        // Consume repair resource
        boolean ok = inventoryRepo.consumeResource(playerId, 1, repairIngredient, 1);
        if (!ok) { sendError(ex, 400, "Insufficient resources: " + repairIngredient); return; }

        // Compute new condition
        Player player = playerRepo.getPlayerById(playerId);
        int repairSkillLevel = player.getSkills().stream()
            .filter(s -> s.getSkillName().equals("Item Repair"))
            .mapToInt(PlayerSkill::getSkillLevel).findFirst().orElse(1);
        double qualityMod   = Math.min(50 + repairSkillLevel * 0.5, 100);
        int conditionGain   = (int) Math.round((100 - currentCondition) * (qualityMod / 100));
        int newCondition    = Math.min(100, currentCondition + conditionGain);

        inventoryRepo.updateItemCondition(playerId, instanceId, newCondition);
        playerRepo.addSkillExp(playerId, "Item Repair", 25);

        Player updated = playerRepo.getPlayerById(playerId);
        sendJson(ex, 200, JsonSerializer.toJson(updated));
    }

    private void handleTrade(HttpExchange ex, int playerId) throws IOException, SQLException {
        Map<String, String> body = readBody(ex);
        String direction     = body.get("direction"); // "sell" or "buy"
        int itemId           = Integer.parseInt(body.getOrDefault("itemId", "0"));
        int instanceId       = Integer.parseInt(body.getOrDefault("instanceId", "0"));
        double price         = Double.parseDouble(body.getOrDefault("price", "0"));
        int condition        = Integer.parseInt(body.getOrDefault("condition", "50"));
        String customerName  = body.get("customerName");

        Player player = playerRepo.getPlayerById(playerId);
        if (player == null) { sendError(ex, 404, "Player not found"); return; }

        if ("sell".equals(direction)) {
            // Remove the specific item instance from inventory, add money
            inventoryRepo.removeItem(playerId, instanceId);
            playerRepo.updateBudget(playerId, player.getBudget() + price);
        } else if ("buy".equals(direction)) {
            if (player.getBudget() < price) {
                sendError(ex, 400, "Insufficient budget"); return;
            }
            int slots = inventoryRepo.getSlotCount(playerId, 1);
            int size  = inventoryRepo.getInventorySize(playerId, 1);
            if (slots >= size) { sendError(ex, 400, "Player inventory is full"); return; }
            inventoryRepo.addItem(playerId, 1, itemId, condition, false, "common");
            playerRepo.updateBudget(playerId, player.getBudget() - price);
        }

        // Remove customer
        if (customerName != null && player.getShop() != null) {
            customerRepo.removeCustomer(player.getShop().getShopName(), customerName);
        }

        Player updated = playerRepo.getPlayerById(playerId);
        sendJson(ex, 200, JsonSerializer.toJson(updated));
    }

    private void handleMove(HttpExchange ex, int playerId) throws IOException, SQLException {
        Map<String, String> body = readBody(ex);
        int instanceId = Integer.parseInt(body.getOrDefault("instanceId", "0"));
        int toInvId    = Integer.parseInt(body.getOrDefault("toInventoryId", "2"));

        inventoryRepo.moveItem(playerId, instanceId, toInvId);

        Player updated = playerRepo.getPlayerById(playerId);
        sendJson(ex, 200, JsonSerializer.toJson(updated));
    }

    private void handleRemoveCustomer(HttpExchange ex, int playerId, String customerName) throws IOException, SQLException {
        Player player = playerRepo.getPlayerById(playerId);
        if (player != null && player.getShop() != null) {
            customerRepo.removeCustomer(player.getShop().getShopName(), customerName);
        }
        sendJson(ex, 200, "{\"ok\":true}");
    }

    // ─── HELPERS ─────────────────────────────────────────────

    private Map<String, String> readBody(HttpExchange ex) throws IOException {
        String body = new String(ex.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        return JsonSerializer.parseFlat(body);
    }

    private void sendJson(HttpExchange ex, int status, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        ex.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = ex.getResponseBody()) { os.write(bytes); }
    }

    private void sendError(HttpExchange ex, int status, String message) throws IOException {
        sendJson(ex, status, "{\"error\":\"" + message + "\"}");
    }

    // Item metadata lookups (mirrors ITEM_RELATIONS in frontend mockData)
    private String getCraftIngredient(int itemId) {
        return switch (itemId) {
            case 1, 4 -> "Craft Resource Lv.1";
            case 2, 5 -> "Craft Resource Lv.2";
            case 3    -> "Craft Resource Lv.3";
            default   -> null;
        };
    }

    private String getRepairIngredient(int itemId) {
        return switch (itemId) {
            case 1, 4 -> "Repair Resource Lv.1";
            case 2, 5 -> "Repair Resource Lv.2";
            case 3    -> "Repair Resource Lv.3";
            default   -> null;
        };
    }

    private int getGatherExp(String resourceName) {
        if (resourceName.contains("Lv.1")) return 10;
        if (resourceName.contains("Lv.2")) return 25;
        if (resourceName.contains("Lv.3")) return 50;
        return 10;
    }
}
