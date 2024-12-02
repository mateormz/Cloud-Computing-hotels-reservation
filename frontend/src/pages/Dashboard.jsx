import React, { useEffect, useState } from 'react';
import RoomsList from '../components/RoomsList';
import { fetchHotelByTenant } from '../services/api'; // Usamos la nueva función

const Dashboard = () => {
    const [hotels, setHotels] = useState([]); // Para almacenar la lista de hoteles
    const [loading, setLoading] = useState(true); // Para mostrar un cargando mientras obtenemos los datos
    const [error, setError] = useState(null); // Para manejar errores

    useEffect(() => {
        const tenant_id = localStorage.getItem('tenant_id'); // Obtener tenant_id de localStorage

        if (!tenant_id) {
            setError('No se encontró el tenant_id');
            setLoading(false);
            return;
        }

        // Llamamos al fetch para obtener la información de todos los hoteles
        const getHotelsInfo = async () => {
            try {
                const data = await fetchHotelByTenant(tenant_id); // Cambiamos la función para obtener todos los hoteles
                setHotels(data.body.hotels); // Guardamos la lista de hoteles en el estado
            } catch (err) {
                setError('Hubo un error al obtener la información de los hoteles');
            } finally {
                setLoading(false); // Terminamos de cargar
            }
        };

        getHotelsInfo();
    }, []); // Solo se ejecuta una vez cuando el componente se monta

    // Mientras se cargan los datos, mostramos un spinner o mensaje de carga
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex justify-center items-center">
                <div className="text-center">
                    <p className="text-xl font-semibold text-gray-600">Cargando información de los hoteles...</p>
                </div>
            </div>
        );
    }

    // Si hubo un error al cargar, mostramos un mensaje de error
    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 flex justify-center items-center">
                <div className="text-center text-red-500">
                    <p className="text-xl font-semibold">{error}</p>
                </div>
            </div>
        );
    }

    // Si no hay información de hoteles
    if (hotels.length === 0) {
        return (
            <div className="min-h-screen bg-gray-100 flex justify-center items-center">
                <div className="text-center">
                    <p className="text-xl font-semibold text-gray-600">No se encontraron hoteles para este tenant.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto p-6">
                {/* Sección del hotel */}
                <div className="relative">
                    {/* Imagen del hotel */}
                    {hotels[0].image && (
                        <img
                            src={hotels[0].image}
                            alt={`Imagen de ${hotels[0].hotel_name}`}
                            className="w-full h-96 object-cover rounded-lg shadow-lg"
                        />
                    )}

                    {/* Título del hotel sobre la imagen */}
                    <div className="absolute top-12 left-12 text-white bg-black bg-opacity-50 px-6 py-4 rounded-md w-full sm:w-auto">
                        <h1 className="text-4xl sm:text-5xl font-serif font-bold">{hotels[0].hotel_name}</h1>
                    </div>
                </div>

                {/* Descripción del hotel */}
                <div className="bg-white shadow-lg rounded-lg overflow-hidden p-6 mt-12">
                    <p className="text-lg text-gray-700 mb-4">{hotels[0].description}</p>
                    <p className="text-md text-gray-500">{hotels[0].hotel_location}</p> {/* Ubicación del primer hotel */}
                </div>

                {/* Sección de habitaciones */}
                <div className="text-center mt-12">
                    <RoomsList />
                </div>

                {/* Lista de otros hoteles */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                    {hotels.slice(1).map((hotel) => (
                        <div key={hotel.hotel_id} className="bg-white shadow-lg rounded-lg overflow-hidden">
                            <img
                                src={hotel.image || 'https://via.placeholder.com/500'}
                                alt={`Imagen de ${hotel.hotel_name}`}
                                className="w-full h-48 object-cover"
                            />
                            <div className="p-4">
                                <h3 className="text-xl font-serif font-semibold text-gray-800">{hotel.hotel_name}</h3>
                                <p className="text-gray-600 mt-2">{hotel.description}</p>
                                <p className="text-gray-500 mt-1">{hotel.hotel_location}</p>
                                <button className="mt-4 w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    Ver habitaciones
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
