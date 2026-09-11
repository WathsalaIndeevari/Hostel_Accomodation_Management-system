import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const receiptDirectory = path.join(
  process.cwd(),
  "uploads",
  "receipts"
);

fs.mkdirSync(receiptDirectory, {
  recursive: true
});

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, receiptDirectory);
  },

  filename: (req, file, callback) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const fileName = `${Date.now()}-${crypto.randomUUID()}${extension}`;

    callback(null, fileName);
  }
});

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf"
];

const allowedExtensions = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".pdf"
];

const fileFilter = (req, file, callback) => {
  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  const validMimeType = allowedMimeTypes.includes(
    file.mimetype
  );

  const validExtension = allowedExtensions.includes(extension);

  if (validMimeType && validExtension) {
    callback(null, true);
  } else {
    callback(
      new Error(
        "Only JPG, JPEG, PNG, WEBP and PDF receipts are allowed"
      )
    );
  }
};

export const uploadReceipt = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});