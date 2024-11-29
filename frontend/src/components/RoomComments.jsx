import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Importamos useParams para acceder a los parámetros de la URL
import { fetchCommentsByRoom } from '../services/api'; // Importamos la función de fetch
import { Spinner, Alert } from 'react-bootstrap';

const RoomComments = () => {
    const { roomId } = useParams(); // Extraemos roomId desde los params de la URL
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tenant_id, setTenantId] = useState(null);

    useEffect(() => {
        // Obtener el tenant_id del localStorage
        const tenantIdFromStorage = localStorage.getItem('tenant_id');
        if (tenantIdFromStorage) {
            setTenantId(tenantIdFromStorage);
        } else {
            setError('No se encontró el Tenant ID');
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (tenant_id && roomId) {
            const getComments = async () => {
                try {
                    const commentsData = await fetchCommentsByRoom(tenant_id, roomId);
                    setComments(commentsData); // Guardamos los comentarios en el estado
                } catch (error) {
                    setError('Error al cargar los comentarios.');
                } finally {
                    setLoading(false);
                }
            };

            getComments(); // Ejecutamos la función para obtener los comentarios
        }
    }, [tenant_id, roomId]); // Se ejecuta cuando `tenant_id` y `roomId` cambian

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
            <h2 className="text-center text-2xl font-bold mb-6">Comentarios de la habitación</h2>
            {comments.length === 0 ? (
                <Alert variant="info" className="text-center">No hay comentarios disponibles.</Alert>
            ) : (
                <ul className="space-y-4">
                    {comments.map((comment) => (
                        <li key={comment.comment_id} className="p-4 bg-white shadow-md rounded-lg">
                            <p><strong>Comentario:</strong> {comment.comment_text}</p>
                            <p><strong>Usuario ID:</strong> {comment.user_id}</p>
                            <p><strong>Fecha:</strong> {comment.created_at}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default RoomComments;