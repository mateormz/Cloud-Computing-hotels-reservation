import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Room from './pages/Room';
import NavBar from './components/NavBar';
import Profile from './pages/Profile';  // Asegúrate de tener este componente
import Reservations from './pages/Reservations';  // Asegúrate de tener este componente
import Payments from './pages/Payments';  // Asegúrate de tener este componente

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
          <Route path="/profile" element={<Profile />} /> {/* Ruta para el perfil */}
          <Route path="/reservations" element={<Reservations />} /> {/* Ruta para reservas */}
          <Route path="/payments" element={<Payments />} /> {/* Ruta para pagos */}
          <Route path="/" element={<Dashboard />} /> {/* Ruta por defecto */}
        </Routes>
      </Router>
    </>
  );
}

export default App;
