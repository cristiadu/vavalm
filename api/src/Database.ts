import { Sequelize } from 'sequelize'

class Database {
  private sequelize: Sequelize

  constructor() {
    this.sequelize = new Sequelize('mydb', 'user', 'password', {
      host: 'localhost',
      dialect: 'postgres',
      logging: (msg) => console.log(msg),
    })

    this.sequelize.authenticate()
      .then(() => {
        console.log('Connection has been established successfully.')
      })
      .catch((err: Error) => {
        console.error('Unable to connect to the database:', err)
      })
  }

  async query(sql: string, params?: any[]): Promise<any> {
    try {
      const [results, metadata] = await this.sequelize.query(sql, {
        replacements: params,
      })
      console.log('executed query', { sql, rows: (metadata as any).rowCount })
      return results
    } catch (err) {
      console.error('Error executing query', err)
      throw err
    }
  }

  async getClient(): Promise<Sequelize> {
    return this.sequelize
  }
}

const databaseInstance = new Database()
export default databaseInstance
