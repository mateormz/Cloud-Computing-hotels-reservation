import React, { useState } from 'react';
import { fetchCreateComment } from '../services/api';

const CommentForm = ({ roomId, tenantId, userId, onCommentAdded }) => {
    const [commentText, setCommentText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        if (!commentText) {
            setError('El comentario no puede estar vacío.');
            return;
        }
    
        setLoading(true);
        setError('');
    
        try {
            // Crear el comentario a través de la API
            const response = await fetchCreateComment(tenantId, userId, roomId, commentText);
    
            console.log('Nuevo comentario agregado:', response.body.comment);  // Verificar que el comentario se crea correctamente
    
            // Llamar a la función de callback para agregar el comentario a la lista
            onCommentAdded(response.body.comment);  // Pasamos solo el comentario recién creado
    
            setCommentText('');  // Limpiar el campo del comentario
        } catch (error) {
            setError('Hubo un error al enviar el comentario.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mb-6">
            <textarea
                className="w-full p-3 border border-gray-300 rounded-lg"
                placeholder="Escribe tu comentario..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
            />
            <button 
                type="submit"
                disabled={loading}
                className="mt-3 w-full bg-blue-500 text-white py-2 rounded-lg"
            >
                {loading ? 'Enviando...' : 'Enviar Comentario'}
            </button>

            {error && <div className="mt-2 text-red-500">{error}</div>}
        </form>
    );
};

export default CommentForm;