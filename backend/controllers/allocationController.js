import mongoose from "mongoose";

import Allocation from "../models/Allocation.js";
import Application from "../models/Application.js";
import Room from "../models/Room.js";

const populateAllocation = (query) => {
  return query
    .populate(
      "studentId",
      "name email studentId phone address"
    )
    .populate({
      path: "roomId",
      select:
        "roomNumber roomType floor capacity occupiedBeds status hostelId",
      populate: {
        path: "hostelId",
        select: "name location gender"
      }
    })
    .populate(
      "applicationId",
      "academicYear preferredRoomType status"
    )
    .populate("allocatedBy", "name email");
};

export const createAllocation = async (
  req,
  res,
  next
) => {
  const session = await mongoose.startSession();

  try {
    const {
      applicationId,
      roomId,
      bedNumber,
      startDate,
      endDate
    } = req.body;

    if (
      !applicationId ||
      !roomId ||
      bedNumber === undefined ||
      !startDate ||
      !endDate
    ) {
      res.status(400);
      throw new Error(
        "Application, room, bed number, start date and end date are required"
      );
    }

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      res.status(400);
      throw new Error("Invalid application ID");
    }

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      res.status(400);
      throw new Error("Invalid room ID");
    }

    const numericBedNumber = Number(bedNumber);

    if (
      !Number.isInteger(numericBedNumber) ||
      numericBedNumber < 1
    ) {
      res.status(400);
      throw new Error("Bed number must be a positive whole number");
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (
      Number.isNaN(parsedStartDate.getTime()) ||
      Number.isNaN(parsedEndDate.getTime())
    ) {
      res.status(400);
      throw new Error("Invalid start date or end date");
    }

    if (parsedEndDate <= parsedStartDate) {
      res.status(400);
      throw new Error("End date must be after start date");
    }

    let allocationId;

    await session.withTransaction(async () => {
      const application = await Application.findById(
        applicationId
      ).session(session);

      if (!application) {
        res.status(404);
        throw new Error("Application not found");
      }

      if (application.status !== "approved") {
        res.status(400);
        throw new Error(
          "Only approved applications can receive room allocations"
        );
      }

      const existingApplicationAllocation =
        await Allocation.findOne({
          applicationId
        }).session(session);

      if (existingApplicationAllocation) {
        res.status(409);
        throw new Error(
          "This application already has an allocation"
        );
      }

      const existingStudentAllocation =
        await Allocation.findOne({
          studentId: application.studentId,
          status: "active"
        }).session(session);

      if (existingStudentAllocation) {
        res.status(409);
        throw new Error(
          "This student already has an active room allocation"
        );
      }

      const room = await Room.findById(roomId).session(session);

      if (!room) {
        res.status(404);
        throw new Error("Room not found");
      }

      if (
        room.hostelId.toString() !==
        application.hostelId.toString()
      ) {
        res.status(400);
        throw new Error(
          "The selected room does not belong to the hostel in the application"
        );
      }

      if (
        room.roomType !== application.preferredRoomType
      ) {
        res.status(400);
        throw new Error(
          "The selected room does not match the preferred room type"
        );
      }

      if (room.status !== "available") {
        res.status(400);
        throw new Error("The selected room is not available");
      }

      if (room.occupiedBeds >= room.capacity) {
        res.status(400);
        throw new Error("The selected room is full");
      }

      if (numericBedNumber > room.capacity) {
        res.status(400);
        throw new Error(
          `Bed number must be between 1 and ${room.capacity}`
        );
      }

      const existingBedAllocation = await Allocation.findOne({
        roomId,
        bedNumber: numericBedNumber,
        status: "active"
      }).session(session);

      if (existingBedAllocation) {
        res.status(409);
        throw new Error(
          `Bed number ${numericBedNumber} is already occupied`
        );
      }

      const createdAllocations = await Allocation.create(
        [
          {
            applicationId,
            studentId: application.studentId,
            roomId,
            bedNumber: numericBedNumber,
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            status: "active",
            allocatedBy: req.user._id
          }
        ],
        {
          session
        }
      );

      room.occupiedBeds += 1;

      room.status =
        room.occupiedBeds >= room.capacity
          ? "full"
          : "available";

      await room.save({
        session
      });

      allocationId = createdAllocations[0]._id;
    });

    const allocation = await populateAllocation(
      Allocation.findById(allocationId)
    );

    res.status(201).json({
      success: true,
      message: "Room and bed allocated successfully",
      allocation
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(409);
      error.message =
        "The student, application or selected bed already has an active allocation";
    }

    next(error);
  } finally {
    await session.endSession();
  }
};

export const getMyAllocation = async (
  req,
  res,
  next
) => {
  try {
    const allocation = await populateAllocation(
      Allocation.findOne({
        studentId: req.user._id,
        status: "active"
      })
    );

    if (!allocation) {
      res.status(404);
      throw new Error(
        "You do not currently have an active room allocation"
      );
    }

    res.status(200).json({
      success: true,
      allocation
    });
  } catch (error) {
    next(error);
  }
};

export const getMyAllocationHistory = async (
  req,
  res,
  next
) => {
  try {
    const allocations = await populateAllocation(
      Allocation.find({
        studentId: req.user._id
      }).sort({
        createdAt: -1
      })
    );

    res.status(200).json({
      success: true,
      count: allocations.length,
      allocations
    });
  } catch (error) {
    next(error);
  }
};

export const getAllAllocations = async (
  req,
  res,
  next
) => {
  try {
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status.toLowerCase();
    }

    if (req.query.roomId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.roomId)) {
        res.status(400);
        throw new Error("Invalid room ID");
      }

      filter.roomId = req.query.roomId;
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

    const allocations = await populateAllocation(
      Allocation.find(filter).sort({
        createdAt: -1
      })
    );

    res.status(200).json({
      success: true,
      count: allocations.length,
      allocations
    });
  } catch (error) {
    next(error);
  }
};

export const getAllocationById = async (
  req,
  res,
  next
) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400);
      throw new Error("Invalid allocation ID");
    }

    const rawAllocation = await Allocation.findById(
      req.params.id
    );

    if (!rawAllocation) {
      res.status(404);
      throw new Error("Allocation not found");
    }

    const isOwner =
      rawAllocation.studentId.toString() ===
      req.user._id.toString();

    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      res.status(403);
      throw new Error(
        "You cannot view this room allocation"
      );
    }

    const allocation = await populateAllocation(
      Allocation.findById(req.params.id)
    );

    res.status(200).json({
      success: true,
      allocation
    });
  } catch (error) {
    next(error);
  }
};

export const endAllocation = async (
  req,
  res,
  next
) => {
  const session = await mongoose.startSession();

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400);
      throw new Error("Invalid allocation ID");
    }

    const { status, endReason } = req.body;

    if (!["completed", "cancelled"].includes(status)) {
      res.status(400);
      throw new Error(
        "Status must be completed or cancelled"
      );
    }

    await session.withTransaction(async () => {
      const allocation = await Allocation.findById(
        req.params.id
      ).session(session);

      if (!allocation) {
        res.status(404);
        throw new Error("Allocation not found");
      }

      if (allocation.status !== "active") {
        res.status(400);
        throw new Error(
          "Only active allocations can be ended"
        );
      }

      const room = await Room.findById(
        allocation.roomId
      ).session(session);

      if (!room) {
        res.status(404);
        throw new Error("Allocated room not found");
      }

      allocation.status = status;
      allocation.completedAt = new Date();
      allocation.endReason = endReason?.trim() || "";

      await allocation.save({
        session
      });

      room.occupiedBeds = Math.max(
        room.occupiedBeds - 1,
        0
      );

      if (
        !["maintenance", "inactive"].includes(room.status)
      ) {
        room.status = "available";
      }

      await room.save({
        session
      });
    });

    const allocation = await populateAllocation(
      Allocation.findById(req.params.id)
    );

    res.status(200).json({
      success: true,
      message: `Allocation ${status} successfully`,
      allocation
    });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
};