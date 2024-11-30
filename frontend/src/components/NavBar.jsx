import React from 'react';
import { Link } from 'react-router-dom';

const NavBar = () => {
    return (
        <nav className="bg-white p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/home" className="text-black text-lg font-bold hover:text-gray-700">
                    Hotel App
                </Link>
                <ul className="flex space-x-4">
                    <li>
                        <Link to="/dashboard" className="text-black hover:text-gray-700">Dashboard</Link>
                    </li>
                    <li>
                        <Link to="/login" className="text-black hover:text-gray-700">Login</Link>
                    </li>
                    <li>
                        <Link to="/register" className="text-black hover:text-gray-700">Register</Link>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default NavBar;