import { Navigate, BrowserRouter as Router } from 'react-router-dom'
import { Route, Routes } from 'react-router-dom'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Room from './pages/Room'
import Start from './pages/Start'
import NavBar from './components/NavBar'
import Footer from './components/Footer'

function App() {

  return (
    <>
    <Router>
        <NavBar></NavBar>
        <Routes>
          <Route path="/register" element={<Register/>}/>
          <Route path="/login" element={<Login/>}/>
          <Route path="/dashboard" element={<Dashboard/>}/>
          <Route path="/room/:roomId" element={<Room/>}/>
          <Route path="/home" element={<Start/>}/>
        </Routes>
        <Footer></Footer>
      </Router>
    </>
  )
}

export default App