import React, { useState, useEffect } from 'react';
import { fetchPaymentsByUser } from '../services/api'; // Asegúrate de importar el fetch correctamente
import { Alert, Spinner } from 'react-bootstrap';

const PaymentsList = () => {
    const [payments, setPayments] = useState([]); // Estado para los pagos
    const [loading, setLoading] = useState(true); // Estado de carga
    const [error, setError] = useState(null); // Estado de error
    const [tenant_id, setTenantId] = useState(null); // Estado del tenant_id
    const [user_id, setUserId] = useState(null); // Estado del user_id

    useEffect(() => {
        // Obtén tenant_id y user_id desde el localStorage
        const tenantIdFromStorage = localStorage.getItem('tenant_id');
        const userIdFromStorage = localStorage.getItem('user_id');

        if (tenantIdFromStorage && userIdFromStorage) {
            setTenantId(tenantIdFromStorage);
            setUserId(userIdFromStorage);
        } else {
            setError('No se encontraron Tenant ID o User ID en localStorage');
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (tenant_id && user_id) {
            const fetchPayments = async () => {
                try {
                    const data = await fetchPaymentsByUser(tenant_id, user_id); // Llamamos a la API
                    setPayments(data.body.payments || []); // Asumimos que los pagos están en `data.body.payments`
                } catch (error) {
                    setError('Error al cargar los pagos.');
                } finally {
                    setLoading(false);
                }
            };

            fetchPayments();
        }
    }, [tenant_id, user_id]); // Ejecutar cuando tenant_id o user_id cambien

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
            <h2 className="text-center text-2xl font-bold mb-6">Historial de Pagos</h2>
            {payments.length === 0 ? (
                <Alert variant="info" className="text-center">No se encontraron pagos realizados por este usuario.</Alert>
            ) : (
                <ul className="space-y-4">
                    {payments.map((payment, index) => (
                        <li key={index} className="p-4 bg-white shadow-md rounded-lg">
                            <div>
                                <p><strong>ID del Pago:</strong> {payment.payment_id}</p>
                                <p><strong>Monto:</strong> ${payment.amount}</p>
                                <p><strong>Fecha:</strong> {payment.date}</p>
                                <p><strong>Estado:</strong> {payment.status}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default PaymentsList;