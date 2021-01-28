// SQL Helper funcs 3.5.

const mysql = require('mysql')
const sql   = {mysql: mysql, escape: mysql.escape, escapeId: mysql.escapeId}
module.exports = sql

// Sql connection reference.
let connection = sql.link = undefined
let dbhost, dbuser, dbpass
sql.errorCode = ''
sql.connectAsync = function (options) {
 return new Promise(function(resolve, reject) {
  sql.link = connection = mysql.createConnection({host: options.host, user: options.user, password: options.password, database: options.database, connectTimeout: 30000})
  connection.connect(function (err) {
   if (err) sql.link.error = err
   return resolve(sql.link)
  })
 })
}
sql.connect = function (newDbhost, newDbuser, newDbpass) {
 if (typeof newDbhost != 'string') return sql.connectBasic(newDbhost)
 return sql.connectAdvanced(newDbhost, newDbuser, newDbpass)
}
sql.connectBasic = function (options) {
 sql.link = connection = mysql.createConnection({host: options.host, user: options.user, password: options.password, database: options.database, connectTimeout: 30000})
 sql.onConnect = (sql.onConnect === undefined) ? (function () {}) : sql.onConnect
 connection.on('error', collectErrorMessages)
 connection.connect(sql.onConnect)
 return connection
}
sql.connectAdvanced = function (newDbhost, newDbuser, newDbpass) {
 dbhost = newDbhost; dbuser = newDbuser; dbpass = newDbpass
}
sql.selectDb = function (dbname) {
 sql.link = connection = mysql.createConnection({host: dbhost, user: dbuser, password: dbpass, database: dbname})
 connection.on('error', collectErrorMessages)
 sql.onConnect = (sql.onConnect === undefined) ? (function () {}) : sql.onConnect
 connection.connect(sql.onConnect)
 return connection
}

function collectErrorMessages (errorObject) {sql.errorCode = errorObject.code}

sql.error = function () {return sql.errorCode}

let mysqlBeginCounter = 0
sql.begin  = function () {mysqlBeginCounter += 1; if (mysqlBeginCounter == 1) return sql.query("BEGIN")}
sql.commit = function () {mysqlBeginCounter -= 1; if (mysqlBeginCounter == 0) return sql.query("COMMIT")}

sql.query = function (queryString) {
 if (queryString instanceof Array) queryString = queryString.join(' ')
 return new Promise(function(resolve, reject) {
  try {
   result = connection.query(queryString, function (error, results, fields) {resolve({error: error, results: results, fields: fields})})
  } catch (err) {
   reject({error: true, code: err.code})
  }
 })
}

// Get unique rows for a certain group id based on some operation.
sql.getRowOnValue = function (init) {
 let valuePivot = Object.keys(init.value)[0]
 let operationString = init.operation.replace(/%/, valuePivot)
 let select = "SELECT "; for (let prop in init.columns) {select += "a." + prop + " AS " + init.columns[prop] + ", "}
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
