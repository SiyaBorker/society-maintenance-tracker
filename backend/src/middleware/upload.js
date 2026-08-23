const multer = require('multer');
const cloudinary = require('../config/cloudinary');

// Complaint photos are buffered in memory (never written to the API
// server's disk — the backend host's filesystem is ephemeral on
// Render/Railway-style platforms) and streamed straight to Cloudinary.
//
// Uploading manually via `cloudinary.uploader.upload_stream` (rather than
// through the `multer-storage-cloudinary` bridge package) is a deliberate
// choice: that package pins a peer dependency on cloudinary@^1.x, which is
// stuck on a version with a known argument-injection advisory
// (GHSA-g4mf-96x5-5m2c) that only got fixed in cloudinary@2.7+. All of the
// upload parameters here are fixed by the server (folder, allowed formats,
// transformation) — none come from user input — so this ~15 lines of code
// let the app run the patched Cloudinary SDK without carrying an
// unmaintained bridge dependency.
const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed for complaint photos'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});

/**
 * Use after `upload.single('photo')`. If a file was uploaded, streams it to
 * Cloudinary and normalizes the result onto `req.file.path` /
 * `req.file.filename` so controllers can read them the same way they would
 * with any other multer storage engine. No-ops (calls next()) when no photo
 * was attached, since photos are optional on a complaint.
 */
function uploadPhotoToCloudinary(req, res, next) {
  if (!req.file) return next();

  const uploadStream = cloudinary.uploader.upload_stream(
    {
      folder: 'society-maintenance-tracker/complaints',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'heic'],
      transformation: [{ width: 1600, height: 1600, crop: 'limit', quality: 'auto' }],
    },
    (err, result) => {
      if (err) return next(err);
      req.file.path = result.secure_url;
      req.file.filename = result.public_id;
      next();
    }
  );

  uploadStream.end(req.file.buffer);
}

module.exports = upload;
module.exports.uploadPhotoToCloudinary = uploadPhotoToCloudinary;
