import {useState, useEffect} from 'react';
import {Container, Row, Col, Button, Alert, Spinner, Badge, ListGroup, Card} from 'react-bootstrap';
import {getNetwork} from '../../api.js';


const LINE_COLORS = ['success', 'primary', 'danger', 'warning'];

const SetupPhase = ({ onReady }) => {
    const [network, setNetwork] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        getNetwork()
            .then((data) => setNetwork(data))
            .catch((err) => setError(err.message || 'Failed to load the subway network map.'))
            .finally(() => setLoading(false));
    }, []);


    if(loading){
        return(
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
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

    return (
        <Container className="py-4">
            <h2 className="text-secondary fw-bold text-center my-3">Setup Phase — Network Map</h2>
            <p className="text-muted">
                Study the subway network layout. When you are ready, click <strong>Start Game</strong>.
            </p>

            <Row className="mb-4">
                {network && network.lines.map((line, idx) => {
                    // For each line, filter the segments that belong to it
                    const lineSegments = network.segments.filter((seg) => seg.lineId === line.id);
                    const color = LINE_COLORS[idx % LINE_COLORS.length];
                    
                    return (
                        <Col key={line.id} md={6} className="mb-3">
                            <Card border={color} className="shadow-sm">
                                <Card.Header>
                                    <Badge bg={color} className="px-2 py-1">{line.name}</Badge>
                                </Card.Header>
                                <Card.Body className="p-2">
                                    <ListGroup variant="flush">
                                        {lineSegments.map((seg) => (
                                            <ListGroup.Item key={seg.id} className="py-1 px-2">
                                                {seg.stationAName} ↔ {seg.stationBName}
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                </Card.Body>
                            </Card>
                        </Col>
                    );
                })}
            </Row>

            <div className="text-center">
                <Button variant="success" size="lg" onClick={onReady}>
                    Start Game
                </Button>
            </div>
        </Container>
    );
};

export default SetupPhase;