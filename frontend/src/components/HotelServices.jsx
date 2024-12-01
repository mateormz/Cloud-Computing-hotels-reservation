import React, { useState, useEffect } from 'react';
import { fetchServicesByTenant, fetchCreateReservation, fetchCreatePayment } from '../services/api';
import { Spinner, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FaSwimmer, FaUtensils, FaSpa, FaDumbbell, FaCocktail, FaShuttleVan, FaCalendarAlt, FaTshirt,
    FaHiking, FaChild, FaCar, FaWifi, FaFilm, FaBriefcase, FaGolfBall, FaTableTennis, FaWater,
    FaRing, FaDog, FaHotTub, FaHeartbeat, FaShoppingCart, FaDice, FaBook, FaBicycle, FaChalkboardTeacher,
    FaUmbrellaBeach, FaKey, FaConciergeBell
} from "react-icons/fa";

const HotelServices = () => {
    const { roomId } = useParams();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedServices, setSelectedServices] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const loadServices = async () => {
            try {
                const tenantId = localStorage.getItem('tenant_id');
                if (!tenantId) throw new Error('Tenant ID no disponible.');

                const fetchedServices = await fetchServicesByTenant(tenantId);
                setServices(fetchedServices.body.services);
            } catch (err) {
                setError('Error al cargar los servicios.');
            } finally {
                setLoading(false);
            }
        };

        loadServices();
    }, []);

    const handleServiceSelection = (serviceId) => {
        setSelectedServices((prevSelected) =>
            prevSelected.includes(serviceId)
                ? prevSelected.filter((id) => id !== serviceId)
                : [...prevSelected, serviceId]
        );
    };

    const isValidDateRange = () => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return start < end;
    };

    const handleCreateReservation = async () => {
        try {
            setIsSubmitting(true);

            const tenantId = localStorage.getItem('tenant_id');
            const userId = localStorage.getItem('user_id');

            if (!tenantId || !userId || selectedServices.length === 0 || !isValidDateRange() || !roomId) {
                throw new Error('Faltan datos para crear la reserva o las fechas son inválidas');
            }

            const reservationData = {
                tenant_id: tenantId,
                user_id: userId,
                room_id: roomId,
                service_ids: selectedServices,
                start_date: startDate,
                end_date: endDate,
            };

            const reservationResponse = await fetchCreateReservation(
                reservationData.tenant_id,
                reservationData.user_id,
                reservationData.room_id,
                reservationData.service_ids,
                reservationData.start_date,
                reservationData.end_date
            );

            if (reservationResponse.statusCode === 200) {
                const reservationId = reservationResponse.body.reservation_id;
                const paymentResponse = await fetchCreatePayment(tenantId, userId, reservationId);

                if (paymentResponse.statusCode === 200) {
                    alert('Reserva y pago creados con éxito!');
                    navigate('/dashboard');
                } else {
                    throw new Error('Hubo un problema al generar el pago');
                }
            } else {
                throw new Error('Hubo un problema al crear la reserva');
            }
        } catch (error) {
            alert(error.message || 'Error al crear la reserva');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getCategoryIcon = (category) => {
        switch (category.toLowerCase()) {
            case 'spa': return <FaSpa className="text-2xl text-blue-500" />;
            case 'restaurante': return <FaUtensils className="text-2xl text-green-500" />;
            case 'piscina': return <FaSwimmer className="text-2xl text-indigo-500" />;
            case 'gym': return <FaDumbbell className="text-2xl text-orange-500" />;
            case 'bar': return <FaCocktail className="text-2xl text-purple-500" />;
            case 'transporte': return <FaShuttleVan className="text-2xl text-gray-500" />;
            case 'eventos': return <FaCalendarAlt className="text-2xl text-red-500" />;
            case 'lavandería': return <FaTshirt className="text-2xl text-blue-700" />;
            case 'tours': return <FaHiking className="text-2xl text-green-700" />;
            case 'kids club': return <FaChild className="text-2xl text-pink-500" />;
            case 'parking': return <FaCar className="text-2xl text-gray-700" />;
            case 'wi-fi': return <FaWifi className="text-2xl text-blue-400" />;
            case 'cine': return <FaFilm className="text-2xl text-indigo-700" />;
            case 'negocios': return <FaBriefcase className="text-2xl text-gray-900" />;
            case 'golf': return <FaGolfBall className="text-2xl text-green-600" />;
            case 'deportes acuáticos': return <FaWater className="text-2xl text-blue-600" />;
            case 'mascotas': return <FaDog className="text-2xl text-brown-500" />;
            default: return <FaConciergeBell className="text-2xl text-gray-500" />;
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <p className="text-lg text-gray-700 mb-6">
                Selecciona los servicios que deseas añadir a tu reserva haciendo clic en ellos.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {services.map((service) => (
                    <div
                        key={service.service_id}
                        onClick={() => handleServiceSelection(service.service_id)}
                        className={`p-4 rounded-lg shadow-md cursor-pointer flex flex-col items-center space-y-2 transition-all ${
                            selectedServices.includes(service.service_id)
                                ? 'bg-blue-100 border-blue-500'
                                : 'bg-white border-gray-200'
                        } border`}
                    >
                        {getCategoryIcon(service.service_category)}
                        <h3 className="text-sm font-medium text-gray-800">{service.service_name}</h3>
                        <p className="text-xs text-gray-600">{service.descripcion}</p>
                        <p className="text-xs font-semibold">${service.precio}</p>
                    </div>
                ))}
            </div>

            <div className="mt-8 flex items-center space-x-6 justify-end">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>

                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Fin</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>

                <button
                    onClick={handleCreateReservation}
                    className="py-3 px-6 bg-blue-600 text-white text-lg font-medium rounded-md shadow-md hover:bg-blue-700 transition focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Creando...' : 'Reservar'}
                </button>
            </div>
        </div>
    );
};

export default HotelServices;
