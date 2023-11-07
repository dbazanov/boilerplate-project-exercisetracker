const server = require('../services/server');

exports.getUser = async (req, res) => {
  const user = await server.getUser(req.params.id);
  if (user.error) {
    res.status(user.status).send({error: user.error});
  }
  else if (!user) {
    res.status(500).end();
  } else {
    res.send(user);
  }
};

exports.getUsers = async (req, res) => {
  const users = await server.getUsers();
  if (users) {
    res.send(users);
  } else {
    res.status(500).end();
  }
};

exports.createUser = async (req, res) => {
  if (req.body.username) {
    const id = await server.createUser(req.body.username);
    if (id.error) {
      res.status(400).send(id);
      return;
    }
    const user = await server.getUser(id);
    if (!user) {
      res.status(500).end();
      return;
    }
    res.send(user);
  } else {
    res.status(400).send({'error': 'No username provided'});
  }
}

exports.createExercise = async (req, res) => {
  const { description, duration, date } = req.body;
  if (!description || !duration) {
    res.status(400).send({
      error: 'Description and duration cannot be empty',
    });
    return;
  }
  if (isNaN(+duration)) {
    res.status(400).send({
      error: 'Duration must be a number',
    });
    return;
  }
  const id = req.params.id;
  const exercise = await server.createExercise(id, description, duration, date);
  if (!exercise) {
    res.status(500).end();
  } else if (exercise.error) {
    res.status(exercise.status).send({ error: exercise.error });
  } else {
    res.send(exercise);
  }
}

exports.getUserLogs = async (req, res) => {
  const id = req.params.id;
  const { from, to, limit } = req.query;
  if (limit && isNaN(+limit)) {
    res.status(400).send({
      error: 'Limit must be a number',
    });

    return;
  }
  const logs = await server.getLogs(id, { from, to, limit });
  if (!logs) {
    res.status(500).end();
  } else if (logs.error) {
    res.status(logs.status || 400).send({ error: logs.error });
  } else {
    res.send(logs);
  }
}
