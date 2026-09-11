import fs from "fs";
import mongoose from "mongoose";

import Payment from "../models/Payment.js";
import Allocation from "../models/Allocation.js";

const removeUploadedFile = (file) => {
  if (file?.path && fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }
};

const populatePayment = (query) => {
  return query
    .populate(
      "studentId",
      "name email studentId phone"
    )
    .populate({
      path: "allocationId",
      select: "roomId bedNumber startDate endDate status",
      populate: {
        path: "roomId",
        select: "roomNumber floor roomType hostelId",
        populate: {
          path: "hostelId",
          select: "name location"
        }
      }
    })
    .populate("verifiedBy", "name email")
    .populate("createdBy", "name email");
};

export const createPayment = async (req, res, next) => {
  try {
    const {
      allocationId,
      title,
      amount,
      paymentType,
      period,
      dueDate
    } = req.body;

    if (
      !allocationId ||
      !title ||
      amount === undefined ||
      !paymentType ||
      !period ||
      !dueDate
    ) {
      res.status(400);
      throw new Error(
        "Allocation, title, amount, payment type, period and due date are required"
      );
    }

    if (!mongoose.Types.ObjectId.isValid(allocationId)) {
      res.status(400);
      throw new Error("Invalid allocation ID");
    }

    const allocation = await Allocation.findById(allocationId);

    if (!allocation) {
      res.status(404);
      throw new Error("Allocation not found");
    }

    if (allocation.status !== "active") {
      res.status(400);
      throw new Error(
        "Payments can only be created for active allocations"
      );
    }

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      res.status(400);
      throw new Error("Amount must be greater than zero");
    }

    const parsedDueDate = new Date(dueDate);

    if (Number.isNaN(parsedDueDate.getTime())) {
      res.status(400);
      throw new Error("Invalid due date");
    }

    const allowedPaymentTypes = [
      "deposit",
      "monthly",
      "semester",
      "fine",
      "other"
    ];

    const normalizedPaymentType =
      paymentType.toLowerCase();

    if (
      !allowedPaymentTypes.includes(normalizedPaymentType)
    ) {
      res.status(400);
      throw new Error("Invalid payment type");
    }

    const existingPayment = await Payment.findOne({
      allocationId,
      paymentType: normalizedPaymentType,
      period: period.trim()
    });

    if (existingPayment) {
      res.status(409);
      throw new Error(
        "This payment record already exists for the selected period"
      );
    }

    const payment = await Payment.create({
      studentId: allocation.studentId,
      allocationId,
      title: title.trim(),
      amount: numericAmount,
      paymentType: normalizedPaymentType,
      period: period.trim(),
      dueDate: parsedDueDate,
      status: "unpaid",
      createdBy: req.user._id
    });

    const populatedPayment = await populatePayment(
      Payment.findById(payment._id)
    );

    res.status(201).json({
      success: true,
      message: "Payment record created successfully",
      payment: populatedPayment
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(409);
      error.message =
        "This payment already exists for the selected period";
    }

    next(error);
  }
};

export const uploadPaymentReceipt = async (
  req,
  res,
  next
) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      removeUploadedFile(req.file);

      res.status(400);
      throw new Error("Invalid payment ID");
    }

    if (!req.file) {
      res.status(400);
      throw new Error("Payment receipt is required");
    }

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      removeUploadedFile(req.file);

      res.status(404);
      throw new Error("Payment not found");
    }

    if (
      payment.studentId.toString() !==
      req.user._id.toString()
    ) {
      removeUploadedFile(req.file);

      res.status(403);
      throw new Error(
        "You cannot upload a receipt for another student's payment"
      );
    }

    if (!["unpaid", "rejected"].includes(payment.status)) {
      removeUploadedFile(req.file);

      res.status(400);
      throw new Error(
        "A receipt cannot be uploaded for this payment"
      );
    }

    payment.receiptUrl =
      `${req.protocol}://${req.get("host")}` +
      `/uploads/receipts/${req.file.filename}`;

    payment.paymentDate = new Date();
    payment.status = "pending";
    payment.verifiedBy = null;
    payment.verifiedAt = null;
    payment.rejectionReason = "";

    await payment.save();

    const populatedPayment = await populatePayment(
      Payment.findById(payment._id)
    );

    res.status(200).json({
      success: true,
      message: "Payment receipt uploaded successfully",
      payment: populatedPayment
    });
  } catch (error) {
    if (req.file && !res.headersSent) {
      removeUploadedFile(req.file);
    }

    next(error);
  }
};

export const getMyPayments = async (req, res, next) => {
  try {
    const filter = {
      studentId: req.user._id
    };

    if (req.query.status) {
      filter.status = req.query.status.toLowerCase();
    }

    const payments = await populatePayment(
      Payment.find(filter).sort({
        dueDate: -1
      })
    );

    res.status(200).json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error) {
    next(error);
  }
};

export const getAllPayments = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status.toLowerCase();
    }

    if (req.query.paymentType) {
      filter.paymentType =
        req.query.paymentType.toLowerCase();
    }

    if (req.query.studentId) {
      if (
        !mongoose.Types.ObjectId.isValid(req.query.studentId)
      ) {
        res.status(400);
        throw new Error("Invalid student ID");
      }

      filter.studentId = req.query.studentId;
    }

    const payments = await populatePayment(
      Payment.find(filter).sort({
        createdAt: -1
      })
    );

    res.status(200).json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentById = async (
  req,
  res,
  next
) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400);
      throw new Error("Invalid payment ID");
    }

    const rawPayment = await Payment.findById(req.params.id);

    if (!rawPayment) {
      res.status(404);
      throw new Error("Payment not found");
    }

    const isOwner =
      rawPayment.studentId.toString() ===
      req.user._id.toString();

    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      res.status(403);
      throw new Error("You cannot view this payment");
    }

    const payment = await populatePayment(
      Payment.findById(req.params.id)
    );

    res.status(200).json({
      success: true,
      payment
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (
  req,
  res,
  next
) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400);
      throw new Error("Invalid payment ID");
    }

    const { status, rejectionReason } = req.body;

    if (!["paid", "rejected"].includes(status)) {
      res.status(400);
      throw new Error(
        "Payment status must be paid or rejected"
      );
    }

    if (
      status === "rejected" &&
      !rejectionReason?.trim()
    ) {
      res.status(400);
      throw new Error(
        "Rejection reason is required when rejecting a receipt"
      );
    }

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      res.status(404);
      throw new Error("Payment not found");
    }

    if (payment.status !== "pending") {
      res.status(400);
      throw new Error(
        "Only pending payments can be verified or rejected"
      );
    }

    payment.status = status;
    payment.verifiedBy = req.user._id;
    payment.verifiedAt = new Date();
    payment.rejectionReason =
      status === "rejected"
        ? rejectionReason.trim()
        : "";

    await payment.save();

    const populatedPayment = await populatePayment(
      Payment.findById(payment._id)
    );

    res.status(200).json({
      success: true,
      message:
        status === "paid"
          ? "Payment verified successfully"
          : "Payment receipt rejected",
      payment: populatedPayment
    });
  } catch (error) {
    next(error);
  }
};