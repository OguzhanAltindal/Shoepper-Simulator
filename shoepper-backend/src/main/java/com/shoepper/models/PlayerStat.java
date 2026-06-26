package com.shoepper.models;

public class PlayerStat {
    private int playerId;
    private String statName;
    private int statLevel;
    private double effectAmnt;
    private int exp;
    private int expNeeded;

    public PlayerStat() {}
    public PlayerStat(int playerId, String statName, int statLevel) {
        this.playerId  = playerId;
        this.statName  = statName;
        this.statLevel = statLevel;
        this.effectAmnt = (5.0 / 100) * statLevel;
    }

    public int getPlayerId()            { return playerId; }
    public void setPlayerId(int v)      { this.playerId = v; }
    public String getStatName()         { return statName; }
    public void setStatName(String v)   { this.statName = v; }
    public int getStatLevel()           { return statLevel; }
    public void setStatLevel(int v)     { this.statLevel = v; this.effectAmnt = (5.0/100)*v; }
    public double getEffectAmnt()       { return effectAmnt; }
    public int getExp()                 { return exp; }
    public void setExp(int v)           { this.exp = v; }
    public int getExpNeeded()           { return expNeeded; }
    public void setExpNeeded(int v)     { this.expNeeded = v; }
}
