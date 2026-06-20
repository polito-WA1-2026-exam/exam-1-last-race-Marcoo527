import express from 'express';
import passport from 'passport';
import {body, validationResult} from 'express-validator';

const router= express.Router();

//validation middleware
const checkValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    next();
};

//authenticates the user and creates session on the server
router.post(
    '/sessions',
    [
        body('username').isString().notEmpty().withMessage('Username required'),
        body('password').isString().notEmpty().withMessage('Password required'),
    ],
    checkValidation,
    (req, res, next) => {
        passport.authenticate('local', (err, user) =>{
            if(err) {return next(err);}
            if(!user) {
                return res.status(401).json({error: 'invalid credentials'});
            }
            req.login(user, (loginErr) => {
                if(loginErr) {return next(loginErr); }
                return res.status(201).json(user);
            });
        })(req, res, next);
    }
);

//logout
router.delete('/sessions/current', (req, res) => {
    req.logout(() =>{
        res.status(200).json({message: 'Logged out'});
    });
});


//retrieves the current logged user
router.get('/sessions/current', (req, res) =>{
    if(!req.isAuthenticated()){
        return res.status(401).json({error: 'not authenticated'});
    }
    res.status(200).json(req.user);
});


export default router;



