import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: [true, "Hostel ID is required"]
    },

    roomNumber: {
      type: String,
      required: [true, "Room number is required"],
      trim: true,
      maxlength: [20, "Room number cannot exceed 20 characters"]
    },

    roomType: {
      type: String,
      required: [true, "Room type is required"],
      enum: ["single", "double", "triple", "shared"]
    },

    floor: {
      type: String,
      required: [true, "Floor is required"],
      trim: true
    },

    capacity: {
      type: Number,
      required: [true, "Room capacity is required"],
      min: [1, "Room capacity must be at least 1"]
    },

    occupiedBeds: {
      type: Number,
      default: 0,
      min: [0, "Occupied beds cannot be negative"]
    },

    status: {
      type: String,
      enum: ["available", "full", "maintenance", "inactive"],
      default: "available"
    },

    facilities: [
      {
        type: String,
        trim: true
      }
    ],

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: ""
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true
    },
    toObject: {
      virtuals: true
    }
  }
);

roomSchema.index(
  {
    hostelId: 1,
    roomNumber: 1
  },
  {
    unique: true
  }
);

roomSchema.virtual("availableBeds").get(function () {
  return Math.max(this.capacity - this.occupiedBeds, 0);
});

const Room = mongoose.model("Room", roomSchema);

export default Room;