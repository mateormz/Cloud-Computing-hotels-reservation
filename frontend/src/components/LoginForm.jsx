import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Alert } from 'react-bootstrap';
import { fetchLogin } from '../services/api';

const LoginForm = () => {
    const [tenant_id, setTenant_id] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetchLogin(tenant_id, email, password);
            localStorage.setItem('user_id', response.body.user_id);
            localStorage.setItem('token', response.body.token);
            console.log('Login exitoso:', response);
            // navigate('/dashboard');
        } catch (error) {
            console.error('Error durante el login:', error);
            setError('Credenciales incorrectas o error del servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-center text-2xl font-bold mb-6">Iniciar Sesión</h2>
                <Form onSubmit={handleLogin}>
                    <Form.Group className="mb-4" controlId="tenant_id">
                        <Form.Label className="block mb-2 font-medium">Tenant ID</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Ingresa el Tenant ID"
                            value={tenant_id}
                            onChange={(e) => setTenant_id(e.target.value)}
                            className="border border-gray-300 rounded-lg p-2 w-full"
                            required
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
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="password">
                        <Form.Label className="block mb-2 font-medium">Contraseña</Form.Label>
                        <Form.Control
                            type="password"
                            placeholder="Ingresa tu contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="border border-gray-300 rounded-lg p-2 w-full"
                            required
                        />
                    </Form.Group>

                    <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg w-full"
                        disabled={loading}>
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </Button>
                </Form>

                {error && <Alert variant="danger" className="mt-4">{error}</Alert>}
            </div>
        </div>
    );
};

export default LoginForm;