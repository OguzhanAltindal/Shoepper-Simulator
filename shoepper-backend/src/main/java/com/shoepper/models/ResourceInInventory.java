package com.shoepper.models;

public class ResourceInInventory {
    private int playerId;
    private int inventoryId;
    private String resourceName;
    private int amount;
    private int resourceLevel;
    private int gatherExp;

    public ResourceInInventory() {}

    public int getPlayerId()             { return playerId; }
    public void setPlayerId(int v)       { this.playerId = v; }
    public int getInventoryId()          { return inventoryId; }
    public void setInventoryId(int v)    { this.inventoryId = v; }
    public String getResourceName()      { return resourceName; }
    public void setResourceName(String v){ this.resourceName = v; }
    public int getAmount()               { return amount; }
    public void setAmount(int v)         { this.amount = v; }
    public int getResourceLevel()        { return resourceLevel; }
    public void setResourceLevel(int v)  { this.resourceLevel = v; }
    public int getGatherExp()            { return gatherExp; }
    public void setGatherExp(int v)      { this.gatherExp = v; }
}
