const uuid = require('uuid');
const bcrypt = require('bcrypt');
const dbConnection = require('../database');
const { ServerEnum } = require('../../ServerEnum');
const { sendMail } = require('./mail');

async function getAllTeacher(req, res) {
  try {
    const list = await new Promise((resolve, reject) => {
      dbConnection.query(
        "SELECT userId, firstName, lastName, email, mobile, country, status, type, COUNT(NOT(classroom.studentId)) AS studentNumber FROM users LEFT JOIN classroom on users.userId=classroom.teacherId WHERE type = 'TEACHER' GROUP BY userId, firstName, lastName, email, mobile, country, type",

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
      responseMessage: 'Teacher list sent',
    });
  } catch (e) {
    console.log(e);
  }
}

async function getNumberOfTeachers(req, res) {
  try {
    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        'SELECT status, COUNT(*) AS totalTeacher FROM users WHERE type = ? GROUP BY status',
        [ServerEnum.TEACHER],

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

async function inviteTeacher(req, res) {
  console.log(req.body);
  try {
    const { teacherEmail } = req.body;
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
          if (result.length > 0) {
            return res.send({
              status: false,
              responseMessage: 'Teacher already exists',
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
            teacherEmail,
            '',
            '',
            ServerEnum.TEACHER,
            hash,
            ServerEnum.STATUS_ACTIVE,
          ],
          (error, result, field) => {
            if (error) {
              console.log(error);
              res.status(401).json({ message: error });
              return;
            }
            resolve();
          }
        );
      });
    });
    sendMail(
      teacherEmail,
      'Invitation to Sqorer Lite',
      ServerEnum.INVITE_TEACHER_TEXT
    );

    return res.send({
      status: true,
      responseMessage: 'Teacher stored',
    });
  } catch (e) {
    console.log(e);
  }
}

async function getStudents(req, res) {
  const { userId } = req.body;
  try {
    const list = await new Promise((resolve, reject) => {
      dbConnection.query(
        'SELECT userId, firstName, lastName, email, mobile, country, type, classroom.score AS score, classroom.questions AS questions FROM users JOIN classroom on users.userId=classroom.studentId WHERE classroom.teacherId = ?',
        [userId],

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
      responseMessage: 'Student list sent',
    });
  } catch (e) {
    console.log(e);
  }
}

module.exports = {
  getAllTeacher,
  getNumberOfTeachers,
  inviteTeacher,
  getStudents,
};
