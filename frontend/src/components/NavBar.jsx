import React from 'react';
import { Link } from 'react-router-dom';

const NavBar = () => {
    return (
        <nav className="bg-blue-500 p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/dashboard" className="text-white text-lg font-bold hover:text-gray-200">
                    Hotel App
                </Link>
                <ul className="flex space-x-4">
                    <li>
                        <Link to="/login" className="text-white hover:text-gray-200">Login</Link>
                    </li>
                    <li>
                        <Link to="/register" className="text-white hover:text-gray-200">Register</Link>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default NavBar;