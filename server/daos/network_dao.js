'use strict';

import db from '../db.js';

//returns all possible lines
const listLines= () =>
  new Promise((resolve, reject) =>{
    const sql = 'SELECT id, name FROM lines';
    db.all(sql, [], (err, rows) =>{
      err ? reject(err) : resolve(rows);
    });
  });


//returns all possible stations
  const listStations = () =>
  new Promise((resolve, reject) =>{ 
    const sql = 'SELECT id, name FROM stations';
    db.all(sql, [], (err, rows) =>{
      err ? reject(err) : resolve(rows);
    });
  });


//returns all segments with their associated line and station names
//useful for setup phase to display the entire network
const listSegmentsWithLine = () =>
  new Promise((resolve, reject) => {
    const sql = `
      SELECT
        segments.id AS id,
        segments.line_id AS lineId,
        lines.name AS lineName,
        segments.station_a_id AS stationAId,
        stationA.name AS stationAName,
        segments.station_b_id AS stationBId,
        stationB.name AS stationBName
      FROM segments
      JOIN lines ON segments.line_id = lines.id
      JOIN stations AS stationA ON segments.station_a_id = stationA.id
      JOIN stations AS stationB ON segments.station_b_id = stationB.id
    `;
    db.all(sql, [], (err, rows) => {
      err ? reject(err) : resolve(rows);
    });
  });


//returns all segments with their associated station names, without line information
const listSegmentsPairs= () =>
  new Promise((resolve, reject) => {
    const sql = `
      SELECT
        segments.id AS id,
        segments.station_a_id AS stationAId,
        stationA.name AS stationAName,
        segments.station_b_id AS stationBId,
        stationB.name AS stationBName
      FROM segments
      JOIN stations AS stationA ON segments.station_a_id = stationA.id
      JOIN stations AS stationB ON segments.station_b_id = stationB.id
    `;
    db.all(sql, [], (err, rows) => {
      err ? reject(err) : resolve(rows);
    });
  });


//returns, for each station, the lines it belongs to
const listStationsLines = () =>
  new Promise((resolve, reject) => {
    const sql = `
      SELECT
        station_lines.station_id AS stationId,
        station_lines.line_id AS lineId
      FROM station_lines
    `;
    db.all(sql, [], (err, rows) => {
      err ? reject(err) : resolve(rows);
    });
  });


//returns a segment by ID
const getSegmentById = (segmentId) =>
  new Promise((resolve, reject) => {
    const sql = `
      SELECT
        segments.id AS id,
        segments.line_id AS lineId,
        segments.station_a_id AS stationAId,
        segments.station_b_id AS stationBId
      FROM segments
      WHERE segments.id = ?
    `;
    db.get(sql, [segmentId],(err, row) => {
      err ? reject(err) : resolve(row);
    });
  });
  
  

export {
  listLines,
  listStations,
  listSegmentsWithLine,
  listSegmentsPairs,
  listStationsLines,
  getSegmentById
}
