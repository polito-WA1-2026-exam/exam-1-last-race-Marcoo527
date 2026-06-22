import {useContext} from 'react';
import {Container, Card, Button, Alert} from 'react-bootstrap';
import {UserContext} from '../../contexts/UserContext.js';

const ResultPhase =({score, onNewGame}) =>{
    const{user} = useContext(UserContext);

    let variant;
    //colors
    if (score === 0) {
        variant = 'danger';
    } else if (score > 20) {
        variant = 'success';
    } else if (score === 20) {
        variant = 'info';
    } else {
        variant = 'warning';
    }

    return(
        <Container className="py-5">
            <Card className={`border-${variant} text-center shadow-sm`} style={{ maxWidth: '480px', margin: '0 auto' }}>
                <Card.Header className={`bg-${variant} text-white`}>
                    <strong>Match Completed!</strong>
                </Card.Header>
                <Card.Body>
                    <p className="fs-1 my-3">{score} 🪙</p>
                    
                    {score === 0 ? (
                        <Alert variant="danger" className="mb-3">
                            Invalid or incomplete route — you lost all your coins.
                        </Alert>
                    ) : score > 20 ? (
                        <Alert variant="success" className="mb-3">
                            Great job, {user?.username || 'Player'}! You earned extra coins during your journey.
                        </Alert>
                    ) : score === 20 ? (
                        <Alert variant="info" className="mb-3">
                            Tie! You finished the race with your exact initial coins.
                        </Alert>
                    ) : (
                        <Alert variant="warning" className="mb-3">
                            You lost a few coins along the way, but you completed the journey!
                        </Alert>
                    )}
                    
                    <Button variant="primary" size="lg" onClick={onNewGame}>
                        Play Again
                    </Button>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ResultPhase;