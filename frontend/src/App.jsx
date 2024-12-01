import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Room from './pages/Room';
import NavBar from './components/NavBar';
import Footer from './components/Footer'
import Start from './pages/Start'
import User from './pages/User';

function App() {
  return (
    <>
      <Router>
        <NavBar />
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/room/:roomId" element={<Room />} />
          <Route path="/profile" element={<User />} /> {/* Ruta para el perfil */}
          <Route path="/" element={<Dashboard />} /> {/* Ruta por defecto */}
          <Route path="/home" element={<Start/>}/>
        </Routes>
        <Footer></Footer>
      </Router>
    </>
  );
}

export default App;
