package com.shoepper.models;

public class Customer {
    private String shopName;
    private String customerName;
    private int patience;
    private int greed;
    private boolean wantsToBuy;
    private ItemInfo offeredItem;

    public Customer() {}

    public String getShopName()           { return shopName; }
    public void setShopName(String v)     { this.shopName = v; }
    public String getCustomerName()       { return customerName; }
    public void setCustomerName(String v) { this.customerName = v; }
    public int getPatience()              { return patience; }
    public void setPatience(int v)        { this.patience = v; }
    public int getGreed()                 { return greed; }
    public void setGreed(int v)           { this.greed = v; }
    public boolean isWantsToBuy()         { return wantsToBuy; }
    public void setWantsToBuy(boolean v)  { this.wantsToBuy = v; }
    public ItemInfo getOfferedItem()      { return offeredItem; }
    public void setOfferedItem(ItemInfo v){ this.offeredItem = v; }
}
