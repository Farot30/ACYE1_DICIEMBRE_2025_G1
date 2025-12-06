// ==================== FUNCIONES AUXILIARES ====================

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-GT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('es-GT', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const formatTemperature = (temp) => {
  return `${temp.toFixed(1)}°C`;
};

export const formatHumidity = (humidity) => {
  return `${humidity.toFixed(1)}%`;
};

export const getEventTypeColor = (type) => {
  const colors = {
    alarm: '#ff0000',
    access: '#00ff00',
    temp: '#ff6400',
    humidity: '#0096ff'
  };
  return colors[type] || '#00ffff';
};

export const getSystemStatusColor = (status) => {
  const colors = {
    Normal: '#00ff00',
    Alarma: '#ff0000',
    Mantenimiento: '#ffa500'
  };
  return colors[status] || '#888';
};

export const generateMockData = (days = 3) => {
  const data = [];
  const now = new Date();
  
  for (let i = days * 24; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 3600000);
    data.push({
      time: date.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' }),
      temp: 20 + Math.random() * 8,
      humidity: 40 + Math.random() * 15
    });
  }
  
  return data;
};