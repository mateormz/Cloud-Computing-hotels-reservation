import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Hook para obtener el parámetro de la URL
import { fetchRoomById } from '../services/api'; // Necesitarás esta función para obtener los datos de la habitación
import { Spinner, Alert } from 'react-bootstrap';

const RoomDetail = () => {
    const { roomId } = useParams(); // Obtenemos el ID de la habitación desde la URL
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRoom = async () => {
            try {
                // Recuperamos el tenant_id desde el localStorage
                const tenantId = localStorage.getItem('tenant_id');
                if (!tenantId) {
                    throw new Error('No se encontró el Tenant ID');
                }

                // Llamamos a la API pasando tanto el tenant_id como el room_id
                const data = await fetchRoomById(tenantId, roomId); // Pasamos ambos parámetros
                setRoom(data.body); // Asumiendo que el cuerpo de la respuesta contiene los datos de la habitación
            } catch (error) {
                setError('Error al cargar los detalles de la habitación.');
                console.error(error); // Para mayor visibilidad en la consola
            } finally {
                setLoading(false);
            }
        };

        fetchRoom();
    }, [roomId]); // Dependemos de roomId, que viene de la URL

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
        <div className="container mx-auto p-6">
            <h2 className="text-center text-2xl font-bold mb-6">{room.room_name}</h2>
            
            {/* Mostrar la imagen de la habitación si existe */}
            {room.image && (
                <div className="text-center mb-6">
                    <img
                        src={room.image} // Suponemos que room.image contiene la URL de la imagen
                        alt={`Imagen de ${room.room_name}`}
                        className="w-full max-w-md mx-auto rounded-lg shadow-md"
                    />
                </div>
            )}
            
            <p><strong>Tipo de habitación:</strong> {room.room_type}</p>
            <p><strong>Capacidad máxima:</strong> {room.max_persons} personas</p>
            <p><strong>Precio por noche:</strong> ${room.price_per_night}</p>
            <p><strong>Disponibilidad:</strong> {room.availability}</p>
            <p><strong>Descripción:</strong> {room.description}</p>
        </div>
    );
};

export default RoomDetail;