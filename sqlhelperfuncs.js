// SQL Helper funcs .01.
// NOTE: Add input sanitation.
// sql.connect
// sql.error
// sql.select_db
// sql.begin
// sql.commit
// sanitize
// sanitize_visibletext
// unsanitize
// sql.query
// sql.query_raw
// sql.loop
// sql.to_array
// sql.insert_id
// sql.num_rows
// sql.fetch_row
// sql.get_row_on_value

var mysql = require('mysql')
var sql   = {}; module.exports = sql
var sync  = undefined
// Sql connection reference.
var connection = undefined
sql.link = connection
var dbhost, dbuser, dbpass
sql.error_code = ""
sql.connect = function (new_dbhost, new_dbuser, new_dbpass) {
 if (typeof new_dbhost != "string") {
  return sql.connect_basic (new_dbhost)
 } else {
  return sql.connect_advanced (new_dbhost, new_dbuser, new_dbpass)
 }
}
sql.set_sync = function (new_sync) {sync = sql.sync = new_sync}

sql.connect_basic = function (options) {
 sql.link = connection = mysql.createConnection ({host: options.host, user: options.user, password: options.password, database: options.database})
 connection.on ('error', collect_error_messages)
 connection.connect ()
 return connection
}
sql.connect_advanced = function (new_dbhost, new_dbuser, new_dbpass) {
 dbhost = new_dbhost; dbuser = new_dbuser; dbpass = new_dbpass
}
sql.select_db = function (dbname) {
 sql.link = connection = mysql.createConnection ({host: dbhost, user: dbuser, password: dbpass, database: dbname})
 connection.on ('error', collect_error_messages)
 connection.connect ()
 return connection
}

function collect_error_messages (error_object) {sql.error_code = error_object.code}

sql.error = function () {return sql.error_code}

var mysql_begin_counter = 0
sql.begin  = function () {mysql_begin_counter += 1; if (mysql_begin_counter == 1) return sql.query ("BEGIN")}
sql.commit = function () {mysql_begin_counter -= 1; if (mysql_begin_counter == 0) return sql.query ("COMMIT")}

              /*
              function sanitize ($n) {
if (is_null($n)) return null;
if(get_magic_quotes_gpc()) {$n = mysql_real_escape_string(stripslashes($n));} else {$n = mysql_real_escape_string($n);}
return $n;
              }

              function sanitize_visibletext ($n) {
if (is_null($n)) return null;
$n = str_replace(array("<", ">", "%"), array("&lt;", "&gt;", "&#37;"), $n);
if (get_magic_quotes_gpc()) {$n = mysql_real_escape_string(stripslashes($n));} else {$n = mysql_real_escape_string($n);}
return htmlentities($n);
              }

              function unsanitize ($n) {
$search  = array("\\\\", "\\0", "\\n", "\\r", "\Z"   , "\'", '\"');
$replace = array("\\"  , "\0" , "\n" , "\r" , "\x1a" , "'" , '"' );
return str_replace($search, $replace, $n);
return $n;
              }
              */


sql.query = function (query_string) {
 try {
  var result = sync.await(connection.query(query_string, sync.defers()))
  return result[0]
 } catch (err) {
   console.log ("{\"error\": true, \"errormessage\": \"Error: " + err.code + "\"}")
   process.exit ()
 }
}

/*
              function sql_loop ($sql_object, $result_function) {
$curlen = mysql_num_rows($sql_object);
for ($i = 0; $i < $curlen; $i++) {$result_function(mysql_fetch_assoc($sql_object), $i, $sql_object);}
              }
              function sql_to_array ($sql_object) {
$data = array(); $curlen = mysql_num_rows($sql_object);
for ($i = 0; $i < $curlen; $i++) {$data []= mysql_fetch_assoc($sql_object);}
return $data;
              }

              function sql_insert_id () {global $link; return mysql_insert_id ($link);}
              function sql_num_rows  ($sql_object) {global $link; return mysql_num_rows  ($sql_object);}
              function sql_fetch_row ($sql_object) {global $link; return mysql_fetch_row ($sql_object);}

              function sql_get_basic_column_list ($table_name) {
$column_list = array ();
sql_loop(sql_query("SHOW COLUMNS FROM $table_name"), function ($result) use (&$column_list) {
 $column_list[$result["Field"]] = preg_replace("/[^a-zA-Z]/", "", $result["Type"]);
});
return $column_list;
              }
              */

// Get unique rows for a certain group id based on some operation.
sql.get_row_on_value = function (init) {
 var value_pivot = Object.keys(init.value)[0]
 var operation_string = init.operation.replace(/%/, value_pivot)
 var select = "SELECT "; for (var prop in init.columns) {select += "a." + prop + " AS " + init.columns[prop] + ", "}
 select += "a." + value_pivot + " AS " + init.value[value_pivot]
 return select +
    ` FROM ${init.table} a`
  + ` INNER JOIN (`
  + `  SELECT ${init.group_id}, ${operation_string} ${value_pivot}`
  + `  FROM ${init.table}`
  + `  GROUP BY ${init.group_id}`
  + ` ) b ON a.${init.group_id} = b.${init.group_id} AND a.${value_pivot} = b.${value_pivot}`
}

sql.end = function () {connection.end()}
