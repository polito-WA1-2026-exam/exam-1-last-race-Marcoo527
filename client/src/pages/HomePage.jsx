import {useContext } from 'react';
import {UserContext } from '../contexts/UserContext.js';
import {Container, Row, Col, Card, Button} from 'react-bootstrap';
import {useNavigate} from 'react-router-dom';

const HomePage = () => {
    const {user} = useContext(UserContext);
    const navigate = useNavigate();

    return (
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col lg={8}>
                    <div className="text-center mb-5"></div>
                    <h1 className="mb-4 text-dark">Last Race 🚇</h1>
                    <p className="lead text-secondary">
                        A strategic planning game inspired by "Race the Rails": start from a departure station, 
                        reach your destination in the shortest time possible, and collect as many coins as you can!
                    </p>

                    <Card className="shadow-sm border-0 mb-4">
                        <Card.Body className="p-4">
                            <h3 className="mb-4">🎮 How it works</h3>
                            <Row className="g-4">
                                <Col md={6}>
                                    <div className="h-100 p-3 border rounded-3">
                                        <h5>🗺️ Study the network</h5>
                                        <p className="mb-0 text-secondary">
                                            Observe the complete subway map and memorize connections.
                                        </p>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="h-100 p-3 border rounded-3">
                                        <h5>⏱️ Plan in 90 seconds</h5>
                                        <p className="mb-0 text-secondary">
                                            Reconstruct the route using only station names and segments.
                                        </p>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="h-100 p-3 border rounded-3">
                                        <h5>🚆 Execute the route</h5>
                                        <p className="mb-0 text-secondary">
                                            Your path is validated and random events affect your coins.
                                        </p>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="h-100 p-3 border rounded-3">
                                        <h5>🏆 Reach the leaderboard</h5>
                                        <p className="mb-0 text-secondary">
                                            Finish with the highest amount of coins possible.
                                        </p>
                                    </div>
                                </Col>
                            </Row>
                            <hr className="my-4" />
                            <div className="bg-light rounded-3 p-3">
                                <h5 className="mb-2">📌 Rules</h5>
                                <ul className="mb-0">
                                    <li>The route must start at the Departure station and end at the Arrival station.</li>
                                    <li>Segments must be continuous (each segment must connect to the previous one).</li>
                                    <li>Each segment can be used only once per game.</li>
                                    <li>An invalid route means losing all coins.</li>
                                </ul>
                            </div>
                        </Card.Body>
                    </Card>
                    <div className="text-center">
                        {user ? (
                            <Button variant="primary" size="lg" className="px-5 py-3 fw-semibold" onClick={() => navigate('/game')}>
                                Start a Game
                            </Button>
                        ) : (
                            <Card className="border-warning shadow-sm">
                                <Card.Body className="py-4">
                                    <p className="mb-3 fs-5">🔒 Login required to play and view the leaderboard</p>
                                    <Button variant="warning" size="lg" onClick={() => navigate('/login')}>
                                        Go to Login
                                    </Button>
                                </Card.Body>
                            </Card>
                        )}
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default HomePage;