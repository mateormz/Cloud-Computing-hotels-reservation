import React from 'react';
import { Link } from 'react-router-dom';

const NavBar = () => {
    const tenantId = localStorage.getItem('tenant_id');  // Comprobar si el usuario está autenticado

    return (
        <nav className="bg-white p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="text-white text-lg font-bold hover:text-gray-200">
                    Hotel App
                </Link>
                <ul className="flex space-x-4">
                    {/* Si el usuario no está autenticado, mostrar Login y Register */}
                    {!tenantId ? (
                        <>
                            <li>
                                <Link to="/login" className="text-white hover:text-gray-200">Login</Link>
                            </li>
                            <li>
                                <Link to="/register" className="text-white hover:text-gray-200">Register</Link>
                            </li>
                        </>
                    ) : (
                        <>
                            {/* Si el usuario está autenticado, mostrar Profile, Reservas y Pagos */}
                            <li>
                                <Link to="/profile" className="text-white hover:text-gray-200">Profile</Link>
                            </li>
                            <li>
                                <Link to="/reservations" className="text-white hover:text-gray-200">Reservas</Link>
                            </li>
                            <li>
                                <Link to="/payments" className="text-white hover:text-gray-200">Pagos</Link>
                            </li>
                        </>
                    )}
                </ul>
            </div>
        </nav>
    );
};

export default NavBar;
