/* eslint-disable quotes */
// const mysql = require("mysql2");
const { Client,Pool } = require("pg");

// const client = new Client({
//   host    : 'localhost',
//   port    : 5432,
//   user    : 'postgres',
//   password: 'password',
//   database: 'arvamus'

// })
// client.connect()

const host = "localhost";
// const port = null;
const port = 5432;
// const user = "root";
const user = "postgres";
const password = "password";
const database = "arvamus"



const pool = new Pool({
  host,
  port,
  user,
  password,
  database,
  debug: true,
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
    pool.connect((err, connection) => {
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
