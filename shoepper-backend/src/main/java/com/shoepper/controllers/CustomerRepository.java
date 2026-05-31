package com.shoepper.controllers;

import com.shoepper.db.Database;
import com.shoepper.models.Customer;
import com.shoepper.models.ItemInfo;
import com.shoepper.models.Shop;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class CustomerRepository {

    private static final String[] CUSTOMER_NAMES = {
            "Mahmud", "Bülent", "Ali", "Emre", "Berke", "Ahmet", "Zeynep", "Selin",
            "Kemal", "Tarık", "Fatma", "Hasan", "Murat", "Gökhan", "Deniz", "Caner"
    };

    private static final int[][] ITEM_BASE_PRICES = {
            { 1, 100 }, { 2, 200 }, { 3, 350 }, { 4, 50 }, { 5, 250 }
    };

    private final Random rng = new Random();

    /** Generates and inserts daily customers for a shop, returns list */
    public List<Customer> generateDailyCustomers(int playerId, String shopName,
            double attractionRate, int recognition) throws SQLException {
        // Delete previous customers for this shop
        clearCustomers(shopName);

        int count = Math.max(1, (int) Math.round(attractionRate * (0.8 + rng.nextDouble() * 0.4)));
        List<Customer> customers = new ArrayList<>();

        try (Connection conn = Database.getConnection()) {
            String ins = "INSERT INTO Customer (shop_name, customer_name, patience, greed) VALUES (?, ?, ?, ?)";
            try (PreparedStatement ps = conn.prepareStatement(ins)) {
                for (int i = 0; i < count; i++) {
                    String name = CUSTOMER_NAMES[rng.nextInt(CUSTOMER_NAMES.length)] + "_" + (i + 1);
                    int greed = Math.min(10, rng.nextInt(6) + recognition);
                    int patience = Math.max(1, rng.nextInt(8) - recognition / 3);
                    ps.setString(1, shopName);
                    ps.setString(2, name);
                    ps.setInt(3, patience);
                    ps.setInt(4, greed);
                    ps.addBatch();

                    Customer c = new Customer();
                    c.setShopName(shopName);
                    c.setCustomerName(name);
                    c.setPatience(patience);
                    c.setGreed(greed);
                    c.setWantsToBuy(rng.nextDouble() > 0.4);
                    c.setOfferedItem(generateRandomItem());
                    customers.add(c);
                }
                ps.executeBatch();
            }
        }
        return customers;
    }

    /** Removes customer record after trade is complete */
    public void removeCustomer(String shopName, String customerName) throws SQLException {
        try (Connection conn = Database.getConnection();
                PreparedStatement ps = conn.prepareStatement(
                        "DELETE FROM Customer WHERE shop_name = ? AND customer_name = ?")) {
            ps.setString(1, shopName);
            ps.setString(2, customerName);
            ps.executeUpdate();
        }
    }

    public void clearCustomers(String shopName) throws SQLException {
        try (Connection conn = Database.getConnection();
                PreparedStatement ps = conn.prepareStatement(
                        "DELETE FROM Customer WHERE shop_name = ?")) {
            ps.setString(1, shopName);
            ps.executeUpdate();
        }
    }

    private ItemInfo generateRandomItem() {
        int[] pair = ITEM_BASE_PRICES[rng.nextInt(ITEM_BASE_PRICES.length)];
        ItemInfo item = new ItemInfo();
        item.setItemId(pair[0]);
        item.setCondition(20 + rng.nextInt(61)); // 20-80
        item.setReplica(false);
        item.setRarity("common");
        item.setAmount(1);
        return item;
    }
}
