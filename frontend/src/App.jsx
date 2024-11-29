import { Navigate, BrowserRouter as Router } from 'react-router-dom'
import { Route, Routes } from 'react-router-dom'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Room from './pages/Room'

function App() {

  return (
    <>
    <Router>
        <Routes>
          <Route path="/register" element={<Register/>}/>
          <Route path="/login" element={<Login/>}/>
          <Route path="/dashboard" element={<Dashboard/>}/>
          <Route path="/room/:roomId" element={<Room/>}/>
        </Routes>
      </Router>
    </>
  )
}

export default App