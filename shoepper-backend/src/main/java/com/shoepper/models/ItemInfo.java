package com.shoepper.models;

public class ItemInfo {
    private int instanceId;   // unique per physical item row (AUTO_INCREMENT PK)
    private int itemId;
    private int inventoryId;
    private int playerId;
    private int amount;
    private int condition;
    private boolean isReplica;
    private String rarity;
    // From ItemRelation join
    private String itemName;
    private String craftIngredient;
    private int craftTime;
    private String repairIngredient;
    private int repairTime;
    // From subtype joins (optional)
    private String brandName;
    private Double brandMultiplier;
    private String sEditionName;
    private Double sEditionMultiplier;
    private String celebName;
    private Double celebMultiplier;

    public ItemInfo() {}

    public int getInstanceId()               { return instanceId; }
    public void setInstanceId(int v)         { this.instanceId = v; }
    public int getItemId()                   { return itemId; }
    public void setItemId(int v)             { this.itemId = v; }
    public int getInventoryId()              { return inventoryId; }
    public void setInventoryId(int v)        { this.inventoryId = v; }
    public int getPlayerId()                 { return playerId; }
    public void setPlayerId(int v)           { this.playerId = v; }
    public int getAmount()                   { return amount; }
    public void setAmount(int v)             { this.amount = v; }
    public int getCondition()                { return condition; }
    public void setCondition(int v)          { this.condition = v; }
    public boolean isReplica()               { return isReplica; }
    public void setReplica(boolean v)        { this.isReplica = v; }
    public String getRarity()                { return rarity; }
    public void setRarity(String v)          { this.rarity = v; }
    public String getItemName()              { return itemName; }
    public void setItemName(String v)        { this.itemName = v; }
    public String getCraftIngredient()       { return craftIngredient; }
    public void setCraftIngredient(String v) { this.craftIngredient = v; }
    public int getCraftTime()                { return craftTime; }
    public void setCraftTime(int v)          { this.craftTime = v; }
    public String getRepairIngredient()      { return repairIngredient; }
    public void setRepairIngredient(String v){ this.repairIngredient = v; }
    public int getRepairTime()               { return repairTime; }
    public void setRepairTime(int v)         { this.repairTime = v; }
    public String getBrandName()             { return brandName; }
    public void setBrandName(String v)       { this.brandName = v; }
    public Double getBrandMultiplier()       { return brandMultiplier; }
    public void setBrandMultiplier(Double v) { this.brandMultiplier = v; }
    public String getSEditionName()          { return sEditionName; }
    public void setSEditionName(String v)    { this.sEditionName = v; }
    public Double getSEditionMultiplier()    { return sEditionMultiplier; }
    public void setSEditionMultiplier(Double v){ this.sEditionMultiplier = v; }
    public String getCelebName()             { return celebName; }
    public void setCelebName(String v)       { this.celebName = v; }
    public Double getCelebMultiplier()       { return celebMultiplier; }
    public void setCelebMultiplier(Double v) { this.celebMultiplier = v; }

    /** Calculates item price based on condition and multipliers */
    public double calculatePrice(double basePrice) {
        double price = basePrice * (condition / 100.0);
        if (isReplica)                price *= 0.6;
        if (brandMultiplier != null)  price *= brandMultiplier;
        if (sEditionMultiplier != null) price *= sEditionMultiplier;
        if (celebMultiplier != null)  price *= celebMultiplier;
        return Math.round(price);
    }
}
