import axios from "axios";

const USER_API = 'https://o8i8j2n3vj.execute-api.us-east-1.amazonaws.com';

export const fetchLogin = async(tenant_id, email, password) => {

    const response = await axios.post(`${USER_API}/dev/user/login`, {tenant_id, email, password});

    return response.data;

}

export const fetchRegister = async (tenant_id, nombre, email, password) => {

    const response = await axios.post(`${USER_API}/dev/user/register`, { tenant_id, nombre, email, password });

    return response.data;
};