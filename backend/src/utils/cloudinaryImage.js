const cloudinary = require("../config/cloudinary");

/**
 * Envia um buffer de imagem para o Cloudinary e retorna a URL segura.
 * @param {Buffer} buffer
 * @param {string} mimetype - ex.: image/jpeg
 * @param {{ folder?: string, public_id?: string, overwrite?: boolean }} [options]
 */
async function uploadImageBuffer(buffer, mimetype = "image/jpeg", options = {}) {
  const folder = options.folder || "agenda_online/avatars";
  const uploadOpts = {
    folder,
    resource_type: "image",
    overwrite: options.overwrite ?? false,
  };
  if (options.public_id) {
    uploadOpts.public_id = options.public_id;
  }
  const dataUri = `data:${mimetype};base64,${buffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, uploadOpts);
  return result.secure_url;
}

module.exports = { uploadImageBuffer };
