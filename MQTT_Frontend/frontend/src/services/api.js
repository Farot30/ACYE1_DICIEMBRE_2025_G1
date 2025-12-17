// api.js - Versión completa
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Mejor manejo de respuestas
const handleResponse = async (response, timeout = 10000) => {
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout de petición')), timeout)
  );
  
  const responsePromise = (async () => {
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Error ${response.status}`);
    }
    return response.json();
  })();
  
  return Promise.race([responsePromise, timeoutPromise]);
};

// Función con reintentos
const fetchWithRetry = async (url, options = {}, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      return await handleResponse(response);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

export const apiService = {
  // ========== MONITOREO (5.1-5.3) ==========
  getTemperature: async (startDate = null, endDate = null) => {
    let url = `${API_BASE_URL}/api/temperature`;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;
    return fetchWithRetry(url);
  },

  getHumidity: async (startDate = null, endDate = null) => {
    let url = `${API_BASE_URL}/api/humidity`;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;
    return fetchWithRetry(url);
  },

  // ========== ESTADO DEL SISTEMA ==========
  getSystemStatus: async () => {
    return fetchWithRetry(`${API_BASE_URL}/api/system/status/extended`);
  },

  getSystemStatusExtended: async () => {
    return fetchWithRetry(`${API_BASE_URL}/api/system/status/extended`);
  },

  // ========== CONTROL DE ACCESO (5.4) ==========
  openDoor: async (user = 'Usuario') => {
    return fetchWithRetry(`${API_BASE_URL}/api/door`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'OPEN', user }),
    });
  },

  closeDoor: async (user = 'Usuario') => {
    return fetchWithRetry(`${API_BASE_URL}/api/door`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'CLOSE', user }),
    });
  },

  getDoorHistory: async (startDate = null, endDate = null, limit = 50) => {
    let url = `${API_BASE_URL}/api/door/history`;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('limit', limit);
    if (params.toString()) url += `?${params.toString()}`;
    return fetchWithRetry(url);
  },

  getDoorStats: async () => {
    return fetchWithRetry(`${API_BASE_URL}/api/door/stats`);
  },

  // ========== SEGURIDAD E INTRUSIÓN (5.5) ==========
  getMotionEvents: async (startDate = null, endDate = null, limit = 50) => {
    let url = `${API_BASE_URL}/api/motion/events`;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('limit', limit);
    if (params.toString()) url += `?${params.toString()}`;
    return fetchWithRetry(url);
  },

  getIntrusionEvents: async (startDate = null, endDate = null, limit = 50) => {
    let url = `${API_BASE_URL}/api/intrusion/events`;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('limit', limit);
    if (params.toString()) url += `?${params.toString()}`;
    return fetchWithRetry(url);
  },

  forceResetIntrusion: async (user = 'Admin') => {
    return fetchWithRetry(`${API_BASE_URL}/api/intrusion/force-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user }),
    });
  },

  // ========== ILUMINACIÓN AUTOMÁTICA (5.6) ==========
  getLightingHistory: async (startDate = null, endDate = null, limit = 50) => {
    let url = `${API_BASE_URL}/api/lighting/history`;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('limit', limit);
    if (params.toString()) url += `?${params.toString()}`;
    return fetchWithRetry(url);
  },

  controlLighting: async (action, user = 'Usuario') => {
    return fetchWithRetry(`${API_BASE_URL}/api/lighting/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, user }),
    });
  },

  // ========== ALARMAS Y VENTILACIÓN ==========
  getActiveAlarms: async () => {
    return fetchWithRetry(`${API_BASE_URL}/api/alarms/active`);
  },

  getAlarmHistory: async (type = null, startDate = null, endDate = null, limit = 50) => {
    let url = `${API_BASE_URL}/api/alarms/history`;
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('limit', limit);
    if (params.toString()) url += `?${params.toString()}`;
    return fetchWithRetry(url);
  },

  forceResetAlarm: async (type, user = 'Admin') => {
    return fetchWithRetry(`${API_BASE_URL}/api/alarms/force-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, user }),
    });
  },

  // ========== VENTILACIÓN (5.1) ==========
  toggleFan: async (enable) => {
    return fetchWithRetry(`${API_BASE_URL}/api/fan/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enable }),
    });
  },

  getFanActivations: async (mode = null, startDate = null, endDate = null, limit = 50) => {
    let url = `${API_BASE_URL}/api/fan/activations`;
    const params = new URLSearchParams();
    if (mode) params.append('mode', mode);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('limit', limit);
    if (params.toString()) url += `?${params.toString()}`;
    return fetchWithRetry(url);
  },

  // ========== MANTENIMIENTO (5.5) ==========
  toggleMaintenance: async (enable, user = 'Usuario') => {
    return fetchWithRetry(`${API_BASE_URL}/api/maintenance/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enable, user }),
    });
  },

  // ========== MÉTRICAS (5.8) ==========
  getTodayMetrics: async () => {
    return fetchWithRetry(`${API_BASE_URL}/api/metrics/today`);
  },

  getTodayMetricsExtended: async () => {
    return fetchWithRetry(`${API_BASE_URL}/api/metrics/today/extended`);
  },

  // ========== UTILIDADES ==========
  getHealth: async () => {
    return fetchWithRetry(`${API_BASE_URL}/api/health`);
  },

  getEvents: async (startDate = null, endDate = null, limit = 50) => {
    let url = `${API_BASE_URL}/api/events`;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('limit', limit);
    url += `?${params.toString()}`;
    return fetchWithRetry(url);
  },
};

export default apiService;