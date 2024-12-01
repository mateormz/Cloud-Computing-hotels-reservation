import React from 'react';
import UserDetail from '../components/UserDetail';
import PaymentsList from '../components/PaymentsList';
import ReservationsList from '../components/ReservationsList';

const User = () => {
  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <div className="container mx-auto space-y-8">
        <section className="bg-white shadow rounded-lg p-6">
          <UserDetail />
        </section>

        <section className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-4 mb-4">
            Historial de Pagos
          </h2>
          <PaymentsList />
        </section>

        <section className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-4 mb-4">
            Reservas del Usuario
          </h2>
          <ReservationsList />
        </section>
      </div>
    </div>
  );
};

export default User;