// SQL Helper funcs .02.

var mysql = require('mysql')
var sql   = {}; module.exports = sql

// Sql connection reference.
var connection = sql.link = undefined
var dbhost, dbuser, dbpass
sql.errorCode = ""
sql.connect = function (newDbhost, newDbuser, newDbpass) {
 if (typeof newDbhost != "string") return sql.connectBasic(newDbhost)
 return sql.connectAdvanced(newDbhost, newDbuser, newDbpass)
}

sql.connectBasic = function (options) {
 sql.link = connection = mysql.createConnection({host: options.host, user: options.user, password: options.password, database: options.database})
 connection.on('error', collectErrorMessages)
 connection.connect()
 return connection
}
sql.connectAdvanced = function (newDbhost, newDbuser, newDbpass) {
 dbhost = newDbhost; dbuser = newDbuser; dbpass = newDbpass
}
sql.selectDb = function (dbname) {
 sql.link = connection = mysql.createConnection({host: dbhost, user: dbuser, password: dbpass, database: dbname})
 connection.on('error', collectErrorMessages)
 connection.connect()
 return connection
}

function collectErrorMessages (errorObject) {sql.errorCode = errorObject.code}

sql.error = function () {return sql.errorCode}

var mysqlBeginCounter = 0
sql.begin  = function () {mysqlBeginCounter += 1; if (mysqlBeginCounter == 1) return sql.query("BEGIN")}
sql.commit = function () {mysqlBeginCounter -= 1; if (mysqlBeginCounter == 0) return sql.query("COMMIT")}

sql.query = function (queryString) {
 try {
  var result = connection.query(queryString, sync.defers())
  return result[0]
 } catch (err) {
   console.log ("{\"error\": true, \"errormessage\": \"Error: " + err.code + "\"}")
   process.exit ()
 }
}

// Get unique rows for a certain group id based on some operation.
sql.getRowOnValue = function (init) {
 var valuePivot = Object.keys(init.value)[0]
 var operationString = init.operation.replace(/%/, valuePivot)
 var select = "SELECT "; for (var prop in init.columns) {select += "a." + prop + " AS " + init.columns[prop] + ", "}
 select += "a." + valuePivot + " AS " + init.value[valuePivot]
 return select +
    ` FROM ${init.table} a`
  + ` INNER JOIN (`
  + `  SELECT ${init.groupId}, ${operationString} ${valuePivot}`
  + `  FROM ${init.table}`
  + `  GROUP BY ${init.groupId}`
  + ` ) b ON a.${init.groupId} = b.${init.groupId} AND a.${valuePivot} = b.${valuePivot}`
}

sql.end = function () {connection.end()}
