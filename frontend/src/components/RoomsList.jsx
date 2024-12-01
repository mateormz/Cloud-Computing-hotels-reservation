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
        const tenantIdFromStorage = localStorage.getItem('tenant_id');
        if (tenantIdFromStorage) {
            setTenantId(tenantIdFromStorage);
        } else {
            setError('No se encontró el Tenant ID');
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (tenant_id) {
            const fetchRooms = async () => {
                try {
                    const data = await fetchRoomsByTenant(tenant_id);
                    const availableRooms = data.body.rooms.filter(room => room.availability === 'disponible');
                    setRooms(availableRooms);
                } catch (error) {
                    setError('Error al cargar las habitaciones.');
                } finally {
                    setLoading(false);
                }
            };

            fetchRooms();
        }
    }, [tenant_id]);

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
            {/* Título principal */}
            <h1 className="text-4xl font-bold text-gray-900 text-left mb-4">Lista de Habitaciones Disponibles</h1>

            {/* Subtítulo */}
            <h2 className="text-lg font-light text-gray-600 text-left mb-8">
                ¡Encuentra la habitación perfecta!
            </h2>

            {/* Habitaciones disponibles */}
            {rooms.length === 0 ? (
                <Alert variant="info" className="text-center">No hay habitaciones disponibles en este momento.</Alert>
            ) : (
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rooms.map((room, index) => (
                        <li key={index} className="bg-white shadow-md rounded-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
                            <div className="relative">
                                {room.image && (
                                    <img
                                        src={room.image}
                                        alt={`Imagen de ${room.room_name}`}
                                        className="w-full h-40 object-cover rounded-t-lg"
                                    />
                                )}
                                <div className="absolute top-0 left-0 p-4 bg-black bg-opacity-50 text-white rounded-t-lg">
                                    <h3 className="text-md font-semibold">{room.room_name}</h3>
                                </div>
                            </div>
                            <div className="p-4">
                                <p><strong>Tipo:</strong> {room.room_type}</p>
                                <p><strong>Capacidad:</strong> {room.max_persons} personas</p>
                                <p><strong>Precio:</strong> ${room.price_per_night} / noche</p>
                                <p><strong>Disponibilidad:</strong> <span className={`font-semibold ${room.availability === 'disponible' ? 'text-green-500' : 'text-red-500'}`}>{room.availability}</span></p>
                            </div>
                            <div className="p-4 bg-gray-100 flex justify-between items-center">
                                <Link to={`/room/${room.room_id}`} className="text-blue-500 hover:underline">Ver detalles</Link>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default RoomsList;
