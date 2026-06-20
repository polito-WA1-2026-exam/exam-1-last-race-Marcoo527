
import express from 'express';

import {getRanking} from '../dao/game_dao.js';

const router = express.Router();

const isLoggedIn= (req, res, next) => {
    if(req.isAuthenticated()) {return next();}
    return res.status(401).json({error: 'not authenticated'});
};


//retrieves general ranking
router.get('/', isLoggedIn, async (req, res) =>{
    try{
        const ranking = await getRanking();
        res.status(200).json(ranking);
    }catch (err){
        res.status(500).json({error: 'Ranking recovery error'});
    }
});


export default router;