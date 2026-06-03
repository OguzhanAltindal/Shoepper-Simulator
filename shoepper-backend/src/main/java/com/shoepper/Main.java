package com.shoepper;

import com.shoepper.db.DatabaseSeeder;
import com.shoepper.server.ShoepperServer;

public class Main {
    public static void main(String[] args) throws Exception {
        System.out.println("Starting Shoepper Simulator Backend...");
        DatabaseSeeder.seed();
        new ShoepperServer().start();
    }
}
