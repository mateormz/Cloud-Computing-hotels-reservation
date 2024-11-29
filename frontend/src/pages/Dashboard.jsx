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
                console.log(data)
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
                    <p className="text-xl font-semibold">Cargando información de los hoteles...</p>
                </div>
            </div>
        );
    }

    // Si hubo un error al cargar, mostramos un mensaje de error
    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 flex justify-center items-center">
                <div className="text-center text-red-500">
                    <p className="text-xl font-semibold">{ }</p>
                </div>
            </div>
        );
    }

    // Si no hay información de hoteles
    if (hotels.length === 0) {
        return (
            <div className="min-h-screen bg-gray-100 flex justify-center items-center">
                <div className="text-center">
                    <p className="text-xl font-semibold">No se encontraron hoteles para este tenant.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto p-6">
                {/* Título y descripción del primer hotel en la lista (si existe) */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold">{hotels[0].hotel_name}</h1> {/* Solo mostramos el primer hotel como ejemplo */}
                    <p className="text-lg text-gray-600">{hotels[0].description}</p>
                    <p className="text-md text-gray-500">{hotels[0].hotel_location}</p> {/* Ubicación del primer hotel */}
                </div>

                {/* Sección para mostrar las habitaciones, aquí podrías iterar sobre los hoteles */}
                <h2 className="text-center text-2xl font-bold mb-6">Encuentra la habitación perfecta!</h2>
                <RoomsList/>
            </div>
        </div>
    );
};

export default Dashboard;