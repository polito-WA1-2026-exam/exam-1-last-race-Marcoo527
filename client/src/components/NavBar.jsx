import {useContext} from 'react';
import {UserContext} from '../contexts/UserContext.js';
import {useNavigate, NavLink} from 'react-router-dom';
import {Navbar, Nav, Container, Button} from 'react-bootstrap';
import {logout} from '../api.js';

const NavBar = () => {

  const{user, setUser}= useContext(UserContext);
  const navigate = useNavigate();


  const handleLogout = async () => {
    try{

      await logout();
      
      setUser(null);
      navigate('/');
    }catch (err){
      console.error("Logout error", err);
      setUser(null);
      navigate('/');
    }
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm py-3">
      <Container>

        <Navbar.Brand as={NavLink} to="/">Last Race 🚇</Navbar.Brand>
        
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          

          <Nav className="me-auto">

            {user && (
              <>
                <Nav.Link as={NavLink} to="/game">Play</Nav.Link>
                <Nav.Link as={NavLink} to="/ranking">Leaderboard</Nav.Link>
              </>
            )}
          </Nav>
          
          <Nav>
            {user ? (
              <>
                <Navbar.Text className="me-3">
                  Logged in as: <strong>{user.username}</strong>
                </Navbar.Text>
                <Button variant="outline-light" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <Nav.Link as={NavLink} to="/login">Login</Nav.Link>
            )}
          </Nav>
          
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavBar;