import db from '../db.js';
import dayjs from 'dayjs';


//create a new game in 'setup' status with default score and starting/ending stations
const createGame = (userId, startStationId, endStationId) =>
  new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO games (user_id, start_station_id, end_station_id, status, score, created_at) 
      VALUES (?, ?, ?, 'setup', 20, ?)
    `;
    const createdAt = dayjs().toISOString();
    db.run(sql, [userId, startStationId, endStationId, createdAt], function(err) { 
      err ? reject(err) : resolve(this.lastID); 
    });
  });


//retrieve details of a specific game
const getGameById = (gameId) =>
  new Promise((resolve, reject) =>{
    const sql= `
      SELECT
        id, user_id AS userId, start_station_id AS startStationId,
        end_station_id AS endStationId, status, planning_deadline AS planningDeadline,
        score, created_at AS createdAt
      FROM games
      WHERE id = ?
    `;
    db.get(sql, [gameId], (err, row) => {
      err ? reject(err) : resolve(row);
    });
  });


//set the deadline to 90 seconds from now and changing the status to 'planning'
const startPlanning = (gameId, planningSeconds) =>
  new Promise((resolve, reject) => {
    const deadline = dayjs().add(planningSeconds, 'second').toISOString();
    const sql = `UPDATE games SET status = 'planning', planning_deadline = ? WHERE id = ?`;
    db.run(sql, [deadline, gameId], err => {
      err ? reject(err) : resolve(deadline); 
    });
  });


//update the status of a game to a new value (for example 'execution' or 'completed')
const updateGameStatus = (gameId, newStatus) =>
  new Promise((resolve, reject) => {
    const sql = `UPDATE games SET status = ? WHERE id = ?`;
    db.run(sql, [newStatus, gameId], err => {
      err ? reject(err) : resolve();
    });
  });


//update the score of a game, ensuring it doesn't go below 0
const updateGameScore = (gameId, score) =>
  new Promise((resolve, reject) =>{
    const finalScore = Math.max(score, 0);
    const sql = `UPDATE games SET score = ? WHERE id = ?`;
    db.run(sql, [finalScore, gameId], err => {
      err ? reject(err) : resolve();
    });
  });


//save the ordered list of segments chosen during planning for a specific game
const saveRoute= (gameId, segmentsIds) =>
  segmentsIds.reduce(async (previousPromise, segmentId, index) => {
    await previousPromise;
    return new Promise((resolve, reject) =>{
      const sql = `
        INSERT INTO game_segments (game_id, segment_id, step_order)
        VALUES (?, ?, ?)
      `;
      db.run(sql, [gameId, segmentId, index], err => {
        err ? reject(err) : resolve();
      });
    });
  }, Promise.resolve());


  
//retrieve the ordered list of segments for a specific game, including any events and effects applied during execution
const getRouteSteps= (gameId) =>
  new Promise((resolve, reject) => {
    const sql = `
      SELECT
        game_segments.id AS id,
        game_segments.segment_id AS segmentId,
        game_segments.step_order AS stepOrder,
        game_segments.event_id AS eventId,
        game_segments.effect_applied AS effectApplied
      FROM game_segments
      WHERE game_segments.game_id = ?
      ORDER BY game_segments.step_order ASC
    `;
    db.all(sql, [gameId], (err, rows) => {
      err ? reject(err) : resolve(rows);
    });
  });


//apply a specific event and its effect to a game segment during execution
const applyEventToStep= (gameSegmentId, eventId, effect) =>
  new Promise((resolve, reject) => {
    const sql = `
      UPDATE game_segments
      SET event_id = ?, effect_applied = ?
      WHERE id = ?
    `;
    db.run(sql, [eventId, effect, gameSegmentId], err =>{
      err ? reject(err) : resolve();
    });
  });


  
//retrieve the ranking of users based on their best scores
  const getRanking =() =>
  new Promise((resolve, reject) => {
    const sql = `
      SELECT
        users.username AS username,
        MAX(games.score) AS bestScore
      FROM games
      JOIN users ON games.user_id = users.id
      WHERE games.status = 'completed'
      GROUP BY users.id
      ORDER BY bestScore DESC
    `;
    db.all(sql, [], (err, rows) => {
      err ? reject(err) : resolve(rows);
    });
  });

//returns all possible events
const listEvents = ()=>
  new Promise((resolve, reject) =>{
    const sql = 'SELECT id, description, effect FROM events';
    db.all(sql, [], (err,rows) =>{
      err ? reject(err) : resolve(rows);
    });
  });


export {
  createGame,
  getGameById,
  startPlanning,
  updateGameStatus,
  updateGameScore,
  saveRoute,
  getRouteSteps,
  applyEventToStep,
  getRanking,
  listEvents
}