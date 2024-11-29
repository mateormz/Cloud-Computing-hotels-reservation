import React from 'react';
import RoomsList from '../components/RoomsList';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-center text-3xl font-bold mb-6">Encuentra la habitación perfecta!</h1>
        <RoomsList />  {/* Llamamos al componente RoomsList aquí */}
      </div>
    </div>
  );
};

export default Dashboard;