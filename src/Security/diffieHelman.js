const crypto = require("crypto");
const { ServerEnum } = require("../../ServerEnum");

const prime = ServerEnum.PRIME;
const generator = ServerEnum.GENERATOR;

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

  return bobSecretKey.toString("hex");
}

module.exports = {
  getPublicPrivateKey,
  getSharedSecretKey,
};
