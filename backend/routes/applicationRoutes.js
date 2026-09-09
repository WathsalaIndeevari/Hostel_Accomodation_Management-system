import express from "express";

import {
  createApplication,
  getMyApplications,
  getAllApplications,
  getApplicationById,
  reviewApplication,
  cancelApplication
} from "../controllers/applicationController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorizeRoles("student"),
  createApplication
);

router.get(
  "/my",
  protect,
  authorizeRoles("student"),
  getMyApplications
);

router.get(
  "/admin/all",
  protect,
  authorizeRoles("admin"),
  getAllApplications
);

router.get(
  "/:id",
  protect,
  getApplicationById
);

router.patch(
  "/:id/review",
  protect,
  authorizeRoles("admin"),
  reviewApplication
);

router.patch(
  "/:id/cancel",
  protect,
  authorizeRoles("student"),
  cancelApplication
);

export default router;