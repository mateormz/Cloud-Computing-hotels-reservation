// src/components/Footer.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebookF, faTwitter, faInstagram, faLinkedinIn } from '@fortawesome/free-brands-svg-icons';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-6 mt-12">
      <div className="container mx-auto text-center">
        {/* Información básica */}
        <div className="mb-4">
          <p className="text-lg">© 2024 Hotel App. Todos los derechos reservados.</p>
        </div>

        {/* Enlaces a redes sociales */}
        <div className="flex justify-center space-x-6 mb-4">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-blue-600">
            <FontAwesomeIcon icon={faFacebookF} className="text-2xl" />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-blue-400">
            <FontAwesomeIcon icon={faTwitter} className="text-2xl" />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-pink-500">
            <FontAwesomeIcon icon={faInstagram} className="text-2xl" />
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-blue-700">
            <FontAwesomeIcon icon={faLinkedinIn} className="text-2xl" />
          </a>
        </div>

        {/* Enlaces de políticas */}
        <div>
          <ul className="flex justify-center space-x-6 text-sm">
            <li><a href="/terms" className="hover:text-gray-400">Términos de servicio</a></li>
            <li><a href="/privacy" className="hover:text-gray-400">Política de privacidad</a></li>
            <li><a href="/contact" className="hover:text-gray-400">Contacto</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;