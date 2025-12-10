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

  return (
    <div className="section-content-wrapper">
      <div className="section-header-main">
        <h2 className="section-title-main">Gráficas Históricas</h2>
        <span className="date-range">Últimos 3 días</span>
      </div>

      {/* Gráfica de líneas */}
      <div className="chart-card">
        <h3 className="chart-title">Temperatura y Humedad</h3>
        <div className="line-chart">
          {historicalData.map((data, index) => (
            <div key={index} className="chart-bar-group">
              <div className="chart-bar temp-bar" style={{height: `${(data.temp / 30) * 100}%`}}>
                <span className="bar-label">{data.temp}°</span>
              </div>
              <div className="chart-bar humidity-bar" style={{height: `${(data.humidity / 60) * 100}%`}}>
                <span className="bar-label">{data.humidity}%</span>
              </div>
              <span className="chart-date">{data.date.slice(5)}</span>
            </div>
          ))}
        </div>
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-color temp"></span>
            <span>Temperatura</span>
          </div>
          <div className="legend-item">
            <span className="legend-color humidity"></span>
            <span>Humedad</span>
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