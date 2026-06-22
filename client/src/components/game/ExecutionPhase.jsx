import {useState, useEffect} from 'react';
import {Container, Alert, Spinner, Card, Button, Badge, ProgressBar} from 'react-bootstrap';
import {executeGame} from '../../api.js';

const ExecutionPhase = ({game, onComplete}) => {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    // Call the server once on mount to validate the route and simulate all stage events.
    useEffect(() => {
        executeGame(game.id)
            .then((data) => setResult(data))
            .catch((err) => setError(err.message || 'Failed to execute the route validation.'))
            .finally(() => setLoading(false));
    }, [game.id]);


    if(loading){
        return(
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Validating route and calculating journey outcomes...</p>
            </Container>
        );
    }

    if(error){
        return(
            <Container className="pt-3">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    // Guard Clause: Invalid or incomplete route triggers a zero-score failure screen
    if(!result || !result.valid) {
        return(
            <Container className="py-4">
                <Alert variant="danger" className="shadow-sm">
                    <Alert.Heading>Invalid Route!</Alert.Heading>
                    <p className="mb-0">
                        The submitted path was invalid, disconnected, or incomplete. You have lost all your coins.
                    </p>
                </Alert>
                <Button variant="primary" onClick={() => onComplete(0)}>
                    View Result
                </Button>
            </Container>
        );
    }

    const currentStep = result.steps[currentStepIndex];
    const isLastStep = currentStepIndex === result.steps.length - 1;
    const progress = Math.round(((currentStepIndex + 1) / result.steps.length) * 100); //for the progress bar

    let effectVariant;

    if(currentStep.effect > 0){
        effectVariant = 'success';
    }else if (currentStep.effect < 0){
        effectVariant = 'danger';
    }else{
        effectVariant = 'secondary';
    }

    return(
        <Container className="py-4">
            <h2 className="text-secondary fw-bold text-center my-3">Execution Phase</h2>
            <p className="text-muted">
                Step {currentStepIndex + 1} of {result.steps.length}
            </p>
            
            <ProgressBar now={progress} label={`${progress}%`} className="mb-4 shadow-sm" />

            <Card className="mb-4 shadow-sm">
                <Card.Body>
                    <Card.Title>Random Event</Card.Title>
                    <Card.Text className="fs-5">{currentStep.description}</Card.Text>
                    <Badge bg={effectVariant} className="fs-6">
                        {currentStep.effect > 0 ? `+${currentStep.effect}` : currentStep.effect} 🪙
                    </Badge>
                </Card.Body>
                <Card.Footer className="text-muted">
                    Coins after this step: <strong>{currentStep.coinsAfter} 🪙</strong>
                </Card.Footer>
            </Card>

            {isLastStep ? (
                <Button variant="success" size="lg" onClick={() => onComplete(result.score)}>
                    View Final Result
                </Button>
            ) : (
                <Button
                    variant="primary"
                    onClick={() => setCurrentStepIndex((prev) => prev + 1)}
                >
                    Next →
                </Button>
            )}
        </Container>
    );
};

export default ExecutionPhase;