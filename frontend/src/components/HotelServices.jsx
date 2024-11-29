import React, { useState, useEffect } from 'react';
import { fetchServicesByTenant } from '../services/api'; // Importamos el nuevo fetch
import { Spinner, Alert } from 'react-bootstrap'; // Usamos Spinner y Alert de react-bootstrap para la UI

const HotelServices = () => {
    const [services, setServices] = useState([]); // Estado para los servicios
    const [loading, setLoading] = useState(true); // Estado de carga
    const [error, setError] = useState(null); // Estado para manejar errores

    useEffect(() => {
        // Función para cargar los servicios del tenant
        const loadServices = async () => {
            try {
                const tenant_id = localStorage.getItem('tenant_id'); // Obtenemos tenant_id del localStorage
                if (!tenant_id) {
                    throw new Error('Tenant ID no disponible.');
                }

                const fetchedServices = await fetchServicesByTenant(tenant_id); // Llamamos a fetchServicesByTenant
                setServices(fetchedServices.body.services); // Establecemos los servicios en el estado
            } catch (err) {
                setError('Error al cargar los servicios.'); // Si hay un error, lo guardamos
            } finally {
                setLoading(false); // Terminamos de cargar
            }
        };

        loadServices(); // Ejecutamos la carga de servicios
    }, []); // Solo ejecuta al montar el componente

    // Mientras cargamos los servicios, mostramos un spinner
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    // Si hubo un error al cargar los servicios, mostramos un mensaje de error
    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Alert variant="danger">{error}</Alert>
            </div>
        );
    }

    // Si no hay servicios, mostramos un mensaje informativo
    if (services.length === 0) {
        return (
            <div className="text-center py-6">
                <Alert variant="info">No hay servicios disponibles para este hotel.</Alert>
            </div>
        );
    }

    // Si se cargaron los servicios correctamente, los mostramos
    return (
        <div className="container mx-auto p-6">
            <h2 className="text-center text-2xl font-bold mb-6">Servicios del Hotel</h2>

            <ul className="space-y-4">
                {services.map((service, index) => (
                    <li key={service.service_id} className="p-4 bg-white shadow-md rounded-lg">
                        <h3 className="text-xl font-semibold">{service.service_name}</h3>
                        <p><strong>Categoría:</strong> {service.service_category}</p>
                        <p>{service.descripcion}</p>
                        <p><strong>Precio:</strong> ${service.precio}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default HotelServices;