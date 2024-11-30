import React from 'react'
import { Container } from 'react-bootstrap';
import RoomDetail from '../components/RoomDetail';
import RoomComments from '../components/RoomComments';
import HotelServices from '../components/HotelServices';

const Login = () => {
  return (
    <>
        <RoomDetail></RoomDetail>
        <HotelServices></HotelServices>
        <RoomComments></RoomComments>
    </>
  )
}

export default Login