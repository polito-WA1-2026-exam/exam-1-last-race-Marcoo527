import {useState, useContext} from 'react';
import {Container, Row, Col, Card, Form, Button, Alert} from 'react-bootstrap';
import {useNavigate} from 'react-router-dom';
import {UserContext} from '../contexts/UserContext.js';
import {login} from '../api.js';

const LoginPage = () =>{

    const { setUser } =useContext(UserContext);
    const navigate =useNavigate();

    const [username, setUsername] =useState('');
    const [password, setPassword] =useState('');
    const [error, setError] =useState('');
    const [loading, setLoading] =useState(false);


    const validate = ()=>{
        if (!username.trim()) {
            return 'Username is required.';
        }
        if (!password) {
            return 'Password is required.';
        }
            return null;
        };

    const handleSubmit=async(e) =>{
        e.preventDefault();
        setError('');


        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        try{

            const loggedUser = await login(username, password);
        
            setUser(loggedUser);
            navigate('/');
        }catch(err){
            setError(err.message || 'Invalid username and/or password.');
        }finally{
            setLoading(false);
        }
    };

    return (
        <Container className="py-5">
        <Row className="justify-content-center">
            <Col md={5}>
            <Card className="shadow-sm">
                <Card.Header><strong>Login to Last Race</strong></Card.Header>
                <Card.Body>
                
                {error && <Alert variant="danger">{error}</Alert>}
                
                <Form onSubmit={handleSubmit} noValidate>
                    
                    {/* Username Input */}
                    <Form.Group className="mb-3" controlId="username">
                    <Form.Label>Username</Form.Label>
                    <Form.Control
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        disabled={loading}
                        autoFocus
                    />
                    </Form.Group>

                    {/* Password Input */}
                    <Form.Group className="mb-4" controlId="password">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        disabled={loading}
                    />
                    </Form.Group>

                    {/* Submit Button */}
                    <div className="d-grid">
                    <Button type="submit" variant="primary" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </Button>
                    </div>

                </Form>
                </Card.Body>
            </Card>
            </Col>
        </Row>
        </Container>
    );
};

export default LoginPage;