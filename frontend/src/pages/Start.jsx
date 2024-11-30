import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullseye, faEye, faTasks } from '@fortawesome/free-solid-svg-icons';
import AllHotels from '../components/AllHotels';

const Start = () => {
  return (
    <div>
      {/* Fondo superior con la imagen */}
      <div className="bg-cover bg-center h-96" style={{ backgroundImage: "url('https://cdn6.agoda.net/images/accommodation/backdrop/apartments.jpg')" }}>
        <div className="flex flex-col justify-center items-center h-full bg-black bg-opacity-60">
          <h1 className="text-white text-4xl font-bold text-center">HOTELES, RESORTS, HOSTALES Y MUCHO MÁS</h1>
          <p className="text-white text-lg mt-2 text-center">Descubre los mejores alojamientos en todo el mundo</p>
        </div>
      </div>

      {/* Componente de lista de hoteles */}
      <AllHotels />

      {/* Sección de Misión, Visión y Objetivos */}
      <section className="px-6 py-16 bg-gray-50 mt-12">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-12">Nuestra Misión, Visión y Objetivos</h2>

          <div className="grid md:grid-cols-3 gap-16">
            {/* Misión */}
            <div className="flex flex-col items-center p-6 bg-white border border-gray-200 rounded-lg shadow-lg">
              <FontAwesomeIcon icon={faBullseye} className="text-3xl text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Misión</h3>
              <p className="text-base text-gray-600">
                Nuestra misión es ofrecer experiencias excepcionales a los viajeros mediante una plataforma intuitiva que facilita la búsqueda de los mejores hoteles, resorts y hostales a nivel mundial.
              </p>
            </div>

            {/* Visión */}
            <div className="flex flex-col items-center p-6 bg-white border border-gray-200 rounded-lg shadow-lg">
              <FontAwesomeIcon icon={faEye} className="text-3xl text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Visión</h3>
              <p className="text-base text-gray-600">
                Ser la plataforma líder en la industria hotelera, brindando acceso a los destinos más populares y exclusivos del mundo, impulsando la conectividad global y el turismo sostenible.
              </p>
            </div>

            {/* Objetivos */}
            <div className="flex flex-col items-center p-6 bg-white border border-gray-200 rounded-lg shadow-lg">
              <FontAwesomeIcon icon={faTasks} className="text-3xl text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Objetivos</h3>
              <ul className="list-disc text-base text-gray-600 space-y-2 pl-6">
                <li>Proveer opciones de alojamiento para todos los gustos y presupuestos.</li>
                <li>Ofrecer una plataforma fácil de usar para la reserva de hoteles y otros servicios turísticos.</li>
                <li>Fomentar el turismo sostenible y la responsabilidad social en todos nuestros servicios.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Start;