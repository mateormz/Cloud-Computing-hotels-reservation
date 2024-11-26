import React from 'react';
import RegisterForm from '../components/RegisterForm';
import { Container } from 'react-bootstrap';

const Register = () => {
  return (
    <Container className="mt-5">
      <RegisterForm />
    </Container>
  );
};

export default Register;