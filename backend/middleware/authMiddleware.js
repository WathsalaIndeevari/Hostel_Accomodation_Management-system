import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization;

    if (
      !authorizationHeader ||
      !authorizationHeader.startsWith("Bearer ")
    ) {
      res.status(401);
      throw new Error("Authorization token is required");
    }

    const token = authorizationHeader.split(" ")[1];

    if (!token) {
      res.status(401);
      throw new Error("Authorization token is required");
    }

    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decodedToken.userId);

    if (!user) {
      res.status(401);
      throw new Error("User belonging to this token no longer exists");
    }

    if (!user.isActive) {
      res.status(403);
      throw new Error("Your account has been deactivated");
    }

    req.user = user;

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      res.status(401);
      return next(new Error("Invalid or expired token"));
    }

    next(error);
  }
};