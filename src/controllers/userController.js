const dbConnection = require("../database");
const crypto = require("crypto");

async function getPublicKeybyEmail(req, res) {
  console.log(req.body);
  if (!req || !req.body || !req.body.email) {
    res.status(500).json({ message: "Invalid input" });
    return;
  }
  try {
    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        "SELECT * FROM users WHERE email = $1",
        [req.body.email],
        (error, result, field) => {
          if (error) {
            res.status(500).json({ message: error.message });
            return;
          }
          resolve(result.rows[0]);
        }
      );
    });
    return res.send({
      status: true,
      responseMessage: response.publicKey,
      publicKey: response.publickey,
    });
  } catch {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
}
async function getPublicKeybyUserId(req, res) {
  console.log(req.body);
  if (!req || !req.body || !req.body.userId) {
    res.status(500).json({ message: "Invalid input" });
    return;
  }
  try {
    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        "SELECT * FROM users WHERE userId = $1",
        [req.body.userId],
        (error, result, field) => {
          if (error) {
            res.status(500).json({ message: error.message });
            return;
          }
          resolve(result.rows[0]);
        }
      );
    });
    return res.send({
      status: true,
      responseMessage: response.publicKey,
      publicKey: response.publickey,
    });
  } catch {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
}
//

module.exports = {
  getPublicKeybyEmail,
  getPublicKeybyUserId,
};
