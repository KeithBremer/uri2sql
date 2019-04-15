# uri2sql
## JS module that parses URI query parameters and creates an SQL WHERE clause to match
### Description
This module provides a function that takes the HTTP query parameters appended to a URI and generates an SQL WHERE clause that implements the query parameters as SQL predicates. The module supports most of the basic SQL conditional operators: =, !=, <, <=, >, >=, LIKE, IN, BETWEEN and IS.

The HTTP query must be formulated using the following syntax:
```
http://server/endpoint?col[operator]=value_list&...
```
Where:<br>
`col` is the column name from the table<br>
`operator` is one of `eq`, `ne`, `lt`, `lte`, `gt`, `gte`, `like`, `in`, `tween`, `is`<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;to correspond with `=`, `!=`, `<`, `<=`, `>`, `>=`, `LIKE`, `IN`, `BETWEEN` and `IS`<br>
`value_list` is one or more values, separated by colons, depending on the operator<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(`tween` must have two values and `in` can have one or more values, the rest must have just one value)

If the operator is `eq` it can be omitted along with its enclosing square brackets. e.g. `price=123.45` is the same as `price[eq]=123.45`.

Operators can be negated by prefixing the operator with a hyphen (minus) symbol.

Multiple conditions can be provided, separated by `&` symbols in the URI.

### Example
The following URI:<br>
```
      http://myserver:3000/customers?name[like]=%Jones&country[in]=UK:USA
```
is translated to:
```
      WHERE name LIKE '%JONES' AND country IN ('UK', 'USA')
```
### To Do
Implement a syntax to support sorting the result set to generate an ORDER BY clause.

Provide a means to specify OR operations between predicates - currently only AND operations are supported.
