import express from 'express';

import {listSegmentsWithLine, listSegmentPairs, listStations, listLines} from '../dao/network_dao.js';

const router = express.Router();

const isLoggedIn= (req, res, next) => {
    if(req.isAuthenticated()) {return next();}
    return res.status(401).json({error: 'not authenticated'});
};

//retrieves the network
router.get('/', isLoggedIn, async (req, res) => {
    try{
        const[lines, stations, segments] = await Promise.all([
            listLines(),
            listStations(),
            listSegmentsWithLine(),
        ]);
        res.status(200).json({lines, stations, segments});
    }catch (err){
        res.status(500).json({error: 'Network recovery error'});
    }
});

//retrieves stations and segments
router.get('/segments', isLoggedIn, async (req,res) =>{
    try{
        const[stations, segments] = await Promise.all([
            listStations(),
            listSegmentPairs(),
        ]);
        res.status(200).json({stations, segments});
    }catch (err){
        res.status(500).json({error: 'Segments recovery error'});
    }
});


export default router;
