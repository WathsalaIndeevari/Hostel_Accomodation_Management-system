import mongoose from "mongoose";

const hostelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Hostel name is required"],
      trim: true,
      unique: true,
      minlength: [2, "Hostel name must contain at least 2 characters"],
      maxlength: [100, "Hostel name cannot exceed 100 characters"]
    },

    location: {
      type: String,
      required: [true, "Hostel location is required"],
      trim: true,
      maxlength: [200, "Location cannot exceed 200 characters"]
    },

    gender: {
      type: String,
      required: [true, "Hostel gender category is required"],
      enum: ["male", "female", "mixed"]
    },

    capacity: {
      type: Number,
      required: [true, "Hostel capacity is required"],
      min: [1, "Capacity must be at least 1"]
    },

    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      default: ""
    },

    facilities: [
      {
        type: String,
        trim: true
      }
    ],

    image: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      enum: ["active", "inactive", "maintenance"],
      default: "active"
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

const Hostel = mongoose.model("Hostel", hostelSchema);

export default Hostel;