import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Alert } from 'react-bootstrap';
import { fetchLogin, fetchAllHotels } from '../services/api'; // Importamos la función para obtener todos los hoteles

const LoginForm = () => {
    const [tenant_id, setTenant_id] = useState(''); // Estado para almacenar el tenant_id
    const [email, setEmail] = useState(''); // Estado para el email
    const [password, setPassword] = useState(''); // Estado para la contraseña
    const [error, setError] = useState(''); // Estado para los errores
    const [loading, setLoading] = useState(false); // Estado para cargar el estado
    const [hotels, setHotels] = useState([]); // Estado para almacenar los hoteles disponibles

    const navigate = useNavigate();

    useEffect(() => {
        // Obtener los hoteles disponibles
        const getHotels = async () => {
            try {
                const data = await fetchAllHotels(); // Llamamos a la función para obtener los hoteles
                setHotels(data.body.hotels); // Asumiendo que la API devuelve los hoteles en "data.body.hotels"
            } catch (error) {
                setError('Error al cargar los hoteles.');
            }
        };

        // Obtener los hoteles al montar el componente
        getHotels();

        // Verificar si el tenant_id ya está en el localStorage
        const storedTenantId = localStorage.getItem('tenant_id');
        if (storedTenantId) {
            setTenant_id(storedTenantId); // Preseleccionamos el hotel
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetchLogin(tenant_id, email, password);
            localStorage.setItem('tenant_id', tenant_id);
            localStorage.setItem('user_id', response.body.user_id);
            localStorage.setItem('token', response.body.token);
            console.log('Login exitoso:', response);
            navigate('/dashboard');
        } catch (error) {
            console.error('Error durante el login:', error);
            setError('Credenciales incorrectas o error del servidor');
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterRedirect = () => {
        navigate('/register'); // Redirige a la página de registro
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-center text-2xl font-bold mb-6">Iniciar Sesión</h2>
                <Form onSubmit={handleLogin}>
                    <Form.Group className="mb-4" controlId="tenant_id">
                        <Form.Label className="block mb-2 font-medium">Selecciona un Hotel</Form.Label>
                        <Form.Control
                            as="select"
                            value={tenant_id}
                            onChange={(e) => setTenant_id(e.target.value)}
                            className="border border-gray-300 rounded-lg p-2 w-full"
                            required
                        >
                            <option value="">Selecciona un Hotel</option>
                            {hotels.map((hotel) => (
                                <option key={hotel.tenant_id} value={hotel.tenant_id}>
                                    {hotel.hotel_name}
                                </option>
                            ))}
                        </Form.Control>
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

                {/* Botón para redirigir a la página de registro */}
                <div className="mt-4 text-center">
                    <Button 
                        variant="link" 
                        onClick={handleRegisterRedirect} 
                        className="text-blue-500 hover:underline">
                        ¿No tienes una cuenta? Regístrate aquí
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;
