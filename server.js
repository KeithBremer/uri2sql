//
// This server file is used as a testbed for the uri2sql function
// and serves no other purpose. It can be adapted to your own
// database configuration if you want. Alternatively, you can comment
// out the database code (see comments) and just use the console.log'ged
// details to check the workings.
//
const express = require("express");
const app = express();
const Pool = require('pg').Pool;            // comment out if not using db
const bodyParser = require('body-parser');

const uri2sql = require('./uri2sql.js').uri2sql;
const setsubs = require('./uri2sql.js').setsubs;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//
// The following would probably be placed in a separate file that
// is excluded from GitHub to protect the database access information.
// For the purposes of this demonstration I've allowed it to remain
// in this file. Chenge it to suit your own environment for testing.
//
const db = new Pool({       // comment out if not using db
  user: 'keith',            // ditto
  host: 'localhost',        // ditto
  database: 'keith',        // ditto
  password: 'cyf',          // ditto
  port: 5432                // ditto
});                         // ditto

setsubs("$");

app.get("/customers", function(req, res) {
  console.log(req.query);
  let columns = [];
  let filtr;
  db.query("SELECT column_name" +                 // comment out if not using db
           "  FROM information_schema.columns" +  // ditto
           "  WHERE table_name = 'customers'",    // ditto
    function(err, result) {                       // ditto
      if (err == null) {                          // ditto
        columns = result.rows;                    // ditto
      }                                           // ditto
      console.log(req.url);
      //console.log(req.query);
      try {
        filtr = uri2sql(req.query, columns);
      }
      catch (e) {
        console.log(e)
        res.status(400).json(e);
        return;
      }
      console.log(filtr.sql);
      console.log(filtr.values);
      db.query("SELECT * FROM customers " + filtr.sql, filtr.values,  // comment out if not using db
        function(err, result) {                                       // ditto
          // console.log(result.rows);                                // ditto
          res.status(200).json(result.rows)                           // ditto
        });                                                           // ditto
    })                                                                // ditto
    // res.status(200).json(filtr)          // comment IN is not using db
});

//
// Start the server
//
app.listen(3001, function() {
  console.log("Server started on port 3001.");
});
