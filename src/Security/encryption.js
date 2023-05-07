const crypto = require("crypto");

const algorithm = "aes-256-cbc";

const iv = Buffer.alloc(16); // create a buffer of 16 zero bytes

function encryptAES(text, key) {
  key = get32bytekey(key);
  let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString("hex");
}

function decryptAES(text, key) {
  key = get32bytekey(key);
  let encryptedText = Buffer.from(text, "hex");

  let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);

  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}

function get32bytekey(key) {
  if (key.length < 64) {
    let len = 64 - key.length;
    for (let i = 0; i < len; i++) {
      key += "0";
    }
  } else if (key.length > 64) {
    key = key.slice(0, 64);
  }
  key = Buffer.from(key, "hex");
  return key;
}

module.exports = {
  encryptAES,
  decryptAES,
};
