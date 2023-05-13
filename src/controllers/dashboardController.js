const uuid = require("uuid");
const bcrypt = require("bcrypt");
const dbConnection = require("../database");
const { ServerEnum } = require("../../ServerEnum");

async function getAllTeachers(req, res) {
  const teacher = ServerEnum.TEACHER;
  try {
    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        "SELECT * FROM users WHERE type = $1",
        [teacher],
        (error, result, field) => {
          if (error) {
            res.status(500).json({ message: error.message });
            return;
          }
          resolve(result.rows);
        }
      );
    });
    response.forEach((element) => {});
    return res.send({
      status: true,
      responseMessage: "All teachers",
      response: response,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
}
async function getAllStaff(req, res) {
  const staff = ServerEnum.STAFF;
  try {
    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        "SELECT * FROM users WHERE type = $1",
        [staff],
        (error, result, field) => {
          if (error) {
            res.status(500).json({ message: error.message });
            return;
          }
          resolve(result.rows);
        }
      );
    });
    return res.send({
      status: true,
      responseMessage: "All Staff",
      response: response,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
}
async function getAllTeachersAndStaff(req, res) {
  const staff = ServerEnum.STAFF;
  const teacher = ServerEnum.TEACHER;
  try {
    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        "SELECT * FROM users WHERE type = $1 OR type = $2",
        [staff, teacher],
        (error, result, field) => {
          if (error) {
            res.status(500).json({ message: error.message });
            return;
          }
          resolve(result.rows);
        }
      );
    });
    return res.send({
      status: true,
      responseMessage: "All teachers ans  Staff",
      response: response,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
}

async function dropTables() {
  try {
    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        "DROP TABLE IF EXISTS admins;DROP TABLE IF EXISTS review;DROP TABLE IF EXISTS rating;DROP TABLE IF EXISTS users;",

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
        `CREATE TABLE admins (
          adminId uuid PRIMARY KEY NOT NULL,
          name varchar(255) NOT NULL,
          email varchar(255) NOT NULL,
          password varchar(255) NOT NULL
        );
        CREATE TABLE users (
          userId uuid NOT NULL,
          firstName varchar(255) NOT NULL,
          lastName varchar(255) DEFAULT NULL,
          email varchar(255) NOT NULL,
          password varchar(255) NOT NULL,
          mobile varchar(255) NOT NULL,
          type varchar(255) NOT NULL,
          publickey varchar(1024) NOT NULL,
          privatekey varchar(16384) NOT NULL,
          showRating char(2) NOT NULL DEFAULT 0,
          designation varchar(255) NOT NULL,
          department varchar(255) NOT NULL,
          PRIMARY KEY (userId),
          UNIQUE (email)
        );
        CREATE TABLE review (
          reviewId uuid PRIMARY KEY NOT NULL,
          reviewerId uuid NOT NULL,
          revieweeEmail varchar(255) NULL,
          reviewText varchar(255) NULL,
          isDeleted char(2) NOT NULL,
          isAnonymous char(2) NOT NULL,
          date varchar(255) NULL,
          FOREIGN KEY (reviewerId) REFERENCES users(userId),
          FOREIGN KEY (revieweeEmail) REFERENCES users(email)
        );
        CREATE TABLE rating (
          ratingId uuid PRIMARY KEY NOT NULL,
          reviewerId uuid NOT NULL,
          revieweeEmail varchar(255) NOT NULL,
          responsibility char(36) NOT NULL,
          behaviour char(36) NULL,
          professionalism char(36) NOT NULL,
          proficiency char(36) NOT NULL,
          management char(36) NOT NULL,
          average char(36) NOT NULL,
          isDeleted char(2) NOT NULL,
          FOREIGN KEY (reviewerId) REFERENCES users(userId),
          FOREIGN KEY (revieweeEmail) REFERENCES users(email)
        );`,
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
    const password = "123456";
    const name = "ADMIN";
    const email = "admin@sqorerlite.com";
    await new Promise((resolve, reject) => {
      bcrypt.hash(password, 10, (err, hash) => {
        dbConnection.query(
          `INSERT INTO admins 
            (adminId, name, email, password)
            VALUES ($1, $2, $3, $4)`,
          [adminId, name, email, hash],
          (error, result, field) => {
            if (error) {
              console.log(error);
              return;
            }
            return res.send({
              status: true,
              responseMessage: "database commit",
            });
          }
        );
      });
    });
    return res.send({
      status: true,
      responseMessage: "database commit",
    });
  } catch (e) {
    console.log(e);
  }
}

module.exports = {
  getAllTeachers,
  databaseCommit,
  dropTables,
  getAllStaff,
  getAllTeachersAndStaff,
};
