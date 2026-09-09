import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDatabase from "../config/database.js";
import User from "../models/User.js";

dotenv.config();

const createAdmin = async () => {
    try {
        await connectDatabase();

        if (
            !process.env.ADMIN_NAME ||
            !process.env.ADMIN_EMAIL ||
            !process.env.ADMIN_PASSWORD
        ) {
            throw new Error(
                "ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD are required"
            );
        }

        const email = process.env.ADMIN_EMAIL.toLowerCase().trim();

        let admin = await User.findOne({ email });

        if (admin) {
            admin.role = "admin";
            admin.isActive = true;
            admin.studentId = undefined;

            await admin.save();

            console.log("Existing user promoted to admin");
        } else {
            admin = await User.create({
                name: process.env.ADMIN_NAME,
                email,
                password: process.env.ADMIN_PASSWORD,
                role: "admin",
                isActive: true
            });

            console.log("Admin account created successfully");
        }

        console.log(`Admin email: ${admin.email}`);

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error(`Admin creation failed: ${error.message}`);

        await mongoose.connection.close();
        process.exit(1);
    }
};

createAdmin();