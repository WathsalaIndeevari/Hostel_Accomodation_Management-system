import mongoose from "mongoose";
import Room from "../models/Room.js";
import Hostel from "../models/Hostel.js";

const cleanFacilities = (facilities) => {
  if (!Array.isArray(facilities)) {
    return [];
  }

  return facilities
    .map((facility) => String(facility).trim())
    .filter((facility) => facility !== "");
};

const getUsedHostelCapacity = async (
  hostelId,
  excludedRoomId = null
) => {
  const match = {
    hostelId: new mongoose.Types.ObjectId(hostelId),
    status: {
      $ne: "inactive"
    }
  };

  if (excludedRoomId) {
    match._id = {
      $ne: new mongoose.Types.ObjectId(excludedRoomId)
    };
  }

  const result = await Room.aggregate([
    {
      $match: match
    },
    {
      $group: {
        _id: null,
        totalCapacity: {
          $sum: "$capacity"
        }
      }
    }
  ]);

  return result.length > 0 ? result[0].totalCapacity : 0;
};

export const createRoom = async (req, res, next) => {
  try {
    const {
      hostelId,
      roomNumber,
      roomType,
      floor,
      capacity,
      facilities,
      description
    } = req.body;

    if (
      !hostelId ||
      !roomNumber ||
      !roomType ||
      !floor ||
      capacity === undefined
    ) {
      res.status(400);
      throw new Error(
        "Hostel, room number, room type, floor and capacity are required"
      );
    }

    if (!mongoose.Types.ObjectId.isValid(hostelId)) {
      res.status(400);
      throw new Error("Invalid hostel ID");
    }

    const hostel = await Hostel.findById(hostelId);

    if (!hostel) {
      res.status(404);
      throw new Error("Hostel not found");
    }

    if (hostel.status === "inactive") {
      res.status(400);
      throw new Error("Cannot add rooms to an inactive hostel");
    }

    const numericCapacity = Number(capacity);

    if (!Number.isInteger(numericCapacity) || numericCapacity < 1) {
      res.status(400);
      throw new Error("Capacity must be a positive whole number");
    }

    const existingRoom = await Room.findOne({
      hostelId,
      roomNumber: roomNumber.trim()
    });

    if (existingRoom) {
      res.status(409);
      throw new Error(
        "This room number already exists in the selected hostel"
      );
    }

    const usedCapacity = await getUsedHostelCapacity(hostelId);

    if (usedCapacity + numericCapacity > hostel.capacity) {
      res.status(400);
      throw new Error(
        `Room capacity exceeds hostel capacity. Remaining capacity: ${
          hostel.capacity - usedCapacity
        }`
      );
    }

    const room = await Room.create({
      hostelId,
      roomNumber: roomNumber.trim(),
      roomType: roomType.toLowerCase(),
      floor: floor.trim(),
      capacity: numericCapacity,
      occupiedBeds: 0,
      status: "available",
      facilities: cleanFacilities(facilities),
      description: description?.trim() || "",
      createdBy: req.user._id
    });

    const populatedRoom = await room.populate(
      "hostelId",
      "name location gender capacity status"
    );

    res.status(201).json({
      success: true,
      message: "Room created successfully",
      room: populatedRoom
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(409);
      error.message =
        "This room number already exists in the selected hostel";
    }

    next(error);
  }
};

export const getAvailableRoomsByHostel = async (
  req,
  res,
  next
) => {
  try {
    const { hostelId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(hostelId)) {
      res.status(400);
      throw new Error("Invalid hostel ID");
    }

    const hostel = await Hostel.findOne({
      _id: hostelId,
      status: "active"
    });

    if (!hostel) {
      res.status(404);
      throw new Error("Active hostel not found");
    }

    const filter = {
      hostelId,
      status: "available",
      $expr: {
        $lt: ["$occupiedBeds", "$capacity"]
      }
    };

    if (req.query.roomType) {
      filter.roomType = req.query.roomType.toLowerCase();
    }

    if (req.query.floor) {
      filter.floor = req.query.floor;
    }

    const rooms = await Room.find(filter)
      .populate("hostelId", "name location gender")
      .sort({
        floor: 1,
        roomNumber: 1
      });

    res.status(200).json({
      success: true,
      hostel: {
        id: hostel._id,
        name: hostel.name,
        location: hostel.location
      },
      count: rooms.length,
      rooms
    });
  } catch (error) {
    next(error);
  }
};

export const getAllRoomsAdmin = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.hostelId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.hostelId)) {
        res.status(400);
        throw new Error("Invalid hostel ID");
      }

      filter.hostelId = req.query.hostelId;
    }

    if (req.query.status) {
      filter.status = req.query.status.toLowerCase();
    }

    if (req.query.roomType) {
      filter.roomType = req.query.roomType.toLowerCase();
    }

    if (req.query.floor) {
      filter.floor = req.query.floor;
    }

    const rooms = await Room.find(filter)
      .populate("hostelId", "name location gender capacity")
      .populate("createdBy", "name email")
      .sort({
        createdAt: -1
      });

    res.status(200).json({
      success: true,
      count: rooms.length,
      rooms
    });
  } catch (error) {
    next(error);
  }
};

