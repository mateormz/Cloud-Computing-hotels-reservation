import React, { useState, useEffect } from 'react';
import { Alert, Spinner } from 'react-bootstrap';
import { fetchReservationsByUser } from '../services/api';

const ReservationsList = () => {
  const [reservations, setReservations] = useState([]); // Reservas cargadas
  const [loading, setLoading] = useState(true); // Estado de carga
  const [error, setError] = useState(null); // Errores
  const [currentPage, setCurrentPage] = useState(1); // Página actual
  const [totalPages, setTotalPages] = useState(1); // Total de páginas
  const itemsPerPage = 5; // Número de reservas por página

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
        setReservations(reservationsData);
        setTotalPages(Math.ceil(reservationsData.length / itemsPerPage));
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
    <div className="container mx-auto p-4 bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-lg font-bold text-gray-700 mb-4">Reservas del Usuario</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {currentReservations.map((reservation, index) => (
          <div key={index} className="p-3 bg-white rounded shadow flex flex-col justify-between">
            <p className="text-sm"><strong>ID:</strong> {reservation.reservation_id}</p>
            <p className="text-sm"><strong>Inicio:</strong> {reservation.start_date}</p>
            <p className="text-sm"><strong>Fin:</strong> {reservation.end_date}</p>
            <p className="text-sm"><strong>Estado:</strong> {reservation.status}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-4 space-x-2">
        <button
          className={`px-3 py-1 text-sm rounded ${currentPage === 1 ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-700'}`}
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
        >
          Primera
        </button>
        <button
          className={`px-3 py-1 text-sm rounded ${currentPage === 1 ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-700'}`}
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Anterior
        </button>
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index + 1}
            className={`px-3 py-1 text-sm rounded ${index + 1 === currentPage ? 'bg-blue-700 text-white' : 'bg-blue-500 text-white hover:bg-blue-700'}`}
            onClick={() => handlePageChange(index + 1)}
          >
            {index + 1}
          </button>
        ))}
        <button
          className={`px-3 py-1 text-sm rounded ${currentPage === totalPages ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-700'}`}
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Siguiente
        </button>
        <button
          className={`px-3 py-1 text-sm rounded ${currentPage === totalPages ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-700'}`}
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
