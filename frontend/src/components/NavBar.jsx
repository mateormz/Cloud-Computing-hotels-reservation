import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const NavBar = () => {
    const tenantId = localStorage.getItem('tenant_id'); // Comprobar si el usuario está autenticado
    const location = useLocation(); // Obtener la ubicación actual
    const navigate = useNavigate(); // Hook para redirigir al usuario

    const isHome = location.pathname === '/home'; // Verificar si estamos en la página de inicio
    const isLogin = location.pathname === '/login'; // Verificar si estamos en la página de login
    const isRegister = location.pathname === '/register'; // Verificar si estamos en la página de registro

    // Función para cerrar sesión
    const handleLogout = () => {
        localStorage.removeItem('tenant_id');
        localStorage.removeItem('user_id');
        navigate('/home'); // Redirigir a la página de inicio
    };

    return (
        <nav className="bg-white p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <Link to="/home" className="text-black text-lg font-bold">
                        Hotel App
                    </Link>
                </div>

                <ul className="flex space-x-4">
                    {isHome ? (
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
                                    {!isHome && !isLogin && !isRegister && (
                                        <button
                                            onClick={() => navigate('/dashboard')}
                                            className="text-black hover:text-gray-500"
                                        >
                                            Dashboard
                                        </button>
                                    )}
                                    <li>
                                        <Link to="/profile" className="text-black hover:text-gray-500">Profile</Link>
                                    </li>
                                    <li>
                                        <button
                                            onClick={handleLogout}
                                            className="text-black hover:text-gray-500"
                                        >
                                            Logout
                                        </button>
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