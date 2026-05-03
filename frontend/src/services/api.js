import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const generateData = () => axios.get(`${BASE_URL}/generate-data`)
export const getForecast = () => axios.get(`${BASE_URL}/forecast`)
export const getRisk = () => axios.get(`${BASE_URL}/risk`)
export const getSchedule = () => axios.get(`${BASE_URL}/schedule`)
export const getExplain = () => axios.get(`${BASE_URL}/explain`)
