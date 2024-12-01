import React, { useState, useEffect } from 'react';
import { Alert, Spinner } from 'react-bootstrap';
import { fetchPaymentsByUser } from '../services/api';

const PaymentsList = () => {
  const [payments, setPayments] = useState([]);
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

    const fetchPayments = async () => {
      try {
        setLoading(true);
        const data = await fetchPaymentsByUser(tenant_id, user_id);
        const paymentsData = data.body || [];
        setPayments(paymentsData);
        setTotalPages(Math.ceil(paymentsData.length / itemsPerPage));
      } catch (error) {
        setError('Error al cargar los pagos.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPayments = payments.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><Spinner animation="border" variant="primary" /></div>;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (payments.length === 0) {
    return <Alert variant="info">No se encontraron pagos realizados por este usuario.</Alert>;
  }

  return (
    <div className="container mx-auto p-4 bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-lg font-bold text-gray-700 mb-4">Historial de Pagos</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {currentPayments.map((payment, index) => (
          <div key={index} className="p-3 bg-white rounded shadow flex flex-col justify-between">
            <p className="text-sm"><strong>ID:</strong> {payment.payment_id}</p>
            <p className="text-sm"><strong>Monto:</strong> ${payment.monto_pago}</p>
            <p className="text-sm"><strong>Estado:</strong> {payment.status}</p>
            <p className="text-sm"><strong>Emitido:</strong> {payment.created_at}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-4 space-x-1">
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

export default PaymentsList;