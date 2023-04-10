const uuid = require('uuid');
const bcrypt = require('bcrypt');
const dbConnection = require('../database');

async function getTotalCountry(req, res) {
  try {
    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        'SELECT COUNT(DISTINCT country) AS totalCountry FROM users',

        (error, result, field) => {
          if (error) {
            res.status(401).json({ message: error });
            return;
          }

          resolve(result);
        }
      );
    });
    console.log(response);
    return res.send({
      data: response,
      status: true,
      responseMessage: 'total country sent',
    });
  } catch (e) {
    console.log(e);
  }
}

async function dropTables() {
  try {
    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        'DROP TABLE IF EXISTS admins;DROP TABLE IF EXISTS classroom;DROP TABLE IF EXISTS users;DROP TABLE IF EXISTS accessrequests;DROP TABLE IF EXISTS quiz;',

        (error, result, field) => {
          if (error) {
            console.log(error);
            return;
          }
          resolve(result);
        }
      );
    });
  } catch (e) {
    console.log(e);
  }
}

async function databaseCommit(req, res) {
  try {
    await dropTables();
    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        'CREATE TABLE `admins` (`adminId` char(36) PRIMARY KEY NOT NULL,`name` varchar(255) NOT NULL,`email` varchar(255) NOT NULL,`password` varchar(255) NOT NULL) ; CREATE TABLE `users` (`userId` char(36) NOT NULL,`firstName` varchar(255) DEFAULT NULL,`lastName` varchar(255) DEFAULT NULL,`email` varchar(255) NOT NULL,`password` varchar(255) NOT NULL,`mobile` varchar(255) DEFAULT NULL,`type` varchar(255) NOT NULL) ; ALTER TABLE `users` ADD PRIMARY KEY (`userId`);CREATE TABLE `review` (`reviewId` char(36) PRIMARY KEY NOT NULL,`reviewerId` char(36) NOT NULL, `revieweeId` char(36) NULL,`revieweText` char(255) NULL, FOREIGN KEY (reviewerId) REFERENCES users(userId),FOREIGN KEY (revieweeId) REFERENCES users(userId));',

        (error, result, field) => {
          if (error) {
            res.status(401).json({ message: error });
            return;
          }

          resolve(result);
        }
      );
    });
    const adminId = uuid.v1();
    const password = '123456';
    const name = 'ADMIN';
    const email = 'admin@sqorerlite.com';

    await new Promise((resolve, reject) => {
      bcrypt.hash(password, 10, (err, hash) => {
        dbConnection.query(
          `INSERT INTO admins 
            (adminId, name, email, password)
                VALUES (?,?,?,?) `,
          [adminId, name, email, hash],
          (error, result, field) => {
            if (error) {
              console.log(error);
              return;
            }
            return res.send({
              status: true,
              responseMessage: 'database commit',
            });
          }
        );
      });
    });
    return res.send({
      status: true,
      responseMessage: 'database commit',
    });
  } catch (e) {
    console.log(e);
  }
}

module.exports = {
  getTotalCountry,
  databaseCommit,
};
