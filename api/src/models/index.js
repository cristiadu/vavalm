'use strict'

const fs = require('fs')
const path = require('path')
const Sequelize = require('sequelize')
const process = require('process')
const basename = path.basename(__filename)
const env = process.env.NODE_ENV || 'development'
const config = require(__dirname + '/../config/config.json')[env]
const db = {}

let sequelize
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], { logging: console.log, ...config })
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, { logging: console.log, ...config })
}

// Read all files in the current directory and import them as models
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    )
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes)
    db[model.name] = model
  })

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db)
  }
})

// Validate database connection
sequelize.authenticate()
  .then(() => {
    console.log('Connection has been established successfully.')
    // Ensure all tables are created
    return sequelize.sync()
  })
  .then(() => {
    console.log('All tables have been created successfully.')
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err)
  })

db.sequelize = sequelize
db.Sequelize = Sequelize

module.exports = db