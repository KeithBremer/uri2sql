# uri2sql
## JS module that parses URI query parameters and creates an SQL WHERE clause to match
### Release 0.1 alpha
This is an alpha release - not yet ready for serious use.
### Description
This module provides a function that takes the HTTP query parameters appended to a URI and generates a SQL WHERE clause that implements the query parameters as SQL predicates and an ORDER BY clause the permits specifying the sort order of results. The module supports most of the basic SQL conditional operators: =, !=, <, <=, >, >=, LIKE, IN, BETWEEN and IS along with sorting by any column in asending (default) or descending order.

The HTTP query must be formulated using the following syntax:
```
http://server/endpoint?col[operator]=value_list&...&$sort=col:col...
```
Where:<br>
`col` is the column name from the table<br>
`operator` is one of `eq`, `ne`, `lt`, `lte`, `gt`, `gte`, `like`, `in`, `tween`, `is`<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;to correspond with `=`, `!=`, `<`, `<=`, `>`, `>=`, `LIKE`, `IN`, `BETWEEN` and `IS`<br>
`value_list` is one or more values, separated by colons, depending on the operator<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(`tween` must have two values and `in` can have one or more values, the rest must have just one value)<br>
`$sort` introduces a list of one or more sort columns
If the operator is `eq` it can be omitted along with its enclosing square brackets. e.g. `price=123.45` is the same as `price[eq]=123.45`.

Operators can be negated by prefixing the operator with a hyphen (minus) symbol.

Multiple conditions can be provided, separated by `&` symbols in the URI.

Sorting can be specified using the `$sort` parameter of the form: `$sort=city:-name` where `city` and `name` are columns in the table.

Sort columns can be negated to specify descending sort order, e.g. `Ssort=city:-name` causes data to be sorted into ascending city and descending name within city.

### Example
The following URI:<br>
```
      http://myserver:3000/customers?name[like]=%Jones&country[in]=UK:USA&$sort=city:-name
```
is translated to:
```
      WHERE name LIKE '%JONES' AND country IN ('UK', 'USA') ORDER BY city, name DESC
```

### Usage
Use this function in the callback function of an express endpoint that is expected to return multiple records. `uri2sql` assumes that you have pre-processed the request using middleware such as body-parser with:
```
      app.use(bodyParser.urlencoded({ extended: true }));
```
Import the function with:
```
      const uri2sql = require('./uri2sql.js');
```
The function takes two arguments:<br>
`params` structured query parameters (e.g. `req.query` after parsing with body-parser to get the URI query)<br>
`columns` an array of valid column names to be accepted (or an empty array to accept any)

The params argument has the form of a JavaScript object of the form:
```
{ column: value,
  column: { operator:   value },
  column: { 'tween':    value:value },
  column: { 'in':       value:value:... }
}
```
Each of the above object attribute formats represents one of the possible query formats provided by the URI.  So, for example, the query in the URI:
```
      http://server:3000/customers?name[like]=%Jones&country=UK
```
is represented as the object (automatically generated into `req.query` by body-parser):
```
{ name: { like: "%Jones" },
  country: "UK"
}
```
The columns argument is an array of column names asgainst which the query column names can be validated (to ensure there are no mistakes in the URI and that there isn't a nasty SQL injection attempt), for example:
```
      ["name", "email", "phone", "address", "city", "postcode", "country"]
```
This can also be obtained from a query against the data dictionary of the RDBMS, for example, using PostgreSQL:
```
      SELECT column_name FROM information_schema.columns WHERE table_name = '<your table name>'
```
If the columns array is empty then column name checks are not performed (this may be dangerous).

### Error Checking
Because the `uri2sql` function uses exceptions to signal errors, calls to this function should always be inside a `try ... catch ...` block.  For example, in its simplest form:
```
      try {
        filtr = uri2sql(req.query, columns);
      }
      catch (e) {
        console.log(e)
        res.status(400).json(e);
        return;
      }
```

### Output
The function returns an object of the form:
```
      { sql:  "WHERE column1 = $1 AND column2 <= $2 AND column3 BETWEEN $3 AND $4",
        values: ["value1", "value2", "value3", "value4"]
      }
```
By using SQL bind variables this helps to ensure that SQL injection is avoided and is the preferred method of supplying values into SQL.

For example, the URI `http://server:3000/customers?name[like]=%Jones&country=UK` would return:
```
      { sql: "WHERE name LIKE $1 AND country = $2",
        values: ["%Jones", "UK"]
      }
```

These can then be used in a query by appending the 'sql' above to the SELECT statement to be sent to the database, for example, using PostgreSQL (module 'pg') we might use:
```
      filtr = uri2sql(req.query, column_arr);
      db.query("SELECT * FROM customers " + filtr.sql, filtr.values, (err, result) => {
            ...
```

### To Do
(SHOULD) Provide a means to specify OR operations between predicates - currently only AND operations are supported.

(COULD) Other fancy stuff
