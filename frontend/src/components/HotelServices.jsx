import React, { useState, useEffect } from 'react';
import { fetchServicesByTenant, fetchCreateReservation, fetchCreatePayment } from '../services/api'; // Asegúrate de importar fetchCreatePayment
import { Spinner, Alert, Button, Form } from 'react-bootstrap'; // Usamos Spinner y Alert de react-bootstrap para la UI
import { useParams, useNavigate } from 'react-router-dom'; // Importamos useNavigate

const HotelServices = () => {
    const { roomId } = useParams(); // Extraemos roomId desde los params de la URL
    const [services, setServices] = useState([]); // Estado para los servicios
    const [loading, setLoading] = useState(true); // Estado de carga
    const [error, setError] = useState(null); // Estado para manejar errores
    const [selectedServices, setSelectedServices] = useState([]); // Servicios seleccionados por el usuario
    const [startDate, setStartDate] = useState(''); // Fecha de inicio
    const [endDate, setEndDate] = useState(''); // Fecha de fin
    const [isSubmitting, setIsSubmitting] = useState(false);  // Estado para controlar si está enviando la solicitud
    const navigate = useNavigate(); // Instancia de useNavigate para redirigir

    // Cargar los servicios del hotel
    useEffect(() => {
        const loadServices = async () => {
            try {
                const tenantId = localStorage.getItem('tenant_id'); // Obtenemos tenant_id del localStorage
                if (!tenantId) {
                    throw new Error('Tenant ID no disponible.');
                }

                const fetchedServices = await fetchServicesByTenant(tenantId); // Llamamos a la API para obtener los servicios
                setServices(fetchedServices.body.services); // Guardamos los servicios en el estado
            } catch (err) {
                setError('Error al cargar los servicios.'); // Si hay un error, lo guardamos
            } finally {
                setLoading(false); // Terminamos de cargar
            }
        };

        loadServices(); // Ejecutamos la carga de servicios al montar el componente
    }, []); // Solo ejecuta una vez cuando el componente se monta

    // Maneja la selección de servicios
    const handleServiceSelection = (serviceId) => {
        setSelectedServices((prevSelected) => {
            if (prevSelected.includes(serviceId)) {
                return prevSelected.filter((id) => id !== serviceId); // Si ya está seleccionado, lo desmarcamos
            } else {
                return [...prevSelected, serviceId]; // Si no está seleccionado, lo agregamos
            }
        });
    };

    // Función para validar el rango de fechas en formato YYYY-MM-DD
    const isValidDateRange = () => {
        const start = new Date(startDate);
        const end = new Date(endDate);

        console.log("Fecha de inicio:", startDate);
        console.log("Fecha de fin:", endDate);
        
        // Aseguramos que ambas fechas sean válidas
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            console.error("Una o ambas fechas son inválidas.");
            return false;
        }

        return start < end;
    };

    const handleCreateReservation = async () => {
        try {
            setIsSubmitting(true);  // Activamos el estado de "enviando reserva"
            
            // Obtener los datos del localStorage
            const tenantId = localStorage.getItem('tenant_id');
            const userId = localStorage.getItem('user_id');
    
            // Imprimir los datos obtenidos del localStorage
            console.log("Tenant ID:", tenantId);
            console.log("User ID:", userId);
    
            // Verificar si faltan datos importantes para la creación de la reserva
            if (!tenantId || !userId || selectedServices.length === 0 || !isValidDateRange() || !roomId) {
                throw new Error('Faltan datos para crear la reserva o las fechas son inválidas');
            }
    
            // Imprimir los datos a la consola para depuración
            console.log("Datos para la reserva:");
            console.log("tenantId:", tenantId);
            console.log("userId:", userId);
            console.log("roomId:", roomId);
            console.log("selectedServices:", selectedServices);
            console.log("startDate:", startDate);
            console.log("endDate:", endDate);
    
            // Crear los datos de la reserva
            const reservationData = {
                tenant_id: tenantId,
                user_id: userId,
                room_id: roomId,
                service_ids: selectedServices,
                start_date: startDate,
                end_date: endDate,
            };
    
            // Mostrar los datos de la reserva antes de enviarlos
            console.log("Datos enviados a la API:", reservationData);
    
            // Llamar a la función para crear la reserva
            const reservationResponse = await fetchCreateReservation(
                reservationData.tenant_id,
                reservationData.user_id,
                reservationData.room_id,
                reservationData.service_ids,
                reservationData.start_date,
                reservationData.end_date
            );
    
            // Comprobar si la reserva fue creada correctamente
            if (reservationResponse.statusCode === 200) {
                console.log('Reserva creada con éxito:', reservationResponse);
                alert('Reserva creada con éxito!');
                
                // Obtener el ID de la reserva creada
                const reservationId = reservationResponse.body.reservation_id;
    
                // Imprimir el reservationId obtenido
                console.log("Reservation ID:", reservationId);
    
                // Crear el pago para la reserva
                const paymentResponse = await fetchCreatePayment(tenantId, userId, reservationId);
    
                if (paymentResponse.statusCode === 200) {
                    console.log('Pago creado con éxito:', paymentResponse);
                    alert('Pago generado con éxito!');
                } else {
                    throw new Error('Hubo un problema al generar el pago');
                }
    
                // Redirigir al dashboard (ajusta la ruta según corresponda)
                navigate('/dashboard'); // Redirige al dashboard donde se ven las habitaciones
            } else {
                throw new Error('Hubo un problema al crear la reserva');
            }
        } catch (error) {
            // Mostrar el error si ocurre
            console.error("Error al crear la reserva:", error);
            alert(error.message || 'Error al crear la reserva');
        } finally {
            setIsSubmitting(false);  // Al final de la ejecución, desactivamos el estado de "enviando reserva"
        }
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
        <div className="container mx-auto p-6 max-w-4xl">
            <h2 className="text-center text-3xl font-bold mb-6 text-gray-800">Servicios del Hotel</h2>

            {/* Lista de servicios con opción para seleccionar */}
            <ul className="space-y-4">
                {services.length === 0 ? (
                    <Alert variant="info" className="w-full text-center">No hay servicios disponibles para este hotel.</Alert>
                ) : (
                    services.map((service) => (
                        <li key={service.service_id} className="p-4 bg-white shadow-md rounded-lg">
                            <Form.Check
                                type="checkbox"
                                id={`service-${service.service_id}`}
                                label={`${service.service_name} - $${service.precio}`}
                                onChange={() => handleServiceSelection(service.service_id)}
                                checked={selectedServices.includes(service.service_id)} // Marca el checkbox si el servicio está seleccionado
                                className="text-lg font-semibold text-gray-700"
                            />
                            <p><strong>Categoría:</strong> {service.service_category}</p>
                            <p>{service.descripcion}</p>
                        </li>
                    ))
                )}
            </ul>

            {/* Campos para seleccionar fechas */}
            <div className="my-6">
                <Form.Label className="block text-lg font-medium text-gray-700">Fecha de Inicio</Form.Label>
                <Form.Control
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="mt-1 block w-full px-4 py-2 text-base border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            <div className="my-6">
                <Form.Label className="block text-lg font-medium text-gray-700">Fecha de Fin</Form.Label>
                <Form.Control
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="mt-1 block w-full px-4 py-2 text-base border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            {/* Botón para crear la reserva */}
            <Button
                variant="success"
                onClick={handleCreateReservation}
                disabled={selectedServices.length === 0 || !startDate || !endDate || isSubmitting}  // Deshabilitar el botón mientras se está enviando la solicitud
                className="w-full mt-6 py-3 text-lg font-semibold rounded-md shadow-lg bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
                {isSubmitting ? "Creando reserva..." : "Crear Reserva"}
            </Button>
        </div>
    );
};

export default HotelServices;
