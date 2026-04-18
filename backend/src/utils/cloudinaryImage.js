const cloudinary = require("../config/cloudinary");

/**
 * Envia um buffer de imagem para o Cloudinary e retorna a URL segura.
 * @param {Buffer} buffer
 * @param {string} mimetype - ex.: image/jpeg
 * @param {{ folder?: string }} [options]
 */
async function uploadImageBuffer(buffer, mimetype = "image/jpeg", options = {}) {
  const folder = options.folder || "jm_lanches/produtos";
  const dataUri = `data:${mimetype};base64,${buffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: "image",
    overwrite: true,
  });
  return result.secure_url;
}

module.exports = { uploadImageBuffer };
