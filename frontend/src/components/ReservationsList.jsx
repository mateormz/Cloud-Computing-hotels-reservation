import React, { useState, useEffect } from 'react';
import { Alert, Spinner } from 'react-bootstrap';
import { fetchReservationsByUser, fetchRoomById } from '../services/api';

const ReservationsList = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const tenant_id = localStorage.getItem('tenant_id');
    const user_id = localStorage.getItem('user_id');

    if (!tenant_id || !user_id) {
      setError('No se encontraron Tenant ID o User ID en localStorage');
      setLoading(false);
      return;
    }

    const fetchReservations = async () => {
      try {
        setLoading(true);
        const data = await fetchReservationsByUser(tenant_id, user_id);
        const reservationsData = data.body.reservations || [];

        const detailedReservations = await Promise.all(
          reservationsData.map(async (reservation) => {
            try {
              const roomData = await fetchRoomById(tenant_id, reservation.room_id);
              return { ...reservation, roomDetails: roomData.body };
            } catch (error) {
              console.error(`Error al cargar detalles de la habitación ${reservation.room_id}:`, error);
              return reservation;
            }
          })
        );

        setReservations(detailedReservations);
        setTotalPages(Math.ceil(detailedReservations.length / itemsPerPage));
      } catch (error) {
        setError('Error al cargar las reservas.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentReservations = reservations.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><Spinner animation="border" variant="primary" /></div>;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (reservations.length === 0) {
    return <Alert variant="info">No se encontraron reservas para este usuario.</Alert>;
  }

  return (
    <div className="container mx-auto p-4 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-bold text-gray-700 mb-6">Reservas del Usuario</h2>

      <ul className="divide-y divide-gray-200">
        {currentReservations.map((reservation, index) => (
          <li key={index} className="p-4 bg-gray-50 rounded-md shadow-md mb-4">
            <div className="grid grid-cols-3 gap-6 items-center">
              {/* Información de la reserva */}
              <div className="col-span-2">
                <p className="text-lg font-semibold mb-2"><strong>ID de la Reserva:</strong> {reservation.reservation_id}</p>
                <p className="text-md mb-1"><strong>Fecha de Inicio:</strong> {reservation.start_date}</p>
                <p className="text-md mb-1"><strong>Fecha de Fin:</strong> {reservation.end_date}</p>
                <p className="text-md mb-1"><strong>Estado:</strong> {reservation.status}</p>
              </div>

              {/* Detalles de la habitación */}
              <div className="flex items-center space-x-4 bg-white p-4 rounded-md shadow-md">
                {reservation.roomDetails?.image && (
                  <img
                    src={reservation.roomDetails.image}
                    alt={`Imagen de ${reservation.roomDetails.room_name}`}
                    className="w-24 h-24 rounded-lg"
                  />
                )}
                <div>
                  <h4 className="text-md font-bold mb-1">{reservation.roomDetails?.room_name || 'Habitación'}</h4>
                  <p className="text-sm mb-1"><strong>Tipo:</strong> {reservation.roomDetails?.room_type || 'N/A'}</p>
                  <p className="text-sm mb-1"><strong>Capacidad:</strong> {reservation.roomDetails?.max_persons || 'N/A'} personas</p>
                  <p className="text-sm"><strong>Precio:</strong> ${reservation.roomDetails?.price_per_night || 'N/A'}</p>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex justify-center mt-4 space-x-2">
        <button
          className={`px-4 py-2 rounded ${currentPage === 1 ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-700'}`}
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
        >
          Primera
        </button>
        <button
          className={`px-4 py-2 rounded ${currentPage === 1 ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-700'}`}
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Anterior
        </button>
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index + 1}
            className={`px-4 py-2 rounded ${index + 1 === currentPage ? 'bg-blue-700 text-white' : 'bg-blue-500 text-white hover:bg-blue-700'}`}
            onClick={() => handlePageChange(index + 1)}
          >
            {index + 1}
          </button>
        ))}
        <button
          className={`px-4 py-2 rounded ${currentPage === totalPages ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-700'}`}
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Siguiente
        </button>
        <button
          className={`px-4 py-2 rounded ${currentPage === totalPages ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-700'}`}
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          Última
        </button>
      </div>
    </div>
  );
};

export default ReservationsList;