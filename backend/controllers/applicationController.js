import mongoose from "mongoose";

import Application from "../models/Application.js";
import Hostel from "../models/Hostel.js";
import Room from "../models/Room.js";

export const createApplication = async (req, res, next) => {
  try {
    const {
      hostelId,
      preferredRoomType,
      academicYear,
      reason
    } = req.body;

    if (
      !hostelId ||
      !preferredRoomType ||
      !academicYear ||
      !reason
    ) {
      res.status(400);
      throw new Error(
        "Hostel, preferred room type, academic year and reason are required"
      );
    }

    if (!mongoose.Types.ObjectId.isValid(hostelId)) {
      res.status(400);
      throw new Error("Invalid hostel ID");
    }

    if (!/^\d{4}\/\d{4}$/.test(academicYear.trim())) {
      res.status(400);
      throw new Error(
        "Academic year must use the format 2026/2027"
      );
    }

    const [startYear, endYear] = academicYear
      .trim()
      .split("/")
      .map(Number);

    if (endYear !== startYear + 1) {
      res.status(400);
      throw new Error(
        "The academic year must contain consecutive years"
      );
    }

    if (reason.trim().length < 10) {
      res.status(400);
      throw new Error(
        "Application reason must contain at least 10 characters"
      );
    }

    const hostel = await Hostel.findOne({
      _id: hostelId,
      status: "active"
    });

    if (!hostel) {
      res.status(404);
      throw new Error("Active hostel not found");
    }

    const allowedRoomTypes = [
      "single",
      "double",
      "triple",
      "shared"
    ];

    const normalizedRoomType =
      preferredRoomType.toLowerCase();

    if (!allowedRoomTypes.includes(normalizedRoomType)) {
      res.status(400);
      throw new Error("Invalid preferred room type");
    }

    const availableRoom = await Room.findOne({
      hostelId,
      roomType: normalizedRoomType,
      status: "available",
      $expr: {
        $lt: ["$occupiedBeds", "$capacity"]
      }
    });

    if (!availableRoom) {
      res.status(400);
      throw new Error(
        "No rooms of the selected type are currently available"
      );
    }

    const existingApplication = await Application.findOne({
      studentId: req.user._id,
      academicYear: academicYear.trim(),
      status: {
        $in: ["pending", "approved"]
      }
    });

    if (existingApplication) {
      res.status(409);
      throw new Error(
        "You already have a pending or approved application for this academic year"
      );
    }

    const application = await Application.create({
      studentId: req.user._id,
      hostelId,
      preferredRoomType: normalizedRoomType,
      academicYear: academicYear.trim(),
      reason: reason.trim()
    });

    const populatedApplication =
      await Application.findById(application._id)
        .populate(
          "studentId",
          "name email studentId phone"
        )
        .populate(
          "hostelId",
          "name location gender capacity"
        );

    res.status(201).json({
      success: true,
      message: "Accommodation application submitted successfully",
      application: populatedApplication
    });
  } catch (error) {
    next(error);
  }
};

export const getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({
      studentId: req.user._id
    })
      .populate(
        "hostelId",
        "name location gender capacity image status"
      )
      .populate("reviewedBy", "name email")
      .sort({
        createdAt: -1
      });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (error) {
    next(error);
  }
};

export const getAllApplications = async (
  req,
  res,
  next
) => {
  try {
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status.toLowerCase();
    }

    if (req.query.hostelId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.hostelId)) {
        res.status(400);
        throw new Error("Invalid hostel ID");
      }

      filter.hostelId = req.query.hostelId;
    }

    if (req.query.academicYear) {
      filter.academicYear = req.query.academicYear;
    }

    const applications = await Application.find(filter)
      .populate(
        "studentId",
        "name email studentId phone address"
      )
      .populate(
        "hostelId",
        "name location gender capacity"
      )
      .populate("reviewedBy", "name email")
      .sort({
        createdAt: -1
      });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (error) {
    next(error);
  }
};

export const getApplicationById = async (
  req,
  res,
  next
) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400);
      throw new Error("Invalid application ID");
    }

    const application = await Application.findById(
      req.params.id
    )
      .populate(
        "studentId",
        "name email studentId phone address"
      )
      .populate(
        "hostelId",
        "name location gender capacity image"
      )
      .populate("reviewedBy", "name email");

    if (!application) {
      res.status(404);
      throw new Error("Application not found");
    }

    const applicationStudentId =
      application.studentId._id.toString();

    const isOwner =
      applicationStudentId === req.user._id.toString();

    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      res.status(403);
      throw new Error(
        "You cannot view this accommodation application"
      );
    }

    res.status(200).json({
      success: true,
      application
    });
  } catch (error) {
    next(error);
  }
};

export const reviewApplication = async (
  req,
  res,
  next
) => {
  try {
    const { status, adminNote } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400);
      throw new Error("Invalid application ID");
    }

    if (!["approved", "rejected"].includes(status)) {
      res.status(400);
      throw new Error(
        "Application status must be approved or rejected"
      );
    }

    const application = await Application.findById(
      req.params.id
    );

    if (!application) {
      res.status(404);
      throw new Error("Application not found");
    }

    if (application.status !== "pending") {
      res.status(400);
      throw new Error(
        `A ${application.status} application cannot be reviewed again`
      );
    }

    if (status === "approved") {
      const availableRoom = await Room.findOne({
        hostelId: application.hostelId,
        roomType: application.preferredRoomType,
        status: "available",
        $expr: {
          $lt: ["$occupiedBeds", "$capacity"]
        }
      });

      if (!availableRoom) {
        res.status(400);
        throw new Error(
          "This application cannot be approved because no matching rooms are available"
        );
      }
    }

    application.status = status;
    application.adminNote = adminNote?.trim() || "";
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();

    await application.save();

    const populatedApplication =
      await Application.findById(application._id)
        .populate(
          "studentId",
          "name email studentId phone"
        )
        .populate(
          "hostelId",
          "name location gender capacity"
        )
        .populate("reviewedBy", "name email");

    res.status(200).json({
      success: true,
      message: `Application ${status} successfully`,
      application: populatedApplication
    });
  } catch (error) {
    next(error);
  }
};

export const cancelApplication = async (
  req,
  res,
  next
) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400);
      throw new Error("Invalid application ID");
    }

    const application = await Application.findById(
      req.params.id
    );

    if (!application) {
      res.status(404);
      throw new Error("Application not found");
    }

    if (
      application.studentId.toString() !==
      req.user._id.toString()
    ) {
      res.status(403);
      throw new Error(
        "You cannot cancel another student's application"
      );
    }

    if (application.status !== "pending") {
      res.status(400);
      throw new Error(
        "Only pending applications can be cancelled"
      );
    }

    application.status = "cancelled";
    await application.save();

    res.status(200).json({
      success: true,
      message: "Application cancelled successfully",
      application
    });
  } catch (error) {
    next(error);
  }
};