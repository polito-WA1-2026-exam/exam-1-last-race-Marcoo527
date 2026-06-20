import express from 'express';
import {param, body, validationResult} from 'express-validator';
import { 
    createGame, 
    getGameById, 
    startPlanning, 
    updateGameStatus, 
    updateGameScore, 
    saveRoute, 
    getRouteSteps, 
    applyEventToStep 
} from '../dao/game_dao.js';
import {listStations, listSegmentPairs, listStationLines, getSegmentById} from '../dao/network_dao.js';
import {listEvents} from '../dao/event_dao.js';

const router = express.Router();
const PLANNING_SECONDS = 90;


const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {return next();}
    return res.status(401).json({ error: 'Not authenticated' });
};


const checkValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    next();
};

//use BFS to find valid Start-end pairs, then it extracts one of them
//a pair is valid if there are at least 'minSegments' segments between them
const findValidStartEnd =(stations, segments, minSegments) =>{
    const adj = {};
    stations.forEach((s) => {adj[s.id] = [];}); //associates an empty array to the stations
    segments.forEach((seg) => { //not oriented graph
        adj[seg.stationAId].push(seg.stationBId);
        adj[seg.stationBId].push(seg.stationAId);
    });

    const stationIds = stations.map((s) => s.id);
    const validPairs = [];

    stationIds.forEach((startId) =>{
        const dist = {[startId]: 0}; //dictionary of distances
        const queue = [startId]; //FIFO queue
        let head =0;
        
        while (head < queue.length) {
            const current = queue[head++]; //extract current node
            if(adj[current]){ //if it has neighbors, it inspects them
                adj[current].forEach((neighbor) =>{
                    if(dist[neighbor] === undefined){
                        dist[neighbor] = dist[current] + 1;
                        queue.push(neighbor);
                    }
                });
            }
        }
        
        stationIds.forEach((endId) =>{
            if (endId !== startId && dist[endId] !== undefined && dist[endId] >= minSegments) {
                validPairs.push({startId, endId});
            }
        });
    });

    if (validPairs.length === 0) {return null;}
    return validPairs[Math.floor(Math.random() * validPairs.length)]; //extracts one random pair
};


//checks the route chosen by the player
const validateRoute = async(segmentIds, startStationId, endStationId) => {
    if (!segmentIds || segmentIds.length === 0) {return false;}

    const segmentDetails = await Promise.all(segmentIds.map((id) => getSegmentById(id)));
    if (segmentDetails.some((s) => !s)) { return false; } //every segment has to exist

    const usedSegmentIds = new Set(segmentIds);
    if (usedSegmentIds.size !== segmentIds.length) {return false;}  //duplicates segments can't be accepted

    const firstSeg = segmentDetails[0];   //we check that first segment hook up to the start station
    let currentStationId;

    if(firstSeg.stationAId === startStationId){
        currentStationId = firstSeg.stationBId;
    }else if(firstSeg.stationBId === startStationId){
        currentStationId = firstSeg.stationAId;
    }else{
        return false;
    }



    for (let i = 1; i < segmentDetails.length;i++){ //every segment must hook up to the last station
        const seg = segmentDetails[i];
        if(seg.stationAId === currentStationId){
            currentStationId = seg.stationBId;
        }else if(seg.stationBId === currentStationId){
            currentStationId = seg.stationAId;
        }else{
            return false;
        }

    }


    if (currentStationId !== endStationId) {return false;} //last station must be the end station


    return true;
};


//create new game
router.post('/', isLoggedIn, async(req, res) =>{
    try{
        const [stations, segments] = await Promise.all([listStations(), listSegmentPairs()]);
        const pair = findValidStartEnd(stations, segments, 3);
        
        if(!pair){
            return res.status(500).json({error: 'Could not generate a valid pair of stations'});
        }
        const gameId = await createGame(req.user.id, pair.startId, pair.endId); //status will be 'setup'
        const game = await getGameById(gameId);
        res.status(201).json(game);
    }catch(err){
        res.status(500).json({ error:'Error while creating the match'});
    }
});


//retrieve details about a game
router.get('/:id',
    isLoggedIn,
    [param('id').isInt({min: 1}).withMessage('ID partita non valido')],
    checkValidation,
    async(req, res) =>{
        try{
            const game = await getGameById(Number(req.params.id));
            if(!game){
                return res.status(404).json({error: 'Game not found'});
            }
            if(game.userId !== req.user.id){
                return res.status(403).json({error: 'Access denied'});
            }
            res.status(200).json(game);
        }catch(err){
            res.status(500).json({ error:'Errore while retrieving the game'});
        }
    }
);


//activates the timer of the planning phase
router.post('/:id/start',
    isLoggedIn,
    [param('id').isInt({min: 1}).withMessage('Invalid game Id')],
    checkValidation,
    async(req, res) => {
        try{
            const game = await getGameById(Number(req.params.id));
            if(!game) return res.status(404).json({error: 'Game not found'});
            if(game.userId !== req.user.id) return res.status(403).json({error: 'Access denied'});
            if(game.status !== 'setup') return res.status(400).json({error: 'The game isn\' in setup phase'});

            //update status to 'planning' and calculates deadline by adding 90 seconds to current timestamp
            const deadline = await startPlanning(game.id, PLANNING_SECONDS);
            
            res.status(200).json({status: 'planning', planningDeadline: deadline});
        }catch(err){
            res.status(500).json({error: 'Error while activating planning phase' });
        }
    }
);


//saves the route chosen during planning phase
router.post('/:id/segments',
    isLoggedIn,
    [
        param('id').isInt({min: 1}).withMessage('Invalid game id'),
        body('segmentIds').isArray().withMessage('segmentIds has to be an array (mepty if time is over)'),
        body('segmentIds.*').isInt({min: 1}).withMessage('Every segment Id has to be a positive integer'), //every element should be an integer
    ],
    checkValidation,
    async (req, res) =>{
        try{
            const game = await getGameById(Number(req.params.id));
            if(!game) return res.status(404).json({error: 'Game not found'});
            if(game.userId !== req.user.id) return res.status(403).json({error: 'Access denied'});
            if(game.status !=='planning') return res.status(400).json({error: 'The game isn\'t in planning phase'});


            const now = new Date();
            const deadline = new Date(game.planningDeadline);
            deadline.setSeconds(deadline.getSeconds() + 2); //adding two seconds to tolerate the lag of HTTP request
            let segmentsToSave = req.body.segmentIds;

            if (now > deadline) {
                console.log('Submission occurred after 90 seconds (possible cheat or heavy lag)');
                segmentsToSave = [];
            }

            await saveRoute(game.id, segmentsToSave);
            await updateGameStatus(game.id, 'execution');
            
            res.status(201).json({message: 'Route registered for execution.'});
        }catch(err){
            res.status(500).json({error: 'Error saving route'});
        }
    }
);


//simulates the journey and calculates the final score
router.post('/:id/execution',
    isLoggedIn,
    [param('id').isInt({min: 1}).withMessage('Invalid game Id')],
    checkValidation,
    async (req, res) => {
        try{
            const game = await getGameById(Number(req.params.id));
            if(!game) return res.status(404).json({error: 'Game not found'});
            if(game.userId !== req.user.id) return res.status(403).json({error: 'Access denied'});
            if(game.status !=='execution') return res.status(400).json({error: 'The game isn\'t in execution phase'});

            const steps = await getRouteSteps(game.id);

            //edge case 1: empty array
            if(steps.length === 0){
                await updateGameScore(game.id, 0);
                await updateGameStatus(game.id, 'completed');
                return res.status(200).json({valid: false, steps: [], score: 0});
            }

            const segmentIds = steps.map((s) =>s.segmentId);
            const isValid = await validateRoute(segmentIds, game.startStationId, game.endStationId); //verifying

            //edge case 2: invalid or cheat detected
            if (!isValid) {
                await updateGameScore(game.id, 0);
                await updateGameStatus(game.id, 'completed');
                return res.status(200).json({valid:false, steps:[], score:0});
            }


            const events = await listEvents();
            let currentCoins = 20;
            const executedSteps = [];


            for(const step of steps){
                const randomEvent = events[Math.floor(Math.random() * events.length)]; //extract random event
                currentCoins += randomEvent.effect;


                await applyEventToStep(step.id, randomEvent.id, randomEvent.effect);

                executedSteps.push({
                    segmentId: step.segmentId,
                    stepOrder: step.stepOrder,
                    eventId: randomEvent.id,
                    description: randomEvent.description,
                    effect: randomEvent.effect,
                    coinsAfter: currentCoins
                });
            }


            const finalScore =currentCoins < 0 ? 0 : currentCoins;

            await updateGameScore(game.id,finalScore);
            await updateGameStatus(game.id,'completed');

            res.status(200).json({
                valid:true,
                steps:executedSteps,
                score:finalScore
            });
        }catch(err){
            res.status(500).json({error: 'Error while simulating journey execution.'});
        }
    }
);

export default router;
