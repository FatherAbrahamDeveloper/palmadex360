import jwt from "jsonwebtoken";

// Short-lived signed links, so <img>, <iframe> and download links work without exposing files publicly.
const SIGNED_URL_TTL = "30m";

export const signFileUrl = (fileId, userId) => {
  const sig = jwt.sign({ fid: fileId, uid: userId, purpose: "file" }, process.env.JWT_SECRET, { expiresIn: SIGNED_URL_TTL });
  return `/api/v1/files/${fileId}/content?sig=${sig}`;
};

export const toFileDto = (file, userId) => ({ ...file, url: signFileUrl(file.id, userId) });
