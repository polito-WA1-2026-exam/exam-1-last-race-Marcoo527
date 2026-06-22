const SERVER = 'http://localhost:3001';

const request = async (method, path, body) => {
    const options = {
        method, 
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
    };

    if(body !== undefined){
        options.body = JSON.stringify(body);
    }

    
    const fullUrl = `${SERVER}${path}`;

    const res = await fetch(fullUrl, options);

    const text = await res.text();
    

    const data = text ? JSON.parse(text) : {};

    if(!res.ok){
        throw new Error(data.error || `Server error: ${res.status}`);
    }

    return data;
};



//Auth

const login = (username, password) => 
    request('POST', '/api/sessions', {username, password});

const logout =() =>
    request('DELETE', '/api/sessions/current');

const getCurrentUser =() =>
    request('GET', '/api/sessions/current');


//Network

const getNetwork = () =>
    request('GET', '/api/network');

const getNetworkSegments = () =>
    request('GET', '/api/network/segments');


//Games

const createGame =() =>
    request('POST', '/api/games');

const getGame = (gameId) =>
    request('GET', `/api/games/${gameId}`);

const submitRoute =(gameId, segmentIds) =>
    request('POST', `/api/games/${gameId}/segments`, {segmentIds});

const executeGame =(gameId) =>
    request('POST', `/api/games/${gameId}/execution`);

const startGame = (gameId) =>
    request('POST', `/api/games/${gameId}/start`);


//Ranking
const getRanking = () =>
    request('GET', '/api/ranking');



export {login, logout, getCurrentUser, getNetwork, getNetworkSegments, createGame, getGame, submitRoute, executeGame, startGame, getRanking};