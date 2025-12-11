// Configuración base de la API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Función auxiliar para manejar respuestas
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Error en la petición');
  }
  return response.json();
};

// ============================================
// ENDPOINTS DE CONSULTA
// ============================================

export const apiService = {
  // Obtener temperatura
  getTemperature: async (startDate = null, endDate = null) => {
    let url = `${API_BASE_URL}/api/temperature`;
    const params = new URLSearchParams();
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    if (params.toString()) url += `?${params.toString()}`;
    
    const response = await fetch(url);
    return handleResponse(response);
  },

  // Obtener humedad
  getHumidity: async (startDate = null, endDate = null) => {
    let url = `${API_BASE_URL}/api/humidity`;
    const params = new URLSearchParams();
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    if (params.toString()) url += `?${params.toString()}`;
    
    const response = await fetch(url);
    return handleResponse(response);
  },

  // Obtener eventos
  getEvents: async (startDate = null, endDate = null, limit = 50) => {
    let url = `${API_BASE_URL}/api/events`;
    const params = new URLSearchParams();
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('limit', limit);
    
    url += `?${params.toString()}`;
    
    const response = await fetch(url);
    return handleResponse(response);
  },

  // Obtener eventos por tipo
  getEventsByType: async (type, limit = 50) => {
    const response = await fetch(`${API_BASE_URL}/api/events/${type}?limit=${limit}`);
    return handleResponse(response);
  },

  // Obtener estadísticas del día
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/api/stats`);
    return handleResponse(response);
  },

  // Obtener estado del sistema
  getStatus: async () => {
    const response = await fetch(`${API_BASE_URL}/api/status`);
    return handleResponse(response);
  },

  // Verificar salud del servidor
  getHealth: async () => {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return handleResponse(response);
  },

  // ============================================
  // ENDPOINTS DE CONTROL
  // ============================================

  // Abrir puerta
  openDoor: async (user = 'Sistema') => {
    await fetch(`${API_BASE_URL}/api/door`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ON', user }),
    });
  },

  closeDoor: async (user = 'Sistema') => {
    await fetch(`${API_BASE_URL}/api/door`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'OFF', user }),
    });
  },

  // Toggle modo mantenimiento
  toggleMaintenance: async (enable, user = 'Sistema') => {
    const response = await fetch(`${API_BASE_URL}/api/maintenance/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ enable, user }),
    });
    return handleResponse(response);
  },

  // Toggle ventilador
  toggleFan: async (enable) => {
    const response = await fetch(`${API_BASE_URL}/api/fan/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ enable }),
    });
    return handleResponse(response);
  },
};

export default apiService;