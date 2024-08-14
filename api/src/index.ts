import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import TeamsController from './controllers/TeamsController'
import PlayersController from './controllers/PlayersController'
import TournamentController from './controllers/TournamentController'
import setupTestData from './bootstrap/Bootstrap'
import GameController from './controllers/GameController'
import { sequelize } from './models'

const app = express()
const port = process.env.PORT || 8000

app.use(bodyParser.json())
app.use(cors())

// Routes
app.use('/teams', TeamsController)
app.use('/players', PlayersController)
app.use('/tournaments', TournamentController)
app.use('/games', GameController)

const forceSync = process.env.FORCE_SYNC === 'true'
sequelize.sync({ force: forceSync }).then(() => {
  setupTestData().then(() => {
    console.log('Test data has been created successfully.')
  }).catch(err => {
    console.error('Unable to create test data:', err)
  })})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
