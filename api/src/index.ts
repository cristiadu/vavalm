import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import TeamsController from './controllers/TeamsController'
import PlayersController from './controllers/PlayersController'
import TournamentController from './controllers/TournamentController'
import setupTestData from './bootstrap/Bootstrap'

const app = express()
const port = process.env.PORT || 8000

app.use(bodyParser.json())
app.use(cors())

// Routes
app.use('/teams', TeamsController)
app.use('/players', PlayersController)
app.use('/tournaments', TournamentController)

setupTestData().then(() => {
  console.log('Test data has been created successfully.')
}).catch(err => {
  console.error('Unable to create test data:', err)
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
