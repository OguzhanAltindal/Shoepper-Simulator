package com.shoepper.models;

import java.util.List;

public class Inventory {
    private int inventoryId;
    private int playerId;
    private int size;
    private List<ResourceInInventory> resources;
    private List<ItemInfo> items;

    public Inventory() {}

    public int getInventoryId()                      { return inventoryId; }
    public void setInventoryId(int v)                { this.inventoryId = v; }
    public int getPlayerId()                         { return playerId; }
    public void setPlayerId(int v)                   { this.playerId = v; }
    public int getSize()                             { return size; }
    public void setSize(int v)                       { this.size = v; }
    public List<ResourceInInventory> getResources()  { return resources; }
    public void setResources(List<ResourceInInventory> v) { this.resources = v; }
    public List<ItemInfo> getItems()                 { return items; }
    public void setItems(List<ItemInfo> v)           { this.items = v; }
}
