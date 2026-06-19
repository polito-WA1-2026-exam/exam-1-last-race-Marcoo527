'use strict';

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sqlite3 from 'sqlite3';
import dayjs from 'dayjs';


const dirname = import.meta.dirname;

const DB_FILE = path.join(dirname, 'last_race.db');
const SCHEMA_FILE = path.join(dirname, 'schema.sql');

if(fs.existsSync(DB_FILE)){
    fs.unlinkSync(DB_FILE);
}

const db = new sqlite3.Database(DB_FILE);

db.run('PRAGMA foreign_keys = ON;');

const run = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.run(sql, params, function callback(err) {
            if(err){
                reject(err);
            }else{
                resolve({lastID: this.lastID, changes: this.changes});
            }
            
        });
    });


const hashPassword = (plainPassword) => 
    new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString('hex');
        crypto.scrypt(plainPassword, salt, 32, (err, derivedKey) => {
            if(err){
                reject(err);
            }else{
                resolve({hash: derivedKey.toString('hex'), salt});
            }
        });
    });



const seedLines = async (lineNames) => {
    const entries = await Promise.all(
        lineNames.map(async (name) =>{
            const {lastID} = await run('INSERT INTO lines (name) VALUES (?)', [name]);
            return [name, lastID];
        }),
    );
    return Object.fromEntries(entries);
};


const seedStations =async(stationNames) => {
    const entries = await Promise.all(
        stationNames.map(async (name) => {
            const {lastID} = await run('INSERT INTO stations (name) VALUES (?)', [name]);
            return [name, lastID];
        }),
    );
    return Object.fromEntries(entries);
}

const seedSegmentsAndStationsLines = async(lineDefinitions, lineIds, stationIds) =>{
    const segmentInserts = lineDefinitions.flatMap((line) =>{
        return line.stations.slice(0, -1).map((stationName, index) =>({
            lineId: lineIds[line.name],
            stationAId: stationIds[stationName],
            stationBId: stationIds[line.stations[index + 1]],
        }));
    });
    
    await segmentInserts.reduce(async(previousPromise, segment) => {
        await previousPromise;
        return run(
            'INSERT INTO segments (line_id, station_a_id, station_b_id) VALUES (?, ?, ?)',
            [segment.lineId, segment.stationAId, segment.stationBId],
        );
    }, Promise.resolve());


    const stationLineInserts= lineDefinitions.flatMap((line) => 
        line.stations.map((stationName) => ({
            lineId: lineIds[line.name],
            stationId: stationIds[stationName],
        })),
    );

    await stationLineInserts.reduce(async(previousPromise, entry) => {
        await previousPromise;
        return run(
            'INSERT INTO station_lines (line_id, station_id) VALUES (?, ?)',
            [entry.lineId, entry.stationId],
        );
    }, Promise.resolve());


};


const seedEvents = async(events) => {
    await events.reduce(async (previousPromise, event) => {
        await previousPromise;
        return run('INSERT INTO events (description, effect) VALUES (?, ?)', [
            event.description,
            event.effect,
        ]
        );
    }, Promise.resolve());
};

const seedUsers= async(users) => {
    const entries= await users.reduce(async(previousPromise, user) => {
        const accumulator=await previousPromise;
        const {hash, salt} = await hashPassword(user.password);
        const{lastID} = await run('INSERT INTO users (username, password_hash, salt) VALUES (?, ?, ?)', 
            [user.username, hash, salt],
        );
        return [...accumulator, [user.username, lastID]];
    }, Promise.resolve([]));
    return Object.fromEntries(entries);
};


const main= async() => {
    try{
        if(!fs.existsSync(SCHEMA_FILE)){
            throw new Error(`Schema file not found: ${SCHEMA_FILE}`);
        }

        const schemaSQL = fs.readFileSync(SCHEMA_FILE, 'utf8');

        await new Promise((resolve, reject) => {
            db.exec(schemaSQL, (err) => (err ? reject(err) : resolve()));
        });

        const lineDefinitions = [
            {
                name: 'Linea del Ritorno',
                stations: ['Troia', 'Terra dei Lotofagi', 'Itaca', 'Scheria'],
            },
            {
                name: 'Linea del Mare',
                stations: ['Itaca', 'Isola di Eolo', 'Scilla e Cariddi', 'Isola di Ea'],
            },
            {
                name: 'Linea dei Pericoli',
                stations: ['Isola delle Sirene', 'Terra dei Ciclopi', 'Terra dei Lotofagi', 'Regno dei Morti'],
            },
            {
                name: 'Linea delle Ninfe',
                stations: ['Isola di Ea', 'Trinacria', 'Isola di Ogigia', 'Telepilo'],
            },
        ];

        const allStationNames = [...new Set(lineDefinitions.flatMap((line) => line.stations))];

        const allLineNames = lineDefinitions.map((line) => line.name);

        const lineIds = await seedLines(allLineNames);
        const stationIds = await seedStations(allStationNames);
        await seedSegmentsAndStationsLines(lineDefinitions, lineIds, stationIds);

        const events= [
            {description: 'Smooth journey with favourable winds', effect: 0},
            {description: 'Hermes grants you the holy Moly herb for protection', effect:1},
            {description: 'The Phaeacians provide you with a ship full of treasures', effect:2 },
            {description: 'Hospitable welcome at King Nestor’s palace', effect:3 },
            {description: 'Lucio Dalla dedicates a song to you', effect:4 },
            {description: 'Your companions slaughter the Cattle of Hyperion', effect: -1 },
            {description: 'Nostalgia and homesickness overwhelm you while staring at the sea', effect: -1 },
            {description: 'The enchanting song of the Sirens makes you lose your way', effect: -2 },
            {description: 'The Laestrygonians attack and destroy part of your fleet', effect: -3 },
            {description: 'Your crew opens Aeolus’s bag of winds, unleashing a violent storm', effect: -1 },
        ];
        await seedEvents(events);

        const users =[
            {username: 'Matteo', password: 'password1'},
            {username: 'Giulia', password: 'password2'},
            {username: 'Luca', password: 'password3'},
        ];
        const userIds = await seedUsers(users);

        const sampleGames= [
            {username: 'Matteo', startName: 'Troia', endName: 'Itaca', score: 23},
            {username: 'Giulia', startName: 'Isola di Eolo', endName: 'Regno dei Morti', score: 17},
            {username: 'Luca', startName: 'Scheria', endName: 'Isola di Ogigia', score: 19},
        ];

        await sampleGames.reduce(async(previousPromise, game) => {
            await previousPromise;
            return run(
                `INSERT INTO games (user_id, start_station_id, end_station_id, status, planning_deadline, score, created_at) 
                VALUES (?, ?, ?, 'completed', NULL, ?, ?)`,
                [
                    userIds[game.username],
                    stationIds[game.startName],
                    stationIds[game.endName],
                    game.score,
                    dayjs().toISOString(),
                ],
                
            );
        }, Promise.resolve());  

        console.log('Database initialized successfully in server/last_race.db');
        
        }catch(err){
            console.error('Error initializing database:', err);
        }finally{
            db.close();
        }
};


main();