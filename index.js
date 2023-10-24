const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const server = require('./services/server');
const serverController = require('./controllers/serverController');

server.startServer();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/users/:id', serverController.getUser);
app.get('/api/users', serverController.getUsers);
app.post('/api/users', serverController.createUser);
app.post('/api/users/:id/exercises', serverController.createExercise);
app.get('/api/users/:id/logs', serverController.getUserLogs);


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
