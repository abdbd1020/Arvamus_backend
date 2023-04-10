const uuid = require('uuid');
const bcrypt = require('bcrypt');
const dbConnection = require('../database');
const { ServerEnum } = require('../../ServerEnum');
const { sendMail } = require('./mail');

async function createAccessRequests(req, res) {
  console.log(req.body);
  try {
    const {
      firstName, lastName, email, message, country, mobile, type
    } =			req.body;
    const accessId = uuid.v1();

    const verifyAccess = await new Promise((resolve, reject) => {
      dbConnection.query(
        'SELECT * FROM accessrequests WHERE email = ?',
        [email],
        (error, result, field) => {
          if (error) {
            return res.status(401).json({ message: error });
          }
          if (result.length > 0) {
            return res.send({
              status: false,
              responseMessage: 'User already exists',
            });
          }
          resolve(result);
        }
      );
    });

    const verifyUser = await new Promise((resolve, reject) => {
      dbConnection.query(
        'SELECT * FROM users WHERE email = ?',
        [email],
        (error, result, field) => {
          if (error) {
            return res.status(401).json({ message: error });
          }
          if (result.length > 0) {
            return res.send({
              status: false,
              responseMessage: 'User already exists',
            });
          }
          resolve(result);
        }
      );
    });

    await new Promise((resolve, reject) => {
      dbConnection.query(
        `INSERT INTO accessrequests 
            (accessId, firstName, lastName, email, mobile, message, country, type)
                VALUES (?,?,?,?,?,?,?,?) `,
        [
          accessId,
          firstName,
          lastName,
          email,
          mobile,
          message,
          country,
          type,
        ],
        (error, result, field) => {
          if (error) {
            console.log(error);
            return res.status(401).json({ message: error });
          }
          resolve();
        }
      );
    });

    return res.send({
      status: true,
      responseMessage: 'access request saved',
    });
  } catch (e) {
    console.log(e);
  }
}

async function getAllAccessRequests(req, res) {
  try {
    const list = await new Promise((resolve, reject) => {
      dbConnection.query(
        'SELECT * FROM accessrequests',

        (error, result, field) => {
          if (error) {
            res.status(401).json({ message: error });
            return;
          }

          resolve(result);
        }
      );
    });
    return res.send({
      list,
      status: true,
      responseMessage: 'Access Requests sent',
    });
  } catch (e) {
    console.log(e);
  }
}

async function approveAccessRequest(req, res) {
  console.log(req.body);
  try {
    const {
      firstName,
      lastName,
      email,
      country,
      mobile,
      type,
      teacherEmail,
    } = req.body;
    const userId = uuid.v1();

    const verify = await new Promise((resolve, reject) => {
      dbConnection.query(
        'SELECT * FROM users WHERE email = ?',
        [email],
        (error, result, field) => {
          if (error) {
            res.status(401).json({ message: error });
            return;
          }
          if (result.length > 0) {
            return res.send({
              status: false,
              responseMessage: 'User already exists',
            });
          }
          resolve(result);
        }
      );
    });

    let teacheVerify;

    if (type === ServerEnum.STUDENT) {
      teacheVerify = await new Promise((resolve, reject) => {
        dbConnection.query(
          'SELECT * FROM users WHERE email = ?',
          [teacherEmail],
          (error, result, field) => {
            if (error) {
              res.status(401).json({ message: error });
              return;
            }
            if (result.length === 0) {
              return res.send({
                status: false,
                responseMessage: 'Teacher does not exist!',
              });
            }
            resolve(result);
          }
        );
      });
    }

    const password = '123456';

    await new Promise((resolve, reject) => {
      bcrypt.hash(password, 10, (err, hash) => {
        dbConnection.query(
          `INSERT INTO users 
            (userId, firstName, lastName, email, mobile, country, type, password, status)
                VALUES (?,?,?,?,?,?,?,?,?) `,
          [
            userId,
            firstName,
            lastName,
            email,
            mobile,
            country,
            type,
            hash,
            ServerEnum.STATUS_ACTIVE,
          ],
          async (error, result, field) => {
            if (error) {
              res.status(401).json({ message: error });
              return;
            }
            if (type === ServerEnum.STUDENT) {
              console.log(teacheVerify);
              await new Promise((resolve, reject) => {
                dbConnection.query(
                  `INSERT INTO classroom 
                    (teacherId, studentId)
                        VALUES (?,?) `,
                  [teacheVerify[0].userId, userId],
                  (error, result, field) => {
                    if (error) {
                      console.log(error);
                      res.status(401).json({
                        message: error,
                      });
                      return;
                    }
                    console.log('classroom created');

                    resolve();
                  }
                );
              });
            }
            resolve();
          }
        );
      });
    });

    await new Promise((resolve, reject) => {
      dbConnection.query(
        'DELETE FROM accessrequests WHERE email = ?',
        [email],
        (error, result, field) => {
          if (error) {
            res.status(401).json({ message: error });
            return;
          }
          console.log('deletion success');
          if (type === ServerEnum.TEACHER) {
            sendMail(
              email,
              'Invitation to MathChamp',
              ServerEnum.INVITE_TEACHER_TEXT
            );
          } else {
            sendMail(
              email,
              'Invitation to MathChamp',
              `Dear student,\n You have been invited by ${
								 teacherEmail
								 } to join MathChamp, an automated Abacus practice platform.\nClick the link below or copy and paste in a browser to complete your profile.\n https://mathchamp.in/login \n Your temporary password to access this link is 123456 . Kindly ensure to change your password once you login.\n `
            );
          }
          return res.send({
            status: true,
            responseMessage: 'Request Approved!',
          });
          resolve(result);
        }
      );
    });
  } catch (e) {
    console.log(e);
  }
}

async function rejectAccessRequest(req, res) {
  console.log(req.body);
  try {
    const { email } = req.body;

    const deletion = await new Promise((resolve, reject) => {
      dbConnection.query(
        'DELETE FROM accessrequests WHERE email = ?',
        [email],
        (error, result, field) => {
          if (error) {
            res.status(401).json({ message: error });
            return;
          }
          resolve(result);
        }
      );
    });

    return res.send({
      status: true,
      responseMessage: 'Request Rejected!',
    });
  } catch (e) {
    console.log(e);
  }
}

module.exports = {
  createAccessRequests,
  getAllAccessRequests,
  approveAccessRequest,
  rejectAccessRequest,
};
