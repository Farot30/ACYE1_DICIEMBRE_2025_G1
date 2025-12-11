import React, { useState } from 'react';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';
import '../styles/ChartsSection.css';

function ChartsSection({ historicalData, eventsByType, events }) {
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredEvents = events.filter(event => {
    if (filterType !== 'all' && event.type !== filterType) return false;
    if (filterDate && event.date !== filterDate) return false;
    return true;
  });

  // Calcular coordenadas para las líneas
  const getLinePoints = (data, maxValue) => {
    const width = 200; // Cambiado de 100 a 200
    const height = 100;
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - (value / maxValue) * height;
      return `${x},${y}`;
    });
    return points.join(' ');
  };

  const tempValues = historicalData.map(d => d.temp);
  const humidityValues = historicalData.map(d => d.humidity);
  const tempPoints = getLinePoints(tempValues, 50);
  const humidityPoints = getLinePoints(humidityValues, 100);

  return (
    <div className="section-content-wrapper">
      <div className="section-header-main">
        <h2 className="section-title-main">Gráficas Históricas</h2>
        <span className="date-range">Últimos 6 días</span>
      </div>

      {/* Gráfica de líneas - Temperatura */}
      <div className="chart-card">
        <h3 className="chart-title">Temperatura (°C)</h3>
        <div className="line-chart-container">
          <div className="y-axis">
            <span className="y-label">50°</span>
            <span className="y-label">40°</span>
            <span className="y-label">30°</span>
            <span className="y-label">20°</span>
            <span className="y-label">10°</span>
            <span className="y-label">0°</span>
          </div>
          
          <div className="chart-area">
            <svg className="line-chart-svg" viewBox="0 0 200 100" preserveAspectRatio="none">
              <line x1="0" y1="0" x2="200" y2="0" className="grid-line" />
              <line x1="0" y1="20" x2="200" y2="20" className="grid-line" />
              <line x1="0" y1="40" x2="200" y2="40" className="grid-line" />
              <line x1="0" y1="60" x2="200" y2="60" className="grid-line" />
              <line x1="0" y1="80" x2="200" y2="80" className="grid-line" />
              <line x1="0" y1="100" x2="200" y2="100" className="grid-line" />
              
              <polyline
                points={tempPoints}
                className="temp-line"
                fill="none"
                stroke="#ef4444"
                strokeWidth="0.5"
              />
              
              {tempValues.map((temp, index) => {
                const x = (index / (tempValues.length - 1)) * 200;
                const y = 100 - (temp / 50) * 100;
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="2"
                    className="temp-point"
                    fill="#ef4444"
                  >
                    <title>{temp}°C</title>
                  </circle>
                );
              })}
            </svg>
            
            <div className="x-axis">
              {historicalData.map((data, index) => (
                <span key={index} className="x-label">{data.date.slice(5)}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Gráfica de líneas - Humedad */}
      <div className="chart-card">
        <h3 className="chart-title">Humedad (%)</h3>
        <div className="line-chart-container">
          <div className="y-axis">
            <span className="y-label">100%</span>
            <span className="y-label">80%</span>
            <span className="y-label">60%</span>
            <span className="y-label">40%</span>
            <span className="y-label">20%</span>
            <span className="y-label">0%</span>
          </div>
          
          <div className="chart-area">
            <svg className="line-chart-svg" viewBox="0 0 200 100" preserveAspectRatio="none">
              <line x1="0" y1="0" x2="200" y2="0" className="grid-line" />
              <line x1="0" y1="20" x2="200" y2="20" className="grid-line" />
              <line x1="0" y1="40" x2="200" y2="40" className="grid-line" />
              <line x1="0" y1="60" x2="200" y2="60" className="grid-line" />
              <line x1="0" y1="80" x2="200" y2="80" className="grid-line" />
              <line x1="0" y1="100" x2="200" y2="100" className="grid-line" />
              
              <polyline
                points={humidityPoints}
                className="humidity-line"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="0.5"
              />
              
              {humidityValues.map((humidity, index) => {
                const x = (index / (humidityValues.length - 1)) * 200;
                const y = 100 - (humidity / 100) * 100;
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="2"
                    className="humidity-point"
                    fill="#3b82f6"
                  >
                    <title>{humidity}%</title>
                  </circle>
                );
              })}
            </svg>
            
            <div className="x-axis">
              {historicalData.map((data, index) => (
                <span key={index} className="x-label">{data.date.slice(5)}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Gráfica de barras - Eventos */}
      <div className="chart-card">
        <h3 className="chart-title">Cantidad de Eventos por Tipo</h3>
        <div className="bar-chart-horizontal">
          {eventsByType.map((event, index) => (
            <div key={index} className="bar-item">
              <span className="bar-label-left">{event.type}</span>
              <div className="bar-container">
                <div 
                  className="bar-fill" 
                  style={{width: `${(event.count / 15) * 100}%`}}
                >
                  <span className="bar-value">{event.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla de eventos */}
      <div className="table-card">
        <div className="table-header">
          <h3 className="chart-title">Últimos Eventos Registrados</h3>
          <button 
            className="filter-button"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filtros
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {showFilters && (
          <div className="filters-panel">
            <div className="filter-group">
              <label>Tipo de Evento:</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-select">
                <option value="all">Todos</option>
                <option value="Acceso">Acceso</option>
                <option value="Temperatura Alta">Temperatura Alta</option>
                <option value="Humedad Alta">Humedad Alta</option>
                <option value="Intrusión">Intrusión</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Fecha:</label>
              <input 
                type="date" 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="filter-input"
              />
            </div>
            <button 
              className="clear-filters-btn"
              onClick={() => {
                setFilterType('all');
                setFilterDate('');
              }}
            >
              Limpiar Filtros
            </button>
          </div>
        )}

        <div className="table-wrapper">
          <table className="events-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Temperatura</th>
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr key={event.id}>
                  <td>
                    <span className={`event-type-badge ${event.type.toLowerCase().replace(' ', '-')}`}>
                      {event.type}
                    </span>
                  </td>
                  <td>{event.date}</td>
                  <td>{event.time}</td>
                  <td>{event.temp}°C</td>
                  <td>{event.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ChartsSection;