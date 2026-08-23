const { test } = require('node:test');
const assert = require('node:assert/strict');
const { PassThrough } = require('node:stream');

process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'test-cloud';
process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || 'test-key';
process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'test-secret';

const cloudinary = require('../src/config/cloudinary');
const { uploadPhotoToCloudinary } = require('../src/middleware/upload');

test('uploadPhotoToCloudinary skips straight to next() when no file was attached', () => {
  let called = false;
  const req = {};
  uploadPhotoToCloudinary(req, {}, () => {
    called = true;
  });
  assert.equal(called, true);
});

test('uploadPhotoToCloudinary sets req.file.path/filename from the Cloudinary result', () => {
  const fakeResult = { secure_url: 'https://res.cloudinary.com/test/image/upload/v1/abc.jpg', public_id: 'society-maintenance-tracker/complaints/abc' };

  // Stub the Cloudinary SDK call so this test never hits the network.
  const original = cloudinary.uploader.upload_stream;
  cloudinary.uploader.upload_stream = (_opts, callback) => {
    const stream = new PassThrough();
    stream.end = () => callback(null, fakeResult);
    return stream;
  };

  try {
    const req = { file: { buffer: Buffer.from('fake-image-bytes') } };
    let nextCalled = false;
    uploadPhotoToCloudinary(req, {}, (err) => {
      assert.equal(err, undefined);
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
    assert.equal(req.file.path, fakeResult.secure_url);
    assert.equal(req.file.filename, fakeResult.public_id);
  } finally {
    cloudinary.uploader.upload_stream = original;
  }
});

test('uploadPhotoToCloudinary forwards Cloudinary errors to next(err) instead of throwing', () => {
  const original = cloudinary.uploader.upload_stream;
  cloudinary.uploader.upload_stream = (_opts, callback) => {
    const stream = new PassThrough();
    stream.end = () => callback(new Error('cloudinary is down'));
    return stream;
  };

  try {
    const req = { file: { buffer: Buffer.from('fake-image-bytes') } };
    let receivedErr = null;
    uploadPhotoToCloudinary(req, {}, (err) => {
      receivedErr = err;
    });
    assert.equal(receivedErr?.message, 'cloudinary is down');
  } finally {
    cloudinary.uploader.upload_stream = original;
  }
});
