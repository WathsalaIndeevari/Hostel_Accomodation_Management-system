import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    allocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Allocation",
      required: true
    },

    title: {
      type: String,
      required: [true, "Payment title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"]
    },

    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0.01, "Payment amount must be greater than zero"]
    },

    paymentType: {
      type: String,
      required: [true, "Payment type is required"],
      enum: ["deposit", "monthly", "semester", "fine", "other"]
    },

    period: {
      type: String,
      required: [true, "Payment period is required"],
      trim: true
    },

    dueDate: {
      type: Date,
      required: [true, "Due date is required"]
    },

    paymentDate: {
      type: Date,
      default: null
    },

    receiptUrl: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      enum: ["unpaid", "pending", "paid", "rejected"],
      default: "unpaid"
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    verifiedAt: {
      type: Date,
      default: null
    },

    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [500, "Rejection reason cannot exceed 500 characters"],
      default: ""
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

paymentSchema.index(
  {
    allocationId: 1,
    paymentType: 1,
    period: 1
  },
  {
    unique: true
  }
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;