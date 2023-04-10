/* eslint-disable quotes */
const mysql = require("mysql2");

const host = "localhost";
const user = "root";
const password = "password";
const database = "arvamus"

const pool = mysql.createPool({
  host,
  user,
  password,
  database,
  debug: false,
  multipleStatements: true,
});

module.exports = {
  query() {
    let sql_args = [];
    const args = [];
    for (let i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    const callback = args[args.length - 1]; // last arg is callback
    pool.getConnection((err, connection) => {
      if (err) {
        console.log(err);
        return callback(err);
      }
      if (args.length > 2) {
        sql_args = args[1];
      }
      connection.query(args[0], sql_args, (err, results) => {
        connection.release(); // always put connection back in pool after last query
        if (err) {
          console.log(err);
          return callback(err);
        }
        callback(null, results);
      });
    });
  },
};
