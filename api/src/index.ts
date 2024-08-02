import express from 'express'
import bodyParser from 'body-parser'
import TeamsController from './controllers/TeamsController'
import PlayersController from './controllers/PlayersController'

const app = express()
const port = process.env.PORT || 8000

app.use(bodyParser.json())

// Routes
app.use('/teams', TeamsController)
app.use('/players', PlayersController)


app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
