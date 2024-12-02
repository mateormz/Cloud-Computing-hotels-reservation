import React, { useState, useEffect } from 'react';
import { Spinner, Alert } from 'react-bootstrap';
import { fetchGetUser } from '../services/api';

const UserDetail = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const tenant_id = localStorage.getItem('tenant_id');
        const user_id = localStorage.getItem('user_id');

        if (!tenant_id || !user_id) {
          throw new Error('No se encontró el Tenant ID o User ID en localStorage');
        }

        const data = await fetchGetUser(tenant_id, user_id);
        setUser(data.body.user);
      } catch (error) {
        setError('Error al cargar los detalles del usuario.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!user) {
    return <Alert variant="info">No se encontraron detalles del usuario.</Alert>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Detalles del Usuario</h2>
      <p><strong>Nombre:</strong> {user.nombre}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Fecha de Registro:</strong> {user.fecha_registro}</p>
      {user.additional_info && (
        <div className="mt-4">
          <h4 className="text-lg font-bold">Información Adicional:</h4>
          <p>{user.additional_info}</p>
        </div>
      )}
    </div>
  );
};

export default UserDetail;