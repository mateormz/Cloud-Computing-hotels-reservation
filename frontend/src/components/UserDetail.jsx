import React, { useState, useEffect } from 'react';
import { Spinner, Alert } from 'react-bootstrap';
import { fetchGetUser } from '../services/api'; // Asegúrate de importar el fetch correctamente

const UserDetail = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                // Recuperamos tenant_id y user_id desde localStorage
                const tenant_id = localStorage.getItem('tenant_id');
                const user_id = localStorage.getItem('user_id');
                
                if (!tenant_id || !user_id) {
                    throw new Error('No se encontró el Tenant ID o User ID en localStorage');
                }

                // Llamamos a la API para obtener los datos del usuario
                const data = await fetchGetUser(tenant_id, user_id);
                setUser(data.body.user); // Asumiendo que los datos del usuario están en `body`
            } catch (error) {
                setError('Error al cargar los detalles del usuario.');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []); // El efecto se ejecuta una vez al montar el componente

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

    if (!user) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Alert variant="info">No se encontraron detalles del usuario.</Alert>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <h2 className="text-center text-2xl font-bold mb-6">Detalles del Usuario</h2>
            
            <p><strong>Nombre:</strong> {user.nombre}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Fecha de creación:</strong> {user.fecha_registro}</p>
            {/* Mostrar otros detalles si están disponibles */}
            {user.additional_info && (
                <div className="mt-4">
                    <h4 className="text-lg font-bold">Información adicional:</h4>
                    <p>{user.additional_info}</p>
                </div>
            )}
        </div>
    );
};

export default UserDetail;