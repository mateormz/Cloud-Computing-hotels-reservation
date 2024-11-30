import React, { useState, useEffect } from 'react';
import { fetchRoomsByTenant } from '../services/api';
import { Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const RoomsList = () => {
    const [rooms, setRooms] = useState([]);  // Estado para las habitaciones
    const [loading, setLoading] = useState(true);  // Estado de carga
    const [error, setError] = useState(null);  // Estado de error
    const [tenant_id, setTenantId] = useState(null);  // Estado del tenant_id

    useEffect(() => {
        // Obtén el tenant_id desde el localStorage
        const tenantIdFromStorage = localStorage.getItem('tenant_id');
        if (tenantIdFromStorage) {
            setTenantId(tenantIdFromStorage);  // Establece el tenant_id
        } else {
            setError('No se encontró el Tenant ID');  // Si no se encuentra el tenant_id
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (tenant_id) {
            const fetchRooms = async () => {
                try {
                    const data = await fetchRoomsByTenant(tenant_id);  // Llamamos a la API para obtener las habitaciones
                    // Filtrar las habitaciones para solo mostrar las disponibles
                    const availableRooms = data.body.rooms.filter(room => room.availability === 'disponible');
                    setRooms(availableRooms);  // Guardamos las habitaciones disponibles en el estado
                } catch (error) {
                    setError('Error al cargar las habitaciones.');  // En caso de error
                } finally {
                    setLoading(false);  // Terminamos de cargar
                }
            };

            fetchRooms();  // Llamamos a la función para obtener las habitaciones
        }
    }, [tenant_id]);  // Ejecutar cuando tenant_id cambie

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
            <h2 className="text-center text-2xl font-bold mb-6">Lista de Habitaciones Disponibles</h2>
            {rooms.length === 0 ? (
                <Alert variant="info" className="text-center">No hay habitaciones disponibles.</Alert>
            ) : (
                <ul className="space-y-4">
                    {rooms.map((room, index) => (
                        <li key={index} className="p-4 bg-white shadow-md rounded-lg">
                            <div className="flex items-center space-x-4">
                                {/* Mostrar la imagen de la habitación */}
                                {room.image && (
                                    <img
                                        src={room.image}
                                        alt={`Imagen de ${room.room_name}`}
                                        className="w-32 h-32 object-cover rounded-lg"
                                    />
                                )}
                                <div>
                                    <h3 className="text-lg font-semibold">
                                        <Link to={`/room/${room.room_id}`} className="text-blue-500 hover:underline">
                                            {room.room_name}
                                        </Link>
                                    </h3>
                                    <p><strong>Tipo de habitación:</strong> {room.room_type}</p>
                                    <p><strong>Capacidad máxima:</strong> {room.max_persons} personas</p>
                                    <p><strong>Precio por noche:</strong> ${room.price_per_night}</p>
                                    <p><strong>Disponibilidad:</strong> {room.availability}</p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default RoomsList;
