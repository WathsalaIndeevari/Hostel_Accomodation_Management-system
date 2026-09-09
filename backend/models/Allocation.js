import mongoose from "mongoose";

const allocationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      unique: true
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true
    },

    bedNumber: {
      type: Number,
      required: [true, "Bed number is required"],
      min: [1, "Bed number must be at least 1"]
    },

    startDate: {
      type: Date,
      required: [true, "Start date is required"]
    },

    endDate: {
      type: Date,
      required: [true, "End date is required"]
    },

    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active"
    },

    allocatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    completedAt: {
      type: Date,
      default: null
    },

    endReason: {
      type: String,
      trim: true,
      maxlength: [500, "End reason cannot exceed 500 characters"],
      default: ""
    }
  },
  {
    timestamps: true
  }
);

allocationSchema.index(
  {
    roomId: 1,
    bedNumber: 1
  },
  {
    unique: true,
    partialFilterExpression: {
      status: "active"
    }
  }
);

allocationSchema.index(
  {
    studentId: 1
  },
  {
    unique: true,
    partialFilterExpression: {
      status: "active"
    }
  }
);

const Allocation = mongoose.model(
  "Allocation",
  allocationSchema
);

export default Allocation;