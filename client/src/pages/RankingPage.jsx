import {useState, useEffect} from 'react';
import {Container, Row, Col, Table, Alert, Spinner} from 'react-bootstrap';
import {getRanking} from '../api.js';

const RankingPage = () =>{
    const [ranking, setRanking] =useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');


    useEffect(() =>{
        getRanking()
            .then((data) => setRanking(data))
            .catch((err) => setError(err.message || 'Failed to load the leaderboard.'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <Container className="py-4">
            <Row className="justify-content-center">
                <Col md={6}>
                    <h2 className="mb-4 text-secondary fw-bold">🏆 Global Leaderboard</h2>

                    {loading && <Spinner animation="border" variant="primary" />}
                    
                    {error && <Alert variant="danger">{error}</Alert>}
                    
                    {!loading && !error && (
                        ranking.length === 0 ? (
                            <Alert variant="info">No completed games yet.</Alert>
                        ) : (
                            <Table striped bordered hover responsive>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Player</th>
                                        <th>High Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ranking.map((entry, index) => (
                                        <tr key={entry.username}>
                                            <td>{index + 1}</td>
                                            <td>{entry.username}</td>
                                            <td>{entry.bestScore} 🪙</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        )
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default RankingPage;