'use strict'; 

import db from '../db.js'; 
import crypto from 'crypto';  


//verifies the plain password with the stored one by recalculating the script in constant time
const checkPassword = (plainPassword, storedHash, storedSalt) =>
  new Promise((resolve, reject) => {
    crypto.scrypt(plainPassword, storedSalt, 32, (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }
      const storedHashBuffer = Buffer.from(storedHash, 'hex');

      const isMatch= storedHashBuffer.length === derivedKey.length && crypto.timingSafeEqual(storedHashBuffer, derivedKey);
      resolve(isMatch);
    });
  });


//retrieve the user by username and verifies the password.
//if it exists and credentials are correct, returns it without sensitive data
const getUser = (username, password) =>
  new Promise((resolve, reject) => {
    const sql =`
      SELECT id, username, password_hash, password_salt FROM users WHERE username = ?
    `;
    db.get(sql, [username], async (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      if(!row){
        resolve(false);
        return;
      }
      try {
        const isMatch = await checkPassword(password, row.password_hash, row.salt);
        if(!isMatch){
          resolve(false);
          return;
        }
        resolve({id: row.id, username: row.username});
      } catch (hashError) {
        reject(hashError);
      }
    });
  });


//retrieve the user by Id
const getUserById = (id) =>
  new Promise((resolve, reject) =>{
    const sql = `SELECT id, username FROM users WHERE id = ?`;
    db.get(sql, [id], (err, row) =>{
      if(err){
        reject(err);
      }else if(!row){
        resolve(false);
      }else{
        resolve({ id: row.id, username: row.username });
      }
    });
  });


export {
  checkPassword,
  getUser,
  getUserById
}