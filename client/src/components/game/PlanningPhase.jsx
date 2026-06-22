import {useState, useEffect} from 'react';
import {Container, Row, Col, Alert, Spinner, Badge, ListGroup, Button, Card} from 'react-bootstrap';
import dayjs from 'dayjs';
import {getNetworkSegments} from '../../api.js';

const PlanningPhase = ({game, onSubmit}) =>{
    const [networkData, setNetworkData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [validationError, setValidationError] = useState('');
    const [selectedSegmentIds, setSelectedSegmentIds] = useState([]);
    const [secondsLeft, setSecondsLeft] = useState(null);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        getNetworkSegments()
            .then((data) => setNetworkData(data))
            .catch((err) => setError(err.message || 'Failed to fetch network layout.'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!game?.planningDeadline) return;

        const calculateTimeLeft = () => {
            const diff = dayjs(game.planningDeadline).diff(dayjs(), 'second');
            return diff > 0 ? diff : 0;
        };

        setSecondsLeft(calculateTimeLeft());
        
        const interval = setInterval(() => {
            const diff = calculateTimeLeft();
            setSecondsLeft(diff);
        }, 1000);

        return () => clearInterval(interval);
    }, [game?.planningDeadline]);

    useEffect(() => {
        if (secondsLeft === 0 && !submitted) {
            setSubmitted(true);
            onSubmit(selectedSegmentIds);
        }
    }, [secondsLeft, submitted, onSubmit, selectedSegmentIds]);

    const handleSegmentClick = (segmentId) => {
        if (submitted) return;
        if (validationError) setValidationError('');

        setSelectedSegmentIds((prev) => {
            if (prev.includes(segmentId)) return prev; 
            return [...prev, segmentId];
        });
    };

    const handleUndo = () => {
        if (submitted) return;
        if (validationError) setValidationError('');
        setSelectedSegmentIds((prev) => prev.slice(0, -1));
    };

    const handleSubmit = () => {
        if(submitted) return;

        if(selectedSegmentIds.length === 0){
            setValidationError('You cannot manually submit an empty route. Please select at least one segment.');
            return;
        }

        setValidationError('');
        setSubmitted(true);
        onSubmit(selectedSegmentIds);
    };

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

    const timerVariant = secondsLeft > 30 ? 'success' : secondsLeft > 10 ? 'warning' : 'danger';

    return(
        <Container className="py-4">

            <Row className="align-items-center mb-4">
                <Col>
                    <h2 className="text-secondary fw-bold text-center my-3">Planning Phase</h2>
                </Col>
                <Col xs="auto">
                    <Badge bg={timerVariant} className="fs-5">
                        ⏱ {secondsLeft !== null ? `${secondsLeft}s` : '…'}
                    </Badge>
                </Col>
            </Row>

            {validationError && (
                <Alert variant="warning" className="shadow-sm mb-4" onClose={() => setValidationError('')} dismissible>
                    ⚠️ {validationError}
                </Alert>
            )}

            {/* starting station + destination station */}
            <Row className="mb-4">
                <Col md={6} className="mb-2">
                    <Card className="border-success shadow-sm bg-light">
                        <Card.Body className="py-3">
                            <span className="text-muted text-uppercase small d-block">Starting Station</span>
                            <strong className="fs-5">
                                {networkData?.stations?.find((s) => s.id === game.startStationId)?.name ?? '—'}
                            </strong>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} className="mb-2">
                    <Card className="border-danger shadow-sm bg-light">
                        <Card.Body className="py-3">
                            <span className="text-muted text-uppercase small d-block">Destination Station</span>
                            <strong className="fs-5">
                                {networkData?.stations?.find((s) => s.id === game.endStationId)?.name ?? '—'}
                            </strong>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* List of all stations without lines */}
            <Row className="mb-4">
                <Col>
                    <Card className="shadow-sm border-secondary">
                        <Card.Header className="bg-secondary text-white fw-bold">
                            Network Stations
                        </Card.Header>
                        <Card.Body className="bg-light">
                            <p className="text-muted small mb-3">
                                Here are all the stations available in the network. Use the segment list below to mentally reconstruct the lines and build your route.
                            </p>

                            <div className="d-flex flex-wrap gap-2">
                                {networkData?.stations?.map((station) => (
                                    <Badge 
                                        key={station.id} 
                                        bg="dark" 
                                        className="px-3 py-2 fs-6 fw-normal shadow-sm text-wrap text-center"
                                        style={{ minWidth: '130px' }}
                                    >
                                        🚉 {station.name}
                                    </Badge>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* List of all segments + current route*/}
            <Row>
                {/* avaiable segments */}
                <Col md={6} className="mb-4">
                    <h5>Available Segments</h5>
                    <p className="text-muted small">
                        Click on segments in the exact order you want to travel. Each segment can be selected only once.
                    </p>
                    <ListGroup style={{ maxHeight: '400px', overflowY: 'auto' }} className="shadow-sm">
                        {networkData?.segments?.map((seg) => {
                            const isSelected = selectedSegmentIds.includes(seg.id);
                            return (
                                <ListGroup.Item
                                    key={seg.id}
                                    action
                                    active={isSelected}
                                    disabled={isSelected || submitted}
                                    onClick={() => handleSegmentClick(seg.id)}
                                    className="d-flex justify-content-between align-items-center"
                                >
                                    <span>{seg.stationAName} — {seg.stationBName}</span>
                                    {isSelected && (
                                        <Badge bg="light" text="dark">
                                            #{selectedSegmentIds.indexOf(seg.id) + 1}
                                        </Badge>
                                    )}
                                </ListGroup.Item>
                            );
                        })}
                    </ListGroup>
                </Col>

                {/* planned journey by the player */}
                <Col md={6} className="mb-4">
                    <h5>Your Planned Route</h5>
                    <p className="text-muted small">Review your sequential selection before submitting.</p>
                    {selectedSegmentIds.length === 0 ? (
                        <Alert variant="secondary">No segments selected yet.</Alert>
                    ) : (
                        <ListGroup className="mb-3 shadow-sm" style={{ maxHeight: '340px', overflowY: 'auto' }}>
                            {selectedSegmentIds.map((segId, idx) => {
                                const seg = networkData?.segments?.find((s) => s.id === segId);
                                return (
                                    <ListGroup.Item key={segId} className="d-flex align-items-center">
                                        <Badge bg="primary" className="me-3 px-2 py-1">{idx + 1}</Badge>
                                        <span>{seg ? `${seg.stationAName} — ${seg.stationBName}` : segId}</span>
                                    </ListGroup.Item>
                                );
                            })}
                        </ListGroup>
                    )}

                    {/* action buttons */}
                    <div className="d-flex gap-2 justify-content-end">
                        <Button
                            variant="outline-secondary"
                            onClick={handleUndo}
                            disabled={selectedSegmentIds.length === 0 || submitted}
                        >
                            ↩ Undo Last Step
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={submitted}
                        >
                            {submitted ? 'Submitting...' : 'Confirm Route'}
                        </Button>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default PlanningPhase;