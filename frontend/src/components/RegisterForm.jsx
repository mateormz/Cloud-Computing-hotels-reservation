import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Alert } from 'react-bootstrap';
import { fetchRegister } from '../services/api';

const RegisterForm = () => {
    const [tenant_id, setTenant_id] = useState('');
    const [name, setName] = useState(''); // Nuevo estado para el campo de nombre
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();

        try {
            const response = await fetchRegister(tenant_id, name, email, password); // Incluye name en la solicitud
            localStorage.setItem('user_id', response.user_id);
            console.log(response);
        } catch (error) {
            console.log(error);
            setError('Error durante el registro');
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-center text-2xl font-bold mb-6">Registro</h2>
                <Form onSubmit={handleRegister}>
                    <Form.Group className="mb-4" controlId="tenant_id">
                        <Form.Label className="block mb-2 font-medium">Tenant ID</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Ingresa el Tenant ID"
                            value={tenant_id}
                            onChange={(e) => setTenant_id(e.target.value)}
                            className="border border-gray-300 rounded-lg p-2 w-full"
                        />
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="name">
                        <Form.Label className="block mb-2 font-medium">Nombre</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Ingresa tu nombre"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="border border-gray-300 rounded-lg p-2 w-full"
                        />
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="email">
                        <Form.Label className="block mb-2 font-medium">Email</Form.Label>
                        <Form.Control
                            type="email"
                            placeholder="Ingresa tu email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="border border-gray-300 rounded-lg p-2 w-full"
                        />
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="password">
                        <Form.Label className="block mb-2 font-medium">Password</Form.Label>
                        <Form.Control
                            type="password"
                            placeholder="Ingresa tu contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="border border-gray-300 rounded-lg p-2 w-full"
                        />
                    </Form.Group>

                    <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg w-full">
                        Registrar
                    </Button>
                </Form>

                {error && <Alert variant="danger" className="mt-4">{error}</Alert>}
            </div>
        </div>
    );
};

export default RegisterForm;