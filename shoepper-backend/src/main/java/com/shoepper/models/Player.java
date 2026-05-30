package com.shoepper.models;

import java.util.List;

public class Player {
    private int playerId;
    private String nickname;
    private double budget;
    private List<PlayerStat> stats;
    private List<PlayerSkill> skills;
    private Shop shop;
    private int day;
    private int week;
    private int daysUntilRent;
    private Inventory playerInventory;
    private Inventory shopInventory;

    public Player() {}

    public Player(int playerId, String nickname, double budget) {
        this.playerId = playerId;
        this.nickname = nickname;
        this.budget   = budget;
    }

    // Getters & Setters
    public int getPlayerId()                      { return playerId; }
    public void setPlayerId(int playerId)          { this.playerId = playerId; }

    public String getNickname()                   { return nickname; }
    public void setNickname(String nickname)       { this.nickname = nickname; }

    public double getBudget()                     { return budget; }
    public void setBudget(double budget)           { this.budget = budget; }

    public List<PlayerStat> getStats()            { return stats; }
    public void setStats(List<PlayerStat> stats)  { this.stats = stats; }

    public List<PlayerSkill> getSkills()          { return skills; }
    public void setSkills(List<PlayerSkill> s)    { this.skills = s; }

    public Shop getShop()                         { return shop; }
    public void setShop(Shop shop)                { this.shop = shop; }

    public int getDay()                           { return day; }
    public void setDay(int day)                   { this.day = day; }

    public int getWeek()                          { return week; }
    public void setWeek(int week)                 { this.week = week; }

    public int getDaysUntilRent()                 { return daysUntilRent; }
    public void setDaysUntilRent(int d)           { this.daysUntilRent = d; }

    public Inventory getPlayerInventory()         { return playerInventory; }
    public void setPlayerInventory(Inventory i)   { this.playerInventory = i; }

    public Inventory getShopInventory()           { return shopInventory; }
    public void setShopInventory(Inventory i)     { this.shopInventory = i; }
}
