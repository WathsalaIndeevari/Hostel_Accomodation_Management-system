import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true
    },

    preferredRoomType: {
      type: String,
      required: [true, "Preferred room type is required"],
      enum: ["single", "double", "triple", "shared"]
    },

    academicYear: {
      type: String,
      required: [true, "Academic year is required"],
      trim: true,
      match: [
        /^\d{4}\/\d{4}$/,
        "Academic year must use the format 2026/2027"
      ]
    },

    reason: {
      type: String,
      required: [true, "Application reason is required"],
      trim: true,
      minlength: [10, "Reason must contain at least 10 characters"],
      maxlength: [1000, "Reason cannot exceed 1000 characters"]
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending"
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    reviewedAt: {
      type: Date,
      default: null
    },

    adminNote: {
      type: String,
      trim: true,
      maxlength: [500, "Admin note cannot exceed 500 characters"],
      default: ""
    }
  },
  {
    timestamps: true
  }
);

applicationSchema.index({
  studentId: 1,
  academicYear: 1,
  status: 1
});

const Application = mongoose.model(
  "Application",
  applicationSchema
);

export default Application;