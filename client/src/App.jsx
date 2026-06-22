import {useState, useEffect} from 'react';
import {BrowserRouter, Routes, Route, Navigate, Outlet} from 'react-router-dom';
import {UserContext} from './contexts/UserContext.js';
import {getCurrentUser} from './api.js';
import NavBar from './components/NavBar.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import GamePage from './pages/GamePage.jsx';
import RankingPage from './pages/RankingPage.jsx';

const HeaderLayout = () =>{
    return (
        <>
            <NavBar />
            <Outlet />
        </>
    );
};

const App = () => {
    const [user, setUser] = useState(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        getCurrentUser()
            .then((u) => setUser(u))
            .catch(() => setUser(null))
            .finally(() => setChecking(false));
    }, []);

    if(checking){
        return <p className="text-center mt-5">Caricamento in corso...</p>;
    }

    return(
        <UserContext.Provider value={{ user, setUser }}>
            <BrowserRouter>
                <Routes>
                    <Route element={<HeaderLayout />}>
                        <Route path="/" element={<HomePage />} />
                        
                        <Route
                            path="/login"
                            element={user ? <Navigate to="/" replace /> : <LoginPage />}
                        />
                        
                        <Route
                            path="/game"
                            element={user ? <GamePage /> : <Navigate to="/login" replace />}
                        />
                        
                        <Route
                            path="/ranking"
                            element={user ? <RankingPage /> : <Navigate to="/login" replace />}
                        />

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </UserContext.Provider>
    );
};

export default App;