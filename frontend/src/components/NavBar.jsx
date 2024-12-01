import React from 'react';
import { Link } from 'react-router-dom';

const NavBar = () => {
    const tenantId = localStorage.getItem('tenant_id');  // Comprobar si el usuario está autenticado

    return (
        <nav className="bg-white p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/home" className="text-black text-lg font-bold">
                    Hotel App
                </Link>
                <ul className="flex space-x-4">
                    {/* Si el usuario no está autenticado, mostrar Login y Register */}
                    {!tenantId ? (
                        <>
                            <li>
                                <Link to="/login" className="text-black hover:text-gray-500">Login</Link>
                            </li>
                            <li>
                                <Link to="/register" className="text-black hover:text-gray-500">Register</Link>
                            </li>
                        </>
                    ) : (
                        <>
                            {/* Si el usuario está autenticado, mostrar Profile, Reservas y Pagos */}
                            <li>
                                <Link to="/profile" className="text-black hover:text-gray-500">Profile</Link>
                            </li>
                        </>
                    )}
                </ul>
            </div>
        </nav>
    );
};

export default NavBar;
