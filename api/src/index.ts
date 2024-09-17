import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import TeamsController from './controllers/TeamsController'
import PlayersController from './controllers/PlayersController'
import TournamentController from './controllers/TournamentController'
import setupTestData from './bootstrap/Bootstrap'
import GameController from './controllers/GameController'
import db from './models/db'
import MatchController from './controllers/MatchController'
import SchedulerService  from './services/SchedulerService'
import VlrImportController from './controllers/VlrImportController'

const app = express()
const port = process.env.PORT || 8000

app.use(bodyParser.json())
app.use(cors())

// Routes
app.use('/teams', TeamsController)
app.use('/players', PlayersController)
app.use('/tournaments', TournamentController)
app.use('/games', GameController)
app.use('/matches', MatchController)
app.use('/import', VlrImportController)

const forceSync = process.env.FORCE_SYNC === 'true'
db.sequelize.sync({ force: forceSync }).then(() => {
  setupTestData().then(() => {
    console.info('Test data has been created successfully.')
  }).catch(err => {
    console.error('Unable to create test data:', err)
  })})

app.listen(port, () => {
  console.info(`Server is running on port ${port}`)
  const shouldStartScheduler = process.env.START_SCHEDULER !== 'false'
  if (shouldStartScheduler) {
    console.info('Starting match scheduler...')
    SchedulerService.startScheduler()
  }
})
