import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchRoomById } from '../services/api';
import { Spinner, Alert } from 'react-bootstrap';

const RoomDetail = () => {
    const { roomId } = useParams();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRoom = async () => {
            try {
                const tenantId = localStorage.getItem('tenant_id');
                if (!tenantId) {
                    throw new Error('No se encontró el Tenant ID');
                }

                const data = await fetchRoomById(tenantId, roomId);
                setRoom(data.body);
            } catch (error) {
                setError('Error al cargar los detalles de la habitación.');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchRoom();
    }, [roomId]);

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

    if (!room) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Alert variant="info">No se encontraron detalles de la habitación.</Alert>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 lg:px-12 py-12">
            {/* Título de la habitación */}
            <h2 className="text-4xl font-semibold text-gray-800 mb-10 text-center">
                {room.room_name}
            </h2>

            {/* Sección principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Imagen */}
                <div className="lg:col-span-2">
                    <img
                        src={room.image}
                        alt={`Imagen de ${room.room_name}`}
                        className="w-full h-96 object-cover rounded-lg shadow-md"
                    />
                </div>

                {/* Datos de la habitación */}
                <div className="bg-gray-50 p-6 rounded-lg shadow-lg space-y-4">
                    <h3 className="text-2xl font-medium text-gray-800">Datos de la Habitación</h3>
                    <div className="border-t border-gray-200 pt-4">
                        <p className="text-base text-gray-700">
                            <strong className="font-medium">Tipo de habitación:</strong> {room.room_type}
                        </p>
                        <p className="text-base text-gray-700">
                            <strong className="font-medium">Capacidad máxima:</strong> {room.max_persons} personas
                        </p>
                        <p className="text-base text-gray-700">
                            <strong className="font-medium">Precio por noche:</strong> ${room.price_per_night}
                        </p>
                        <p className="text-base text-gray-700">
                            <strong className="font-medium">Disponibilidad:</strong>{' '}
                            <span className="text-green-600 font-semibold">
                                {room.availability}
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Descripción */}
            <div className="mt-12 bg-gray-50 p-6 rounded-lg shadow-lg">
                <h3 className="text-2xl font-medium text-gray-800 mb-4">Descripción</h3>
                <p className="text-lg leading-relaxed text-gray-700">{room.description}</p>
            </div>
        </div>
    );
};

export default RoomDetail;
