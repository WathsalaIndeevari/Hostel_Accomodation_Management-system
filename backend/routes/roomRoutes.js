import express from "express";

import {
  createRoom,
  getAvailableRoomsByHostel,
  getAllRoomsAdmin,
  getRoomById,
  updateRoom,
  deactivateRoom
} from "../controllers/roomController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
  "/admin/all",
  protect,
  authorizeRoles("admin"),
  getAllRoomsAdmin
);

router.get(
  "/hostel/:hostelId",
  getAvailableRoomsByHostel
);

router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  createRoom
);

router.get("/:id", getRoomById);

router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  updateRoom
);

router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deactivateRoom
);

export default router;