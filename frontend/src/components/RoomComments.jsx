import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchCommentsByRoom, fetchGetUser } from '../services/api';
import { Spinner, Alert } from 'react-bootstrap';
import CommentForm from './CommentForm';

const RoomComments = () => {
    const { roomId } = useParams();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tenantId, setTenantId] = useState(null);
    const [userId, setUserId] = useState(null);
    const [userNames, setUserNames] = useState({}); // Diccionario para almacenar nombres de usuarios

    useEffect(() => {
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
        const fetchCommentsAndUsers = async () => {
            try {
                if (tenantId && roomId) {
                    const commentsData = await fetchCommentsByRoom(tenantId, roomId);

                    // Obtener nombres de usuarios para cada comentario
                    const userPromises = commentsData.map(async (comment) => {
                        const userId = comment.user_id;
                        if (!userNames[userId]) {
                            try {
                                const userResponse = await fetchGetUser(tenantId, userId);
                                const userName = userResponse.body.user.nombre;
                                setUserNames((prevNames) => ({ ...prevNames, [userId]: userName }));
                            } catch {
                                setUserNames((prevNames) => ({ ...prevNames, [userId]: 'Usuario desconocido' }));
                            }
                        }
                    });

                    await Promise.all(userPromises);

                    setComments(commentsData);
                }
            } catch (error) {
                setError('Error al cargar los comentarios o los usuarios.');
            } finally {
                setLoading(false);
            }
        };

        fetchCommentsAndUsers();
    }, [tenantId, roomId]);

    const handleNewComment = (newComment) => {
        setComments((prevComments) => [newComment, ...prevComments]);
    };

    const sortedComments = comments.sort((a, b) => {
        const dateA = new Date(a.created_at.replace(' ', 'T'));
        const dateB = new Date(b.created_at.replace(' ', 'T'));
        return dateB - dateA;
    });

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        const date = new Date(dateString.replace(' ', 'T'));
        return date.toLocaleDateString('es-ES', options);
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
        <div className="container mx-auto p-6 max-w-6xl">
            <h2 className="text-3xl font-semibold text-gray-800 mb-8">Lo que más gustó a quienes se alojaron aquí</h2>

            <CommentForm
                roomId={roomId}
                tenantId={tenantId}
                userId={userId}
                onCommentAdded={handleNewComment}
            />

            {comments.length === 0 ? (
                <Alert variant="info" className="mt-6 text-center">No hay comentarios disponibles.</Alert>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedComments.map((comment, index) => (
                        <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                            {/* Encabezado */}
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-blue-100 text-blue-800 flex items-center justify-center rounded-full font-bold text-lg">
                                    {userNames[comment.user_id]?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-gray-800">
                                        {userNames[comment.user_id] || 'Usuario desconocido'}
                                    </h3>
                                    <p className="text-sm text-gray-500 italic">{formatDate(comment.created_at)}</p>
                                </div>
                            </div>

                            {/* Contenido */}
                            <p className="mt-4 text-gray-700 text-sm">{comment.comment_text}</p>
                            <a href="#" className="text-blue-600 mt-2 inline-block text-sm hover:underline">
                                Más info
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RoomComments;
