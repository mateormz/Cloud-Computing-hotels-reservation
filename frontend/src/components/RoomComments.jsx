import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchCommentsByRoom } from '../services/api'; 
import { Spinner, Alert } from 'react-bootstrap';
import CommentForm from './CommentForm';

const RoomComments = () => {
    const { roomId } = useParams(); // Extraemos roomId desde los params de la URL
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tenantId, setTenantId] = useState(null);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        // Obtener el tenant_id y user_id del localStorage
        const tenantIdFromStorage = localStorage.getItem('tenant_id');
        const userIdFromStorage = localStorage.getItem('user_id');
        
        if (tenantIdFromStorage && userIdFromStorage) {
            setTenantId(tenantIdFromStorage);
            setUserId(userIdFromStorage);
        } else {
            setError('No se encontró el Tenant ID o el User ID');
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (tenantId && roomId) {
            const getComments = async () => {
                try {
                    const commentsData = await fetchCommentsByRoom(tenantId, roomId);
                    setComments(commentsData); // Guardamos los comentarios en el estado
                } catch (error) {
                    setError('Error al cargar los comentarios.');
                } finally {
                    setLoading(false);
                }
            };

            getComments(); // Ejecutamos la función para obtener los comentarios
        }
    }, [tenantId, roomId]); 

    // Esta función maneja la adición de un nuevo comentario al estado local
    const handleNewComment = (newComment) => {
        console.log('Nuevo comentario recibido:', newComment);  // Verificar si el comentario se recibe correctamente
        setComments((prevComments) => [newComment, ...prevComments]);  // Agregamos el nuevo comentario al principio de la lista
    };

    // Ordenar los comentarios por la fecha más reciente
    const sortedComments = comments.sort((a, b) => {
        // Convertir las fechas en formato 'YYYY-MM-DD HH:mm:ss' a objetos Date
        const dateA = new Date(a.created_at.replace(' ', 'T')); // Reemplazamos el espacio por 'T' para que sea un formato ISO
        const dateB = new Date(b.created_at.replace(' ', 'T'));
        return dateB - dateA;  // Orden descendente (más reciente primero)
    });

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
            
            <CommentForm
                roomId={roomId}
                tenantId={tenantId}
                userId={userId}
                onCommentAdded={handleNewComment}  // Aseguramos de pasar el callback correctamente
            />

            {comments.length === 0 ? (
                <Alert variant="info" className="text-center">No hay comentarios disponibles.</Alert>
            ) : (
                <ul className="space-y-4">
                    {sortedComments.map((comment, index) => (
                        <li key={index} className="p-4 bg-white shadow-md rounded-lg">
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