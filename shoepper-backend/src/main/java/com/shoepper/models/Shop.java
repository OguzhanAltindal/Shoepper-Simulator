package com.shoepper.models;

public class Shop {
    private String shopName;
    private double attractionRate;
    private double rent;
    private int recognition;

    public Shop() {}
    public Shop(String shopName, double attractionRate, double rent, int recognition) {
        this.shopName       = shopName;
        this.attractionRate = attractionRate;
        this.rent           = rent;
        this.recognition    = recognition;
    }

    public String getShopName()            { return shopName; }
    public void setShopName(String v)      { this.shopName = v; }
    public double getAttractionRate()      { return attractionRate; }
    public void setAttractionRate(double v){ this.attractionRate = v; }
    public double getRent()                { return rent; }
    public void setRent(double v)          { this.rent = v; }
    public int getRecognition()            { return recognition; }
    public void setRecognition(int v)      { this.recognition = v; }
}
