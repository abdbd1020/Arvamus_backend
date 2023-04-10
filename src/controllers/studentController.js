const uuid = require('uuid');
const bcrypt = require('bcrypt');
const dbConnection = require('../database');
const { ServerEnum } = require('../../ServerEnum');
const { sendMail } = require('./mail');

async function getAllStudent(req, res) {
  try {
    const list = await new Promise((resolve, reject) => {
      dbConnection.query(
        'SELECT s.userId, s.firstName, s.lastName, s.email, s.mobile, s.country, s.status, t.firstName AS teacherFirstName, t.lastName AS teacherLastName FROM users  ',

        (error, result, field) => {
          if (error) {
            res.status(401).json({ message: error });
            return;
          }
          console.log(result);
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

async function getNumberOfStudents(req, res) {
  try {
    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        'SELECT status, COUNT(*) AS totalStudent FROM users WHERE type = ? GROUP BY status',
        [ServerEnum.STUDENT],
        (error, result, field) => {
          if (error) {
            res.status(401).json({ message: error });
            return;
          }
          console.log(result);
          resolve(result);
        }
      );
    });
    return res.send({
      data: response,
      status: true,
      responseMessage: 'Access Requests sent',
    });
  } catch (e) {
    console.log(e);
  }
}

async function inviteStudent(req, res) {
  try {
    const { teacherEmail, studentEmail } = req.body;
    const checkStudent = await new Promise((resolve, reject) => {
      dbConnection.query(
        'SELECT * FROM users WHERE type = ? AND email = ?',
        [ServerEnum.STUDENT, studentEmail],
        (error, result, field) => {
          if (error) {
            res.status(401).json({ message: error });
            return;
          }
          console.log(result);
          if (result.length > 0) {
            return res.send({
              status: false,
              responseMessage: 'Student already exists',
            });
          }
          resolve(result);
        }
      );
    });
    const checkTeacher = await new Promise((resolve, reject) => {
      dbConnection.query(
        'SELECT * FROM users WHERE type = ? AND email = ?',
        [ServerEnum.TEACHER, teacherEmail],
        (error, result, field) => {
          if (error) {
            res.status(401).json({ message: error });
            return;
          }
          console.log(result);
          if (result.length === 0) {
            return res.send({
              status: false,
              responseMessage: 'Teacher does not exist',
            });
          }
          resolve(result[0]);
        }
      );
    });

    const userId = uuid.v1();
    const password = '123456';

    await new Promise((resolve, reject) => {
      bcrypt.hash(password, 10, (err, hash) => {
        dbConnection.query(
          `INSERT INTO users 
            (userId, firstName, lastName, email, mobile, country, type, password, status)
                VALUES (?,?,?,?,?,?,?,?,?) `,
          [
            userId,
            '',
            '',
            studentEmail,
            '',
            '',
            ServerEnum.STUDENT,
            hash,
            ServerEnum.STATUS_ACTIVE,
          ],
          (error, result, field) => {
            if (error) {
              res.status(401).json({ message: error });
              return;
            }
            resolve();
          }
        );
      });
    });

    await new Promise((resolve, reject) => {
      bcrypt.hash(password, 10, (err, hash) => {
        dbConnection.query(
          `INSERT INTO classroom 
            (teacherId, studentId, score, questions)
                VALUES (?,?,?,?) `,
          [checkTeacher.userId, userId, 0, 0],
          (error, result, field) => {
            if (error) {
              res.status(401).json({ message: error });
              return;
            }
            resolve();
          }
        );
      });
    });

    sendMail(
      studentEmail,
      'Invitation to Sqorer Lite',
      `Dear student,\n You have been invited by ${
				 teacherEmail
				 } to join Sqorer Lite, an automated Abacus practice platform.\nClick the link below or copy and paste in a browser to complete your profile.\n https://lite.sqorer.com/login \n Your temporary password to access this link is 123456 . Kindly ensure to change your password once you login.\n `
    );

    return res.send({
      status: true,
      responseMessage: 'Student stored',
    });
  } catch (e) {
    console.log(e);
  }
}

module.exports = {
  getAllStudent,
  getNumberOfStudents,
  inviteStudent,
};
