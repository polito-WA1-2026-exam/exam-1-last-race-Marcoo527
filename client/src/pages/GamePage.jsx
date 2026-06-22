import {useState} from 'react';
import {Container, Alert, Spinner, Button} from 'react-bootstrap'; // Added Button for consistency
import {createGame, getGame, startGame, submitRoute} from '../api.js';
import SetupPhase from '../components/game/SetupPhase.jsx';
import PlanningPhase from '../components/game/PlanningPhase.jsx';
import ExecutionPhase from '../components/game/ExecutionPhase.jsx';
import ResultPhase from '../components/game/ResultPhase.jsx';

// The game phases match the database status values, 
//plus 'idle' (no game active) and 'result' (game completed, showing final score)
const PHASES = {
    IDLE: 'idle',
    SETUP: 'setup',
    PLANNING: 'planning',
    EXECUTION: 'execution',
    RESULT: 'result',
};

const GamePage = () =>{

    const [phase, setPhase] = useState(PHASES.IDLE);
    const [game, setGame]  = useState(null);
    const [finalScore, setFinalScore] = useState(null);
    const [error, setError]  = useState('');
    const [loading, setLoading] = useState(false);

    // Creates a new game session on the server and moves to the Setup phase
    const handleNewGame = async () => {
        setError('');
        setLoading(true);
        try{
            const newGame = await createGame();
            setGame(newGame);
            setPhase(PHASES.SETUP);
        }catch(err){
            setError(err.message || 'Failed to initialize a new game.');
        }finally{
            setLoading(false);
        }
    };

    // Triggered when the user is ready to move from Setup to Planning
    // Start the server-side countdown timer
    const handleSetupReady = async () => {
        setError('');
        setLoading(true);
        try {
            await startGame(game.id);
            const updatedGame = await getGame(game.id);
            setGame(updatedGame);
            setPhase(PHASES.PLANNING);
        } catch (err) {
            setError(err.message || 'Failed to start the planning phase.');
        } finally {
            setLoading(false);
        }
    };

    // Triggered when the player submits their chosen route or when the 90s timer runs out
    const handlePlanningSubmit = async (segmentIds) => {
        setError('');
        setLoading(true);
        try{
            await submitRoute(game.id, segmentIds);
            setPhase(PHASES.EXECUTION);
        }catch(err){
            setError(err.message || 'Failed to submit the selected route.');
        }finally{
            setLoading(false);
        }
    };


    const handleExecutionComplete = (score) => {
        setFinalScore(score);
        setPhase(PHASES.RESULT);
    };

    // Resets states to transition into a brand new game loop
    const handleNewGameFromResult = () => {
        setGame(null);
        setFinalScore(null);
        setPhase(PHASES.IDLE);
        handleNewGame();
    };

    // Global loading overlay for API transitions
    if(loading){
        return (
        <Container className="py-5 text-center">
            <Spinner animation="border" variant="primary" />
        </Container>
        );
    }

    return (
        <>
        {/* Global Error Banner */}
        {error && (
            <Container className="pt-3">
            <Alert variant="danger" dismissible onClose={() => setError('')}>
                {error}
            </Alert>
            </Container>
        )}

        {/* PHASE: IDLE (Welcome screen) */}
        {phase === PHASES.IDLE && (
            <Container className="py-5 text-center">
            <h2 className="text-secondary fw-bold text-center my-3">Ready to Play?</h2>
            <p className="text-muted">Click the button below to start a new match.</p>
            <Button
                variant="primary"
                size="lg"
                onClick={handleNewGame}
            >
                New Game
            </Button>
            </Container>
        )}

        {phase === PHASES.SETUP && (
            <SetupPhase onReady={handleSetupReady} />
        )}


        {phase === PHASES.PLANNING && game && (
            <PlanningPhase game={game} onSubmit={handlePlanningSubmit} />
        )}

        {phase === PHASES.EXECUTION && game && (
            <ExecutionPhase game={game} onComplete={handleExecutionComplete} />
        )}

        {phase === PHASES.RESULT && (
            <ResultPhase score={finalScore} onNewGame={handleNewGameFromResult} />
        )}
        </>
    );
};

export default GamePage;