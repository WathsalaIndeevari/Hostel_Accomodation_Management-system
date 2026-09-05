import mongoose from "mongoose";
import Hostel from "../models/Hostel.js";

export const createHostel = async (req, res, next) => {
  try {
    const {
      name,
      location,
      gender,
      capacity,
      description,
      facilities,
      image,
      status
    } = req.body;

    if (!name || !location || !gender || capacity === undefined) {
      res.status(400);
      throw new Error(
        "Name, location, gender and capacity are required"
      );
    }

    const numericCapacity = Number(capacity);

    if (!Number.isInteger(numericCapacity) || numericCapacity < 1) {
      res.status(400);
      throw new Error("Capacity must be a positive whole number");
    }

    const existingHostel = await Hostel.findOne({
      name: {
        $regex: `^${escapeRegex(name.trim())}$`,
        $options: "i"
      }
    });

    if (existingHostel) {
      res.status(409);
      throw new Error("A hostel with this name already exists");
    }

    const hostel = await Hostel.create({
      name: name.trim(),
      location: location.trim(),
      gender: gender.toLowerCase(),
      capacity: numericCapacity,
      description: description?.trim() || "",
      facilities: cleanFacilities(facilities),
      image: image?.trim() || "",
      status: status || "active",
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: "Hostel created successfully",
      hostel
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(409);
      error.message = "A hostel with this name already exists";
    }

    next(error);
  }
};

export const getActiveHostels = async (req, res, next) => {
  try {
    const filter = {
      status: "active"
    };

    if (req.query.gender) {
      filter.gender = req.query.gender.toLowerCase();
    }

    if (req.query.location) {
      filter.location = {
        $regex: escapeRegex(req.query.location),
        $options: "i"
      };
    }

    if (req.query.search) {
      const search = escapeRegex(req.query.search);

      filter.$or = [
        {
          name: {
            $regex: search,
            $options: "i"
          }
        },
        {
          location: {
            $regex: search,
            $options: "i"
          }
        },
        {
          description: {
            $regex: search,
            $options: "i"
          }
        }
      ];
    }

    const hostels = await Hostel.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: hostels.length,
      hostels
    });
  } catch (error) {
    next(error);
  }
};

export const getAllHostelsAdmin = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status.toLowerCase();
    }

    if (req.query.gender) {
      filter.gender = req.query.gender.toLowerCase();
    }

    if (req.query.search) {
      const search = escapeRegex(req.query.search);

      filter.$or = [
        {
          name: {
            $regex: search,
            $options: "i"
          }
        },
        {
          location: {
            $regex: search,
            $options: "i"
          }
        }
      ];
    }

    const hostels = await Hostel.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: hostels.length,
      hostels
    });
  } catch (error) {
    next(error);
  }
};

export const getHostelById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400);
      throw new Error("Invalid hostel ID");
    }

    const hostel = await Hostel.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );

    if (!hostel) {
      res.status(404);
      throw new Error("Hostel not found");
    }

    res.status(200).json({
      success: true,
      hostel
    });
  } catch (error) {
    next(error);
  }
};

export const updateHostel = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400);
      throw new Error("Invalid hostel ID");
    }

    const hostel = await Hostel.findById(req.params.id);

    if (!hostel) {
      res.status(404);
      throw new Error("Hostel not found");
    }

    if (req.body.name !== undefined) {
      const name = req.body.name.trim();

      if (!name) {
        res.status(400);
        throw new Error("Hostel name cannot be empty");
      }

      const duplicateHostel = await Hostel.findOne({
        _id: {
          $ne: hostel._id
        },
        name: {
          $regex: `^${escapeRegex(name)}$`,
          $options: "i"
        }
      });

      if (duplicateHostel) {
        res.status(409);
        throw new Error("A hostel with this name already exists");
      }

      hostel.name = name;
    }

    if (req.body.location !== undefined) {
      hostel.location = req.body.location.trim();
    }

    if (req.body.gender !== undefined) {
      hostel.gender = req.body.gender.toLowerCase();
    }

    if (req.body.capacity !== undefined) {
      const numericCapacity = Number(req.body.capacity);

      if (!Number.isInteger(numericCapacity) || numericCapacity < 1) {
        res.status(400);
        throw new Error("Capacity must be a positive whole number");
      }

      hostel.capacity = numericCapacity;
    }

    if (req.body.description !== undefined) {
      hostel.description = req.body.description.trim();
    }

    if (req.body.facilities !== undefined) {
      hostel.facilities = cleanFacilities(req.body.facilities);
    }

    if (req.body.image !== undefined) {
      hostel.image = req.body.image.trim();
    }

    if (req.body.status !== undefined) {
      hostel.status = req.body.status.toLowerCase();
    }

    await hostel.save();

    res.status(200).json({
      success: true,
      message: "Hostel updated successfully",
      hostel
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(409);
      error.message = "A hostel with this name already exists";
    }

    next(error);
  }
};

export const deactivateHostel = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400);
      throw new Error("Invalid hostel ID");
    }

    const hostel = await Hostel.findById(req.params.id);

    if (!hostel) {
      res.status(404);
      throw new Error("Hostel not found");
    }

    hostel.status = "inactive";
    await hostel.save();

    res.status(200).json({
      success: true,
      message: "Hostel deactivated successfully",
      hostel
    });
  } catch (error) {
    next(error);
  }
};

const cleanFacilities = (facilities) => {
  if (!facilities) {
    return [];
  }

  if (!Array.isArray(facilities)) {
    return [];
  }

  return facilities
    .map((facility) => String(facility).trim())
    .filter((facility) => facility !== "");
};

const escapeRegex = (value) => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};