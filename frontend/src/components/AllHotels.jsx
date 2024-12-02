import React, { useState, useEffect } from 'react';
import { fetchAllHotels } from '../services/api';
import { Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const HotelsList = () => {
    const [hotels, setHotels] = useState([]);
    const [filteredHotels, setFilteredHotels] = useState([]); // Estado para hoteles filtrados
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState(""); // Estado para el texto de búsqueda

    const navigate = useNavigate();

    useEffect(() => {
        const getHotels = async () => {
            try {
                const data = await fetchAllHotels();
                setHotels(data.body.hotels);
                setFilteredHotels(data.body.hotels); // Inicialmente mostramos todos los hoteles
            } catch (error) {
                setError('Error al cargar los hoteles.');
            } finally {
                setLoading(false);
            }
        };

        getHotels();
    }, []);

    const handleHotelClick = (tenant_id) => {
        localStorage.setItem('tenant_id', tenant_id);
        navigate('/login');
    };

    const handleSearchChange = (e) => {
        const query = e.target.value.toLowerCase();
        setSearch(query);

        // Filtrar los hoteles según la ubicación
        const filtered = hotels.filter(hotel =>
            hotel.hotel_location.toLowerCase().includes(query)
        );
        setFilteredHotels(filtered);
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
        <div className="container mx-auto p-6">
            {/* Barra de búsqueda estilizada con el emoji de ubicación */}
            <div className="relative mb-8 flex items-center">
                {/* Emoji de ubicación */}
                <span className="absolute left-4 text-2xl text-gray-500">📍</span>
                
                <input
                    type="text"
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Buscar por ubicación..."
                    className="w-full pl-12 p-4 text-xl rounded-lg border-2 border-gray-300 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Mostrar lista de hoteles si hay disponibles */}
            {filteredHotels.length === 0 ? (
                <Alert variant="info" className="text-center">No hay hoteles disponibles.</Alert>
            ) : (
                <ul className="space-y-4">
                    {filteredHotels.map((hotel, index) => (
                        <li key={index} className="p-4 bg-white shadow-md rounded-lg cursor-pointer" onClick={() => handleHotelClick(hotel.tenant_id)}>
                            <div className="flex items-center space-x-4">
                                {hotel.image && (
                                    <img
                                        src={hotel.image}
                                        alt={`Imagen de ${hotel.hotel_name}`}
                                        className="w-32 h-32 object-cover rounded-lg"
                                    />
                                )}
                                <div>
                                    <h3 className="text-lg font-semibold">{hotel.hotel_name}</h3>
                                    <p><strong>Ubicación:</strong> {hotel.hotel_location}</p>
                                    <p><strong>Descripción:</strong> {hotel.description}</p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default HotelsList;