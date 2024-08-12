'use strict'

const Sequelize = require('sequelize')
const process = require('process')

const env = process.env.NODE_ENV || 'development'
const config = require(__dirname + '/../config/config.json')[env]
const db = {}

let sequelize
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], { logging: null, ...config })
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, { logging: null, ...config })
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
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err)
  })

db.sequelize = sequelize
db.Sequelize = Sequelize

module.exports = db
