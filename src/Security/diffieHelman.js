const crypto = require("crypto");
const ServerEnum = require("../../ServerEnum");

const prime =
  "ce7034ac087ac2f4a9b48b1af24741ce589d2cea3e25dc47408e0671f1a903e0bb34eeeb1f93d9e4b72498ed26e326b3980d36c497eacd042f6b0ecf4e2f942124cebf52e5ae79943bf9767f9802b6ed801876c7cec7b7fca8a2ad430afa174a15f40b3fabec5470888d8b972395cc56f6b857c05dda1c2a018b7b23c71afe37";
const generator = 2;

function getPublicPrivateKey() {
  const bob = crypto.createDiffieHellman(prime, generator);
  bob.generateKeys();

  const bobPublicKey = bob.getPublicKey();
  const bobPrivateKey = bob.getPrivateKey();

  return [bobPublicKey.toString("hex"), bobPrivateKey.toString("hex")];
}

function getSharedSecretKey(bobPrivateKey, alicePublicKey) {
  const bob = crypto.createDiffieHellman(prime, generator);
  const bobPrivateKeyBuffer = Buffer.from(bobPrivateKey, "hex");
  bob.setPrivateKey(bobPrivateKeyBuffer);

  const alicePublicKeyBuffer = Buffer.from(alicePublicKey, "hex");
  const bobSecretKey = bob.computeSecret(alicePublicKeyBuffer);

  return bobSecretKey;
}

module.exports = {
  getPublicPrivateKey,
  getSharedSecretKey,
};
