import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import TeamsController from './controllers/TeamsController'
import PlayersController from './controllers/PlayersController'
import TournamentController from './controllers/TournamentController'

const app = express()
const port = process.env.PORT || 8000

app.use(bodyParser.json())
app.use(cors())

// Routes
app.use('/teams', TeamsController)
app.use('/players', PlayersController)
app.use('/tournaments', TournamentController)


app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
