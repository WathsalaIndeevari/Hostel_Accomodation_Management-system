import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

export const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      studentId,
      phone,
      address
    } = req.body;

    if (!name || !email || !password || !studentId) {
      res.status(400);
      throw new Error(
        "Name, email, password and student ID are required"
      );
    }

    if (password.length < 6) {
      res.status(400);
      throw new Error(
        "Password must contain at least 6 characters"
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedStudentId = studentId.trim();

    const existingEmail = await User.findOne({
      email: normalizedEmail
    });

    if (existingEmail) {
      res.status(409);
      throw new Error("An account already exists with this email");
    }

    const existingStudentId = await User.findOne({
      studentId: normalizedStudentId
    });

    if (existingStudentId) {
      res.status(409);
      throw new Error("This student ID is already registered");
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      studentId: normalizedStudentId,
      phone: phone?.trim() || "",
      address: address?.trim() || "",
      role: "student"
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "Student registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        phone: user.phone,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(409);
      error.message = "Email or student ID already exists";
    }

    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error("Email and password are required");
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail
    }).select("+password");

    if (!user) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    if (!user.isActive) {
      res.status(403);
      throw new Error("Your account has been deactivated");
    }

    const passwordMatches = await user.comparePassword(password);

    if (!passwordMatches) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        phone: user.phone,
        address: user.address,
        profileImage: user.profileImage,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};