import express from "express";

import {
  createHostel,
  getActiveHostels,
  getAllHostelsAdmin,
  getHostelById,
  updateHostel,
  deactivateHostel
} from "../controllers/hostelController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", getActiveHostels);

router.get(
  "/admin/all",
  protect,
  authorizeRoles("admin"),
  getAllHostelsAdmin
);

router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  createHostel
);

router.get("/:id", getHostelById);

router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  updateHostel
);

router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deactivateHostel
);

export default router;