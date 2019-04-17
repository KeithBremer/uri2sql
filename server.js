//
// This server file is used as a testbed for the uri2sql function
// and serves no other purpose. It can be adapted to your own
// database configuration if you want.
//
const express = require("express");
const app = express();
const Pool = require('pg').Pool;
const bodyParser = require('body-parser');

const uri2sql = require('./uri2sql.js').uri2sql;
const setsubs = require('./uri2sql.js').setsubs;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//
// The following would probably be placed in a separate file that
// is excluded from GitHub to protect the database access information.
// For the purposes of this demonstration I've allowed it to remain
// in this file.
//
const db = new Pool({
  user: 'keith',
  host: 'localhost',
  database: 'keith',
  password: 'cyf',
  port: 5432
});

setsubs("$");

app.get("/customers", function(req, res) {
  console.log(req.query);
  let columns = [];
  let filtr;
  db.query("SELECT column_name" +
           "  FROM information_schema.columns" +
           "  WHERE table_name = 'customers'",
    function(err, result) {
      if (err == null) {
        columns = result.rows;
      }
      //console.log(req.url);
      //console.log(req.query);
      try {
        filtr = uri2sql(req.query, columns);
      }
      catch (e) {
        console.log(e)
        res.status(400).json(e);
        return;
      }
      //console.log(filtr.sql);
      //console.log(filtr.values)
      db.query("SELECT * FROM customers " + filtr.sql, filtr.values,
        function(err, result) {
          // console.log(result.rows);
          res.status(200).json(result.rows)
        });
    })
});

app.get("/reservations", function(req, res) {
  // console.log(req.url);
  // console.log(req.query);
  let columns = [];
  let filtr;
  db.query("SELECT column_name" +
           "  FROM information_schema.columns" +
           "  WHERE table_name = 'reservations'",
    function(err, result) {
      if (err == null) {
        columns = result.rows;
      }
      try {
        filtr = uri2sql(req.query, columns);
      }
      catch (e) {
        console.log(e)
        res.status(400).json(e);
        return;
      }
      // console.log(filtr.sql);
      // console.log(filtr.values)
      db.query("SELECT * FROM reservations " + filtr.sql, filtr.values,
        function(err, result) {
          res.status(200).json(result.rows)
        });
    });
});

//
// Start the server
//
app.listen(3001, function() {
  console.log("Server started on port 3001.");
});
