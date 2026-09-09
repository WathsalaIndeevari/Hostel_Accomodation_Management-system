import express from "express";

import {
    updateMyProfile,
    getAllUsers,
    getUserById,
    createStaffUser,
    updateUserRole,
    updateUserStatus
} from "../controllers/userController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.put("/profile", protect, updateMyProfile);

router.get(
    "/",
    protect,
    authorizeRoles("admin"),
    getAllUsers
);

router.post(
    "/staff",
    protect,
    authorizeRoles("admin"),
    createStaffUser
);

router.get(
    "/:id",
    protect,
    authorizeRoles("admin"),
    getUserById
);

router.patch(
    "/:id/role",
    protect,
    authorizeRoles("admin"),
    updateUserRole
);

router.patch(
    "/:id/status",
    protect,
    authorizeRoles("admin"),
    updateUserStatus
);

export default router;