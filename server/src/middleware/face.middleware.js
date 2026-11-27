import { faceEnrollmentRequired } from "../services/face.service.js";

// Every account must have a face photo on file for identity verification before using
// the modules. Sign-in, profile and the face upload itself stay available (they live under /auth).
// Set FACE_ENROLLMENT_REQUIRED=false to switch this off.
export const requireFaceEnrollment = (req, res, next) => {
  if (req.user && faceEnrollmentRequired(req.user)) {
    return res.status(403).json({
      message: "Please register your face photo to continue.",
      code: "FACE_ENROLLMENT_REQUIRED",
    });
  }
  next();
};
