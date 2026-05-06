import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const generateData = () => axios.get(`${BASE_URL}/generate-data`)
export const getRisk = () => axios.get(`${BASE_URL}/risk`)
export const getSchedule = () => axios.get(`${BASE_URL}/schedule`)

// ChargeWise Core
export const getSessions = (limit = 100) => axios.get(`${BASE_URL}/v1/sessions?limit=${limit}`)
export const getLoad = (limit = 288) => axios.get(`${BASE_URL}/v1/load?limit=${limit}`)
export const getForecast = (horizonHours = 24) => axios.get(`${BASE_URL}/v1/forecast?horizon_hours=${horizonHours}`)
export const getScheduleRecommendation = (horizonHours = 24) => axios.get(`${BASE_URL}/v1/schedule/recommendation?horizon_hours=${horizonHours}`)
export const getPlanningCandidates = () => axios.get(`${BASE_URL}/v1/planning/candidates`)

// Advanced Intelligence (Features 5-10)
export const getProbabilisticForecast = (horizonHours = 24) => axios.get(`${BASE_URL}/v1/forecast/probabilistic?horizon_hours=${horizonHours}`)
export const getGridRisk = (horizonHours = 24) => axios.get(`${BASE_URL}/v1/risk?horizon_hours=${horizonHours}`)
export const getDynamicPricing = (horizonHours = 24) => axios.get(`${BASE_URL}/v1/pricing?horizon_hours=${horizonHours}`)
export const getAnomalies = (horizonHours = 24) => axios.get(`${BASE_URL}/v1/anomalies?horizon_hours=${horizonHours}`)
export const getHierarchicalForecast = (horizonHours = 24) => axios.get(`${BASE_URL}/v1/forecast/hierarchy?horizon_hours=${horizonHours}`)
export const getDashboardSummary = (horizonHours = 24) => axios.get(`${BASE_URL}/v1/dashboard/summary?horizon_hours=${horizonHours}`)
