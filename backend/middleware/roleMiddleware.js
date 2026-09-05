export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      return next(new Error("Authentication is required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403);

      return next(
        new Error(
          `Users with the ${req.user.role} role cannot access this resource`
        )
      );
    }

    next();
  };
};