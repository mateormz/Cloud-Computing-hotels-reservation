import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NavBar = () => {
    const tenantId = localStorage.getItem('tenant_id'); // Comprobar si el usuario está autenticado
    const location = useLocation(); // Obtener la ubicación actual

    const isHome = location.pathname === '/home'; // Verificar si estamos en la página de inicio

    return (
        <nav className="bg-white p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/home" className="text-black text-lg font-bold">
                    Hotel App
                </Link>
                <ul className="flex space-x-4">
                    {isHome ? (
                        <>
                            {/* Solo mostrar Login y Register en la página de inicio */}
                            <li>
                                <Link to="/login" className="text-black hover:text-gray-500">Login</Link>
                            </li>
                            <li>
                                <Link to="/register" className="text-black hover:text-gray-500">Register</Link>
                            </li>
                        </>
                    ) : (
                        <>
                            {/* Mostrar opciones basadas en autenticación en otras páginas */}
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
                                    <li>
                                        <Link to="/profile" className="text-black hover:text-gray-500">Profile</Link>
                                    </li>
                                    <li>
                                        <Link to="/reservations" className="text-black hover:text-gray-500">Reservas</Link>
                                    </li>
                                    <li>
                                        <Link to="/payments" className="text-black hover:text-gray-500">Pagos</Link>
                                    </li>
                                </>
                            )}
                        </>
                    )}
                </ul>
            </div>
        </nav>
    );
};

export default NavBar;
