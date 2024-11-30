import React, { useState, useEffect } from 'react';
import { fetchAllHotels } from '../services/api'; // Importamos la función para obtener todos los hoteles
import { Alert, Spinner } from 'react-bootstrap'; // Usamos componentes de react-bootstrap para los estados de carga y error
import { useNavigate } from 'react-router-dom'; // Usamos useNavigate para redirigir al login

const HotelsList = () => {
    const [hotels, setHotels] = useState([]); // Estado para almacenar los hoteles
    const [loading, setLoading] = useState(true); // Estado para controlar si está cargando
    const [error, setError] = useState(null); // Estado para manejar errores

    const navigate = useNavigate(); // Hook para la redirección

    useEffect(() => {
        const getHotels = async () => {
            try {
                const data = await fetchAllHotels(); // Llamamos a la función para obtener los hoteles
                setHotels(data.body.hotels); // Asumiendo que la API devuelve los hoteles en "data.body.hotels"
            } catch (error) {
                setError('Error al cargar los hoteles.'); // Si hay un error, lo mostramos
            } finally {
                setLoading(false); // Termina la carga
            }
        };

        getHotels(); // Llamamos la función para obtener los hoteles al montar el componente
    }, []); // Solo se ejecuta una vez cuando el componente se monta

    const handleHotelClick = (tenant_id) => {
        // Guardamos el tenant_id del hotel seleccionado en el localStorage
        localStorage.setItem('tenant_id', tenant_id);
        // Redirigimos al formulario de login
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Alert variant="danger">{error}</Alert>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <h2 className="text-center text-2xl font-bold mb-6">Lista de Hoteles</h2>
            {hotels.length === 0 ? (
                <Alert variant="info" className="text-center">No hay hoteles disponibles.</Alert>
            ) : (
                <ul className="space-y-4">
                    {hotels.map((hotel, index) => (
                        <li key={index} className="p-4 bg-white shadow-md rounded-lg cursor-pointer" onClick={() => handleHotelClick(hotel.tenant_id)}>
                            <div className="flex items-center space-x-4">
                                {/* Mostrar la imagen del hotel si está disponible */}
                                {hotel.image && (
                                    <img
                                        src={hotel.image}
                                        alt={`Imagen de ${hotel.hotel_name}`}
                                        className="w-32 h-32 object-cover rounded-lg"
                                    />
                                )}
                                <div>
                                    <h3 className="text-lg font-semibold">{hotel.hotel_name}</h3>
                                    <p><strong>Ubicación:</strong> {hotel.hotel_location}</p>
                                    <p><strong>Descripción:</strong> {hotel.description}</p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default HotelsList;