import { useState } from 'react'
import { Navigate, BrowserRouter as Router } from 'react-router-dom'
import { Route, Routes } from 'react-router-dom'
import Register from './pages/Register'
import Login from './pages/Login'

function App() {

  return (
    <>
    <Router>
        <Routes>
          <Route path="/register" element={<Register/>}/>
          <Route path="/login" element={<Login/>}/>
        </Routes>
      </Router>
    </>
  )
}

export default App