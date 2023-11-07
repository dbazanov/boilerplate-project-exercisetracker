"use strict";

const util = require("util");
const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3");

const DB_PATH = path.join(__dirname, "../my.db");
const DB_SQL_PATH = path.join(__dirname, "../mydb.sql");

let SQL3;

async function startServer() {
  const myDB = new sqlite3.Database(DB_PATH);
  SQL3 = {
    run(...args) {
      return new Promise(function c(resolve, reject) {
        myDB.run(...args, function onResult(err) {
          if (err) reject(err);
          else resolve(this);
        });
      });
    },
    get: util.promisify(myDB.get.bind(myDB)),
    all: util.promisify(myDB.all.bind(myDB)),
    exec: util.promisify(myDB.exec.bind(myDB)),
  };

  var initSQL = fs.readFileSync(DB_SQL_PATH, "utf-8");
  await SQL3.exec(initSQL);
}

async function getUsers() {
  const result = await SQL3.all(
    `
      SELECT *
      FROM Users
    `
  );

  return result;
}

async function getUser(id) {
  const result = await SQL3.get(
    `
      SELECT *
      FROM Users
      WHERE _id = ?
    `,
    id
  );
  if (!result) {
    return {
      status: 404,
      error: 'User not found',
    };
  }

  return result;
}

async function createUser(username) {
  let result;
  try {
    result = await SQL3.run(
      `
      INSERT INTO
        Users
        (username)
      VALUES
        (?)
      `,
      username
    );
  } catch {

    return { error: 'Username is not unique' };
  }
  if (result !== null && result.changes > 0) {

    return result.lastID;
  }

  return null;
}

async function createExercise(userID, description, duration, date) {
  const user = await getUser(userID);
  if (user.error) {

    return user;
  }
  try {
    date = date ? new Date(date).toISOString() : new Date().toISOString();
  } catch {
    return { status: 400, error: 'Invalid date' };
  }
  const result = await SQL3.run(
    `
    INSERT INTO
      Exercises
      (userID, description, duration, date)
    VALUES
      (?, ?, ?, ?)
    `,
    userID,
    description,
    duration,
    date
  );

  if (
    result != null &&
    result.changes > 0
  ) {
    const exercise = await SQL3.get(`
      SELECT
        Users._id,
        Users.username,
        Exercises.description,
        Exercises.duration,
        Exercises.date
      FROM
        Users
        JOIN Exercises ON (Users._id = Exercises.userID)
      WHERE
        Exercises._id = ?
      `,
      result.lastID);

    return {
      ...exercise,
      date: new Date(exercise.date).toDateString(),
    };
  }
}

async function getLogs(userID, options) {
  const user = await getUser(userID);
  if (user.error) {

    return user;
  }
  let { from, to, limit } = options;
  const start = new Date('1900-01-01').toISOString();
  const end = new Date('2100-01-01').toISOString();
  try {
    from = from ? new Date(from).toISOString() : start;
    to = to ? new Date(to).toISOString() : end;
  } catch {
    return { status: 400, error: 'Invalid date' };
  }
  const sqlFrom = `
    FROM Exercises
    WHERE userID = ?
    AND unixepoch(date) >= unixepoch(?)
    AND unixepoch(date) <= unixepoch(?)
    ORDER BY date ASC
    `;
  let count, exercises;
  try {
    count = await SQL3.get(`SELECT COUNT(*) ${sqlFrom}`, userID, from, to );
    exercises = await SQL3.all(`SELECT * ${sqlFrom} LIMIT ?`, userID, from, to, limit > 0 ? limit : 100 );
  }
   catch (e) {
    console.log(e);
    return null;
   }
  if (user !== null && exercises !== null) {

    return {
      ...user,
      count: count?.['COUNT(*)'] || exercises?.length || 0,
      log: (exercises || []).map((exercise) => ({
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString(),
      })),
    };
  }

  return null;
}

module.exports = {
  startServer: startServer,
  getUser: getUser,
  getUsers: getUsers,
  createUser: createUser,
  createExercise: createExercise,
  getLogs: getLogs,
};
