import express from "express";

import {
  createAllocation,
  getMyAllocation,
  getMyAllocationHistory,
  getAllAllocations,
  getAllocationById,
  endAllocation
} from "../controllers/allocationController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  createAllocation
);

router.get(
  "/my",
  protect,
  authorizeRoles("student"),
  getMyAllocation
);

router.get(
  "/my/history",
  protect,
  authorizeRoles("student"),
  getMyAllocationHistory
);

router.get(
  "/admin/all",
  protect,
  authorizeRoles("admin"),
  getAllAllocations
);

router.get(
  "/:id",
  protect,
  getAllocationById
);

router.patch(
  "/:id/end",
  protect,
  authorizeRoles("admin"),
  endAllocation
);

export default router;