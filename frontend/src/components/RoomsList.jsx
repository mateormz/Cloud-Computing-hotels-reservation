import React, { useState, useEffect } from 'react';
import { fetchRoomsByTenant } from '../services/api';
import { Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const RoomsList = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tenant_id, setTenantId] = useState(null);

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
                    setRooms(data.body.rooms);
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
            <h2 className="text-center text-2xl font-bold mb-6">Lista de Habitaciones</h2>
            {rooms.length === 0 ? (
                <Alert variant="info" className="text-center">No hay habitaciones disponibles.</Alert>
            ) : (
                <ul className="space-y-4">
                    {rooms.map((room, index) => (
                        <li key={index} className="p-4 bg-white shadow-md rounded-lg">
                            <h3 className="text-lg font-semibold">
                                <Link to={`/room/${room.room_id}`} className="text-blue-500 hover:underline">
                                    {room.room_name}
                                </Link>
                            </h3>
                            <p><strong>Tipo de habitación:</strong> {room.room_type}</p>
                            <p><strong>Capacidad máxima:</strong> {room.max_persons} personas</p>
                            <p><strong>Precio por noche:</strong> ${room.price_per_night}</p>
                            <p><strong>Disponibilidad:</strong> {room.availability}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default RoomsList;