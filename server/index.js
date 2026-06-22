// imports
import express from "express";
import morgan from 'morgan';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import {Strategy as LocalStrategy} from 'passport-local';

import {getUser, getUserById} from './dao/user_dao.js';
import authRouter    from './routes/auth.js';
import networkRouter from './routes/network.js';
import gamesRouter   from './routes/games.js';
import rankingRouter from './routes/ranking.js';

// init express
const app = new express();
const port = 3001;

app.use(morgan('dev'));

app.use(express.json());

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));


app.use(session({
  secret: 'last-race-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
  },
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(async (username, password, done) =>{
  try {
    const user= await getUser(username, password);
    if(!user){return done(null, false); }
    return done(null, user);

  }catch (err){
    return done(err);
  }
}));

passport.serializeUser((user,done) =>{
  done(null, user.id);
});

passport.deserializeUser( async (id, done) =>{
  try{
    const user = await getUserById(id);
    done(null, user);
  }catch(err){
    done(err);
  }
});


app.use('/api', authRouter);
app.use('/api/network', networkRouter);
app.use('/api/games', gamesRouter);
app.use('/api/ranking', rankingRouter);



// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});