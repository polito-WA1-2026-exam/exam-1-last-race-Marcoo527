'use strict';

import db from '../db.js';

//returns all possible events
const listEvents = ()=>
  new Promise((resolve, reject) =>{
    const sql = 'SELECT id, description, effect FROM events';
    db.all(sql, [], (err,rows) =>{
      err ? reject(err) : resolve(rows);
    });
  });


//returns a single event given his ID
const getEventById = (eventId) =>
  new Promise((resolve, reject) =>{
    const sql = 'SELECT id, description, effect FROM events WHERE id = ?';
    db.get(sql, [eventId], (err, row) =>{
      err ? reject(err) : resolve(row);
    });
  });



export {listEvents, getEventById};
