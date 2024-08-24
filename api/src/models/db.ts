import { Sequelize } from 'sequelize'
import { env as _env } from 'process'

const env = _env.NODE_ENV || 'development'
const config = require(__dirname + '/../config/config.json')[env]
interface DB {
  sequelize: any,
  Sequelize: any
}

const db: DB = {} as DB

let sequelize
if (config.use_env_variable) {
  const useEnvVariable = _env[config.use_env_variable]
  if (useEnvVariable) {
    sequelize = new Sequelize(useEnvVariable, { logging: null, ...config })
  } else {
    throw new Error(`Environment variable ${config.use_env_variable} is not defined.`)
  }
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, { logging: null, ...config })
}

// Validate database connection
sequelize.authenticate()
  .then(() => {
    console.log('Connection has been established successfully.')
  })
  .then(() => {
    console.log('All tables have been created successfully.')
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err)
  })

db.sequelize = sequelize
db.Sequelize = Sequelize

export default db
