import User from "../models/User.js";

export const updateMyProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            res.status(404);
            throw new Error("User not found");
        }

        const allowedFields = [
            "name",
            "phone",
            "address",
            "profileImage"
        ];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                user[field] = req.body[field];
            }
        });

        await user.save();

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user
        });
    } catch (error) {
        next(error);
    }
};

export const getAllUsers = async (req, res, next) => {
    try {
        const filter = {};

        if (req.query.role) {
            filter.role = req.query.role;
        }

        if (req.query.isActive !== undefined) {
            filter.isActive = req.query.isActive === "true";
        }

        if (req.query.search) {
            filter.$or = [
                {
                    name: {
                        $regex: req.query.search,
                        $options: "i"
                    }
                },
                {
                    email: {
                        $regex: req.query.search,
                        $options: "i"
                    }
                },
                {
                    studentId: {
                        $regex: req.query.search,
                        $options: "i"
                    }
                }
            ];
        }

        const users = await User.find(filter).sort({
            createdAt: -1
        });

        res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        next(error);
    }
};

export const getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            res.status(404);
            throw new Error("User not found");
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        next(error);
    }
};

export const createStaffUser = async (req, res, next) => {
    try {
        const {
            name,
            email,
            password,
            phone,
            address
        } = req.body;

        if (!name || !email || !password) {
            res.status(400);
            throw new Error("Name, email and password are required");
        }

        if (password.length < 6) {
            res.status(400);
            throw new Error(
                "Password must contain at least 6 characters"
            );
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            res.status(409);
            throw new Error("A user already exists with this email");
        }

        const staff = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password,
            phone: phone?.trim() || "",
            address: address?.trim() || "",
            role: "maintenance"
        });

        res.status(201).json({
            success: true,
            message: "Maintenance staff account created successfully",
            user: staff
        });
    } catch (error) {
        if (error.code === 11000) {
            res.status(409);
            error.message = "Email already exists";
        }

        next(error);
    }
};

export const updateUserRole = async (req, res, next) => {
    try {
        const { role } = req.body;

        const allowedRoles = [
            "student",
            "admin",
            "maintenance"
        ];

        if (!allowedRoles.includes(role)) {
            res.status(400);
            throw new Error("Invalid user role");
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            res.status(404);
            throw new Error("User not found");
        }

        if (user._id.toString() === req.user._id.toString()) {
            res.status(400);
            throw new Error("You cannot change your own role");
        }

        user.role = role;

        if (role !== "student") {
            user.studentId = undefined;
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: "User role updated successfully",
            user
        });
    } catch (error) {
        next(error);
    }
};

export const updateUserStatus = async (req, res, next) => {
    try {
        const { isActive } = req.body;

        if (typeof isActive !== "boolean") {
            res.status(400);
            throw new Error("isActive must be true or false");
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            res.status(404);
            throw new Error("User not found");
        }

        if (user._id.toString() === req.user._id.toString()) {
            res.status(400);
            throw new Error("You cannot deactivate your own account");
        }

        user.isActive = isActive;
        await user.save();

        res.status(200).json({
            success: true,
            message: isActive
                ? "User account activated successfully"
                : "User account deactivated successfully",
            user
        });
    } catch (error) {
        next(error);
    }
};