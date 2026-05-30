package com.shoepper.models;

public class PlayerSkill {
    private int playerId;
    private String skillName;
    private int skillLevel;
    private int exp;
    private int expNeeded;
    private String type; // "gathering" or "crafting"
    private double rarityModifier;   // gathering only
    private double qualityModifier;  // crafting only

    public PlayerSkill() {}

    public int getPlayerId()               { return playerId; }
    public void setPlayerId(int v)         { this.playerId = v; }
    public String getSkillName()           { return skillName; }
    public void setSkillName(String v)     { this.skillName = v; }
    public int getSkillLevel()             { return skillLevel; }
    public void setSkillLevel(int v)       { this.skillLevel = v; }
    public int getExp()                    { return exp; }
    public void setExp(int v)              { this.exp = v; }
    public int getExpNeeded()              { return expNeeded; }
    public void setExpNeeded(int v)        { this.expNeeded = v; }
    public String getType()                { return type; }
    public void setType(String v)          { this.type = v; }
    public double getRarityModifier()      { return rarityModifier; }
    public void setRarityModifier(double v){ this.rarityModifier = v; }
    public double getQualityModifier()     { return qualityModifier; }
    public void setQualityModifier(double v){ this.qualityModifier = v; }
}
