'use strict'

const fs = require('fs')
const path = require('path')
const Sequelize = require('sequelize')
const process = require('process')
const basename = path.basename(__filename)
const env = process.env.NODE_ENV || 'development'
const config = require(__dirname + '/../config/config.json')[env]
const db = {}
let executed = false

let sequelize
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], { logging: console.log, ...config })
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, { logging: console.log, ...config })
}

if (!executed) {
  // Create a context for the models directory
  const context = require.context(__dirname, false, /\.js$/)

  context.keys().forEach(file => {
    if (file.indexOf('.') !== 0 && file !== './' + basename && file !== './associations.js' && file.indexOf('.test.js') === -1) {
      const model = context(file)(sequelize, Sequelize.DataTypes)
      db[model.name] = model
    }
  })

  Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
      db[modelName].associate(db)
    }
  })
}

// Validate database connection
sequelize.authenticate()
  .then(() => {
    console.log('Connection has been established successfully.')
    // Ensure all tables are created
    // Set FORCE_SYNC environment variable to 'true' to drop and recreate tables
    const forceSync = process.env.FORCE_SYNC === 'true'
    return sequelize.sync({ force: forceSync })
  })
  .then(() => {
    console.log('All tables have been created successfully.')
    executed = true
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err)
  })

db.sequelize = sequelize
db.Sequelize = Sequelize

module.exports = db
