import axios from "axios";

const USER_API = 'https://o8i8j2n3vj.execute-api.us-east-1.amazonaws.com/dev/user';

const ROOM_API = 'https://y3z1dcl3bi.execute-api.us-east-1.amazonaws.com/dev';

const COMMENT_API = 'https://9kdkljwjjk.execute-api.us-east-1.amazonaws.com/dev/comments';

// USER

export const fetchLogin = async(tenant_id, email, password) => {

    const response = await axios.post(`${USER_API}/login`, {tenant_id, email, password});

    return response.data;

}

export const fetchRegister = async (tenant_id, nombre, email, password) => {

    const response = await axios.post(`${USER_API}/register`, { tenant_id, nombre, email, password });

    return response.data;
};

// ROOMS

export const fetchRoomsByTenant = async (tenant_id) => {
    try {
        // Recuperar el token del localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
            throw new Error('Token no disponible');
        }

        // Configurar los encabezados de la solicitud con el token
        const config = {
            headers: {
                Authorization: token  // El token se incluye directamente sin el prefijo "Bearer"
            }
        };

        // Realizar la solicitud GET con el tenant_id en la URL y los encabezados de autorización
        const response = await axios.get(`${ROOM_API}/rooms/${tenant_id}`, config);

        console.log(response.data);  // Mostrar la respuesta en consola
        return response.data;
    } catch (error) {
        console.error("Error al obtener las habitaciones:", error);
        throw error;  // Lanza el error para que pueda ser manejado donde se llame esta función
    }
};

export const fetchRoomById = async (tenant_id, room_id) => {
    try {
        // Recuperar el token del localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
            throw new Error('Token no disponible');
        }

        // Configurar los encabezados de la solicitud con el token
        const config = {
            headers: {
                Authorization: token  // El token se incluye directamente sin el prefijo "Bearer"
            }
        };

        // Realizar la solicitud GET con tenant_id y room_id en la URL y los encabezados de autorización
        const response = await axios.get(`${ROOM_API}/room/${tenant_id}/${room_id}`, config);

        console.log(response.data);  // Mostrar la respuesta en consola
        return response.data;  // Retorna los detalles de la habitación
    } catch (error) {
        console.error("Error al obtener los detalles de la habitación:", error);
        throw error;  // Lanza el error para que pueda ser manejado donde se llame esta función
    }
};

// COMMENTS

export const fetchCommentsByRoom = async (tenant_id, room_id) => {
    try {
        // Recuperar el token del localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
            throw new Error('Token no disponible');
        }

        // Configurar los encabezados de la solicitud con el token
        const config = {
            headers: {
                Authorization: token  // El token se incluye directamente sin el prefijo "Bearer"
            }
        };

        // Realizar la solicitud GET con tenant_id y room_id en la URL y los encabezados de autorización
        const response = await axios.get(`${COMMENT_API}/${tenant_id}/${room_id}`, config);

        console.log(response.data);  // Mostrar la respuesta en consola
        return response.data.body.comments;  // Retornamos los comentarios
    } catch (error) {
        console.error("Error al obtener los comentarios:", error);
        throw error;  // Lanza el error para que pueda ser manejado donde se llame esta función
    }
};