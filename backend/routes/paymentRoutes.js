import express from "express";

import {
  createPayment,
  uploadPaymentReceipt,
  getMyPayments,
  getAllPayments,
  getPaymentById,
  verifyPayment
} from "../controllers/paymentController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { uploadReceipt } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  createPayment
);

router.get(
  "/my",
  protect,
  authorizeRoles("student"),
  getMyPayments
);

router.get(
  "/admin/all",
  protect,
  authorizeRoles("admin"),
  getAllPayments
);

router.patch(
  "/:id/receipt",
  protect,
  authorizeRoles("student"),
  uploadReceipt.single("receipt"),
  uploadPaymentReceipt
);

router.patch(
  "/:id/verify",
  protect,
  authorizeRoles("admin"),
  verifyPayment
);

router.get(
  "/:id",
  protect,
  authorizeRoles("admin"),
  getPaymentById
);

export default router;