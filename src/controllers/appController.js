const uuid = require("uuid");
const bcrypt = require("bcrypt");
const fs = require("fs");
const readline = require("readline");
const dbConnection = require("../database");
const { ServerEnum } = require("../../ServerEnum");
const { sendMail } = require("./mail");
const { getPublicPrivateKey } = require("../Security/diffieHelman");
const { encryptAES, decryptAES } = require("../Security/encryption");

// register
async function signup(req, res) {
  if (
    !req ||
    !req.body ||
    !req.body.firstName ||
    !req.body.lastName ||
    !req.body.email ||
    !req.body.password ||
    !req.body.mobile ||
    !req.body.type
  ) {
    return res.send({
      status: false,
      responseMessage: "Invalid request",
    });
  }
  try {
    // check if mail already exist
    const user = new Promise((resolve, reject) => {
      dbConnection.query(
        "SELECT * FROM users WHERE email = $1",
        [req.body.email],
        (error, result, field) => {
          if (error) {
            reject(error);
            return;
          }
          if (result.rows.length !== 0) {
            isExist = true;
            return reject({
              status: false,
              responseMessage: "Email already exists",
            });
          }
          resolve();
        }
      );
    });

    user
      .then(() => {
        // Code to execute when the promise is resolved

        const { firstName, lastName, email, password, mobile, type } = req.body;
        const userId = uuid.v4();

        let [publicKey, privatekey] = getPublicPrivateKey();
        encryptedPrivateKey = encryptAES(privatekey, password);

        bcrypt.hash(password, 10, (err, hash) => {
          dbConnection.query(
            `INSERT INTO users(userId, firstName, lastName, email, password, mobile, type, publicKey, privatekey)
            VALUES ($1, $2, $3, $4, $5, $6, $7 , $8, $9)`,
            [
              userId,
              firstName,
              lastName,
              email,
              hash,
              mobile,
              type,
              publicKey,
              encryptedPrivateKey,
            ],
            (error, result, field) => {
              if (error) {
                console.log(error);
                return;
              }
            }
          );
        });

        return res.send({
          status: true,
          responseMessage: "User storeds",
        });
      })
      .catch((error) => {
        console.log(error);
        res.status(401).json({ message: error.message });
      });
  } catch (error) {
    console.log(error);
    res.status(401).json({ message: error.message });
  }
}

// login
async function login(req, res) {
  if (!req || !req.body || !req.body.email || !req.body.password) {
    return res.send({
      status: false,
      responseMessage: "Invalid request",
    });
  }
  try {
    const { email, password } = req.body;
    const user = new Promise((resolve, reject) => {
      dbConnection.query(
        "SELECT * FROM users WHERE email = $1",
        [email],
        (error, result, field) => {
          if (error) {
            res.status(401).json({ message: error });
            return;
          }
          if (result.length === 0) {
            return res.send({
              status: false,
              responseMessage: "email does not exist",
            });
          }

          resolve(result.rows[0]);
        }
      );
    });

    user.then((user) => {
      bcrypt.compare(password, user.password, (err, result) => {
        if (result) {
          userPrivateKey = decryptAES(user.privatekey, password);
          delete user.password;

          return res.send({
            user,
            status: true,
            privatekey: userPrivateKey,
            responseMessage: "Login Successful",
          });
        }
        return res.send({
          status: false,
          responseMessage: "Password is incorrect",
        });
      });
    });
  } catch (e) {
    console.log(e);
  }
}

async function forgotPassword(req, res) {
  if (!req || !req.body || !req.body.email) {
    return res.send({
      status: false,
      responseMessage: "Invalid request",
    });
  }
  try {
    const { email } = req.body;

    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        "SELECT * FROM users WHERE email = $1",
        [email],
        (error, result, field) => {
          if (error) {
            res.status(401).json({ message: error });
            return;
          }

          if (result.length === 0) {
            return res.send({
              status: false,
              responseMessage: "User does not exist",
            });
          }
          resolve(result.rows[0]);
        }
      );
    });

    const password = Math.random().toString(36).slice(-8);

    await new Promise((resolve, reject) => {
      bcrypt.hash(password, 10, (err, hash) => {
        dbConnection.query(
          "UPDATE users SET password = $1 WHERE email = $2",
          [hash, email],
          (error, result, field) => {
            if (error) {
              res.status(401).json({
                message: error,
              });
              return;
            }
            resolve();
          }
        );
      });

      const snedMailResponse = sendMail(
        email,
        "Password reset",
        `Your password has been reset.\nNew password is: ${password}\nKindly ensure to change your password once you login.\n `
      );
      console.log(snedMailResponse);
      if (!snedMailResponse) {
        return res.send({
          status: false,
          responseMessage: "Error while sending mail",
        });
      }

      return res.send({
        status: true,
        responseMessage: "Password Reset Successfully",
      });
    });
  } catch (e) {
    console.log(e);
  }
}

async function changePassword(req, res) {
  try {
    const { userId, oldPassword, newPassword } = req.body;

    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        "SELECT * FROM users WHERE userId = $1",
        [userId],
        (error, result, field) => {
          if (error) {
            res.status(401).json({ message: error });
            return;
          }

          if (result.length === 0) {
            return res.send({
              status: false,
              responseMessage: "User does not exist",
            });
          }
          resolve(result.rows[0]);
        }
      );
    });
    previousPrivateKey = decryptAES(response.privatekey, oldPassword);
    newEncryptedPrivateKey = encryptAES(previousPrivateKey, newPassword);
    bcrypt.compare(oldPassword, response.password, async (err, result) => {
      if (result) {
        await new Promise((resolve, reject) => {
          bcrypt.hash(newPassword, 10, (err, hash) => {
            dbConnection.query(
              "UPDATE users SET password = $1,privatekey = $2  WHERE userId = $3 ",
              [hash, newEncryptedPrivateKey, userId],
              (error, result, field) => {
                if (error) {
                  res.status(401).json({
                    message: error,
                  });
                  return;
                }
                resolve();
              }
            );
          });
          return res.send({
            status: true,
            responseMessage: "Password Changed Successfully",
          });
        });
      } else {
        return res.send({
          status: false,
          responseMessage: "Password does not match.",
        });
      }
    });
  } catch (e) {
    console.log(e);
  }
}

async function updateInfo(req, res) {
  try {
    const { userId, firstName, lastName, mobile } = req.body;

    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        "SELECT * FROM users WHERE userId = $1",
        [userId],
        (error, result, field) => {
          if (error) {
            res.status(401).json({ message: error });
            return;
          }

          if (result.length === 0) {
            return res.send({
              status: false,
              responseMessage: "User does not exist",
            });
          }
          resolve(result.rows[0]);
        }
      );
    });

    await new Promise((resolve, reject) => {
      dbConnection.query(
        "UPDATE users SET firstName = $1, lastName = $2, mobile = $3 WHERE userId = $4",
        [firstName, lastName, mobile, userId],
        (error, result, field) => {
          if (error) {
            res.status(401).json({
              message: error,
            });
            return;
          }
          resolve();
        }
      );
      return res.send({
        status: true,
        responseMessage: "Update Successful",
      });
    });
  } catch (e) {
    console.log(e);
  }
}

function getRandomArbitrary(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

module.exports = {
  signup,
  login,
  changePassword,
  updateInfo,
  forgotPassword,
};