export const getRoomById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400);
      throw new Error("Invalid room ID");
    }

    const room = await Room.findById(req.params.id)
      .populate("hostelId", "name location gender capacity status")
      .populate("createdBy", "name email");

    if (!room) {
      res.status(404);
      throw new Error("Room not found");
    }

    res.status(200).json({
      success: true,
      room
    });
  } catch (error) {
    next(error);
  }
};

export const updateRoom = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400);
      throw new Error("Invalid room ID");
    }

    const room = await Room.findById(req.params.id);

    if (!room) {
      res.status(404);
      throw new Error("Room not found");
    }

    const hostel = await Hostel.findById(room.hostelId);

    if (!hostel) {
      res.status(404);
      throw new Error("Hostel not found");
    }

    if (req.body.roomNumber !== undefined) {
      const roomNumber = req.body.roomNumber.trim();

      if (!roomNumber) {
        res.status(400);
        throw new Error("Room number cannot be empty");
      }

      const existingRoom = await Room.findOne({
        _id: {
          $ne: room._id
        },
        hostelId: room.hostelId,
        roomNumber
      });

      if (existingRoom) {
        res.status(409);
        throw new Error(
          "This room number already exists in the selected hostel"
        );
      }

      room.roomNumber = roomNumber;
    }

    if (req.body.capacity !== undefined) {
      const numericCapacity = Number(req.body.capacity);

      if (!Number.isInteger(numericCapacity) || numericCapacity < 1) {
        res.status(400);
        throw new Error("Capacity must be a positive whole number");
      }

      if (numericCapacity < room.occupiedBeds) {
        res.status(400);
        throw new Error(
          `Capacity cannot be lower than occupied beds: ${room.occupiedBeds}`
        );
      }

      const usedCapacity = await getUsedHostelCapacity(
        room.hostelId.toString(),
        room._id.toString()
      );

      if (usedCapacity + numericCapacity > hostel.capacity) {
        res.status(400);
        throw new Error(
          `Updated room capacity exceeds hostel capacity. Maximum capacity allowed for this room: ${
            hostel.capacity - usedCapacity
          }`
        );
      }

      room.capacity = numericCapacity;
    }

    if (req.body.roomType !== undefined) {
      room.roomType = req.body.roomType.toLowerCase();
    }

    if (req.body.floor !== undefined) {
      room.floor = req.body.floor.trim();
    }

    if (req.body.facilities !== undefined) {
      room.facilities = cleanFacilities(req.body.facilities);
    }

    if (req.body.description !== undefined) {
      room.description = req.body.description.trim();
    }

    if (req.body.status !== undefined) {
      const newStatus = req.body.status.toLowerCase();

      if (
        ["maintenance", "inactive"].includes(newStatus) &&
        room.occupiedBeds > 0
      ) {
        res.status(400);
        throw new Error(
          "A room with occupied beds cannot be disabled or placed under maintenance"
        );
      }

      room.status = newStatus;
    }

    if (
      !["maintenance", "inactive"].includes(room.status)
    ) {
      room.status =
        room.occupiedBeds >= room.capacity
          ? "full"
          : "available";
    }

    await room.save();

    const populatedRoom = await room.populate(
      "hostelId",
      "name location gender capacity"
    );

    res.status(200).json({
      success: true,
      message: "Room updated successfully",
      room: populatedRoom
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(409);
      error.message =
        "This room number already exists in the selected hostel";
    }

    next(error);
  }
};

export const deactivateRoom = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400);
      throw new Error("Invalid room ID");
    }

    const room = await Room.findById(req.params.id);

    if (!room) {
      res.status(404);
      throw new Error("Room not found");
    }

    if (room.occupiedBeds > 0) {
      res.status(400);
      throw new Error(
        "Cannot deactivate a room that has occupied beds"
      );
    }

    room.status = "inactive";
    await room.save();

    res.status(200).json({
      success: true,
      message: "Room deactivated successfully",
      room
    });
  } catch (error) {
    next(error);
  }
};