const uuid = require("uuid");
const bcrypt = require("bcrypt");
const dbConnection = require("../database");
const { ServerEnum } = require("../../ServerEnum");

async function createAdmin(req, res) {
  console.log(req.body);
  try {
    const { currentAdminId, name, email, password } = req.body;
    const verify = await verifyAdmin(currentAdminId);
    console.log(verify);
    if (verify === false) {
      return res.send({
        status: false,
        responseMessage: "Unauthorized",
      });
    }
    const adminId = uuid.v1();

    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        "SELECT * FROM admins WHERE email = ?",
        [email],
        (error, result, field) => {
          if (error) {
            res.status(401).json({ message: error });
            return;
          }
          console.log(result);

          if (result.length > 0) {
            return res.send({
              status: false,
              responseMessage: "email already exists",
            });
          }
          resolve(result);
        }
      );
    });

    await new Promise((resolve, reject) => {
      bcrypt.hash(password, 10, (err, hash) => {
        dbConnection.query(
          `INSERT INTO admins 
            (adminId, name, email, password)
                VALUES (?,?,?,?) `,
          [adminId, name, email, hash],
          (error, result, field) => {
            if (error) {
              res.status(401).json({ message: error });
              return;
            }
            resolve();
          }
        );
      });
      return res.send({
        status: true,
        responseMessage: "admin created",
      });
    });
  } catch (e) {
    console.log(e);
  }
}

async function adminLogin(req, res) {
  console.log(req.body);
  try {
    const { email, password } = req.body;

    const admin = await new Promise((resolve, reject) => {
      dbConnection.query(
        "SELECT * FROM admins WHERE email = ?",
        [email],
        (error, result, field) => {
          if (error) {
            res.status(401).json({ message: error });
            return;
          }
          console.log(result);

          if (result.length === 0) {
            return res.send({
              status: false,
              responseMessage: "email does not exist",
            });
          }
          resolve(result[0]);
        }
      );
    });

    bcrypt.compare(password, admin.password, (err, result) => {
      if (result) {
        delete admin.password;
        admin.type = ServerEnum.ADMIN;
        return res.send({
          user: admin,
          status: true,
          responseMessage: "Login Successful",
        });
      }
      return res.send({
        status: false,
        responseMessage: "Password is incorrect",
      });
    });
  } catch (e) {
    console.log(e);
  }
}

async function adminChangePassword(req, res) {
  console.log(req.body);
  try {
    const { adminId, oldPassword, newPassword } = req.body;

    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        "SELECT * FROM admins WHERE adminId = ?",
        [adminId],
        (error, result, field) => {
          if (error) {
            res.status(401).json({ message: error });
            return;
          }
          console.log(result);

          if (result.length === 0) {
            return res.send({
              status: false,
              responseMessage: "User does not exist",
            });
          }
          resolve(result[0]);
        }
      );
    });

    bcrypt.compare(oldPassword, response.password, async (err, result) => {
      if (result) {
        await new Promise((resolve, reject) => {
          bcrypt.hash(newPassword, 10, (err, hash) => {
            dbConnection.query(
              "UPDATE admins SET password = ? WHERE adminId = ? ",
              [hash, adminId],
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

async function verifyAdmin(adminId) {
  if (adminId == null || adminId == undefined) {
    return false;
  }
  const response = await new Promise((resolve, reject) => {
    dbConnection.query(
      "SELECT * FROM admins WHERE adminId = ?",
      [adminId],
      (error, result, field) => {
        if (error) {
          return false;
        }
        console.log(result);

        if (result.length === 0) {
          return false;
        }
        resolve(result[0]);
      }
    );
  });

  return true;
}

async function changeStatus(req, res) {
  console.log(req.body);
  try {
    const { userId, status } = req.body;

    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        "SELECT * FROM users WHERE userId = ?",
        [userId],
        (error, result, field) => {
          if (error) {
            res.status(401).json({ message: error });
            return;
          }
          console.log(result);

          if (result.length === 0) {
            return res.send({
              status: false,
              responseMessage: "User does not exist",
            });
          }
          resolve(result[0]);
        }
      );
    });

    await new Promise((resolve, reject) => {
      dbConnection.query(
        "UPDATE users SET status = ? WHERE userId = ? ",
        [status, userId],
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

module.exports = {
  createAdmin,
  adminLogin,
  adminChangePassword,
  verifyAdmin,
  changeStatus,
};
