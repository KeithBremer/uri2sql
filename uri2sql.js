
var subs = "$";       // set for PostgreSQL, use : for Oracle

function setsubs(symbol) {
  //
  // Function to change the bind variable placeholder symbol
  //
  subs = symbol;
}

function uri2sql(query, columns) {
  //
  // Function to generate an SQL predicate (WHERE clause) from an HTTP query
  // as supplied as part of the URI for an endpoint.
  // e.g. http://localhost:3000/customers?name[like]=%Jones&city=Paris
  // should produce:
  // WHERE name LIKE '%Jones' AND city = 'Paris'
  //
  // Syntax of query (following ? in the URI):
  // column=value
  // column[operator]=value
  // column[operator]=value:value:value...
  // column[-operator]=value...
  //
  // column   = name of the column in the table
  // operator = text form of a comparison operator from the following:
  //            '=' '!=' '<' '<=' '>' '>=' 'in' 'like' 'tween' 'is'
  //            the operator may be negated by prefixing with - (minus)
  // value    = a string or number or the text NULL (in upper case)
  //            for operators 'twixt' and 'in' there may be a colon-separated
  //            list of values (two for 'tween' and one or more for 'in')
  //
  // The query argument to this function is the result of using body-parser
  // to convert the URI query into JSON, so the above example would be supplied
  // as:
  // { name: {like: "%Jones"}, city: "Paris" }
  //
  
    function getValue(param) {
      //
      // Get the value part of an object's attribute in a form suitable for SQL
      // (Only NULL, strings (including date/time) and numbers are recognised at present)
      // String values are minimally sanitised (refusing any that contain ' or ;)
      //
      if (param.length == 0) {
        throw "ERROR: missing value parameter"      // no value supplied so error
      };

      var n = new Number(param);              // try a number?
      if (n instanceof Number && !isNaN(n)) { // warning - double negative!
        return n;                             // it is a number so return that
      } else if (param == "NULL") {
        return param                          // it is NULL
      } else if (typeof(param) == "string") { // if it's a string then...
        if (param.includes("'") || param.includes(";")) {   // sanitise it...
          throw "ERROR: invalid value in query: " + param;  // and reject if invalid
        }
        return param;                         // just return the value
      }
    }     // end of getValue function

    //
    // The valid operators allowed in http queries (within [...] after the column name)
    // 
    var operators = ['eq', 'ne', 'lt', 'gte', 'gt', 'lte', 'in', 'like', 'tween', 'is'];
    //
    // The SQL operators that correspond to the http query operators above, as two arrays
    // within an array.  The first [0] is the normal translation, the second [1] is the
    // negated translation
    //
    var sqlop = [
          // normal translation...
        ['= ', '!= ', '< ', '>= ', '> ', '<= ', 'IN (', 'LIKE ', 'BETWEEN ', 'IS '],
          // negated translation...
        ['!= ', '= ', '>= ', '< ', '<= ', '> ', 'NOT IN ', 'NOT LIKE ', 'NOT BETWEEN ', 'IS NOT ']
    ];

    var sql = "";                 // initial sql string
    var valueArray = [];          // initial value array
    var substitution = 1;         // number for $n bind placeholder

    //
    // Loop through each query parameter (separated in URI by &) and translate
    // into corresponding SQL predicate syntax. Each new predicate is appended
    // to the previous ones with AND.
    //
    for (var col in query) {      // for each query parameter (introduced by column name)
      if (columns.length > 0) {   // if the column array is provided check the name
        if (columns.find(o => o.column_name == col) == undefined) { 
          throw "ERROR: invalid column name: " + col;
        };
      }

      var negate = 0;             // initially assume un-negated operator

      //
      // Handle the appending of code to the sql and deal with the case
      // of no operator (assumes 'eq' be default)
      //
      if (sql == "") {
        sql = sql + "WHERE ";     // this must be the 1st parameter
      } else {
        sql = sql + "AND ";       // if not 1st parameter add AND keyword
      }
      sql = sql + col + " ";      // append column name

      var typ = typeof(query[col]);     // get the type of the value

      //
      // If the datatype of the value isn't an object then treat it as a
      // simple value.  Add a bind variable to the sql (e.g. $3) and push
      // the value onto the array.
      //
      if (typ != "object") {            // not an object so no operator provided
        sql = sql + "= " + subs + (substitution++) + " ";    // so assume eq (=)
        val = getValue(query[col]);     // get the parameter value
        valueArray.push(val);           // and append it to the array
      } else {
        //
        // Process the parameter value as an object of the form:
        //  { operator: value }
        // with separate code for 'is', 'in' and 'tween' operators
        //
        for (var op in query[col]) {    // else traverse sub-object 
          o = op;                       // copy the operator so it can be isolated from - prefix
          if (op.charAt(0) == "-") {    // if - prefix then
            negate = 1;                 //   set negate flag
            o = op.substring(1);        //   strip prefix
          }
          //
          // Select the corresponding SQL operator for the one from the URI
          //
          if (operators.includes(o)) {
            sql = sql + sqlop[negate][operators.indexOf(o)];
          } else {
            sql = sql + "= ";           // default to = if not found
          }
          if (o == "is") {
            //
            // Code for the 'is' operator
            //
            sql = sql + "NULL ";        // use literal NULL & ignore value
          } else if (o == "tween") {
            //
            // Code for the 'tween' operator
            //
            sql = sql + subs + (substitution++) + " AND " + subs + (substitution++) + " ";
            val = getValue(query[col][op]);
            varr = val.split(":");
            if (varr[0] != undefined) {
              valueArray.push(valarr[0]);
              if (varr[1] != undefined) {
                valueArray.push(varr[1])
              } else {
                throw "ERROR: missing value parameter";
              } 
            } else {
              throw "ERROR: missing value parameter";
            };
          } else if (o == "in") {
            //
            // Code for the 'in' operator
            //
            let first = true;
            val = getValue(query[col][op]);
            val.split(":").forEach(function(value) {
              sql = sql + (first?"":", ") + subs + (substitution++);
              valueArray.push(value);
              first = false;
            });
            sql = sql + ") ";
          } else {
            //
            // Code for all other operators (=, !=, <, >, etc.)
            //
            sql = sql + subs + (substitution++) + " ";
            val = getValue(query[col][op]);
            valueArray.push(val);
          }
        }
      };
    }
    return {'sql': sql, 'values': valueArray};
  }
  
  module.exports = {
    uri2sql,
    setsubs
  }
