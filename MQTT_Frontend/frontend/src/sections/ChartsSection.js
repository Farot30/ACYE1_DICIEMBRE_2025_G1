import React, { useState, useEffect } from 'react';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';
import '../styles/ChartsSection.css';

function ChartsSection({ historicalData, eventsByType, events }) {
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [minTemp, setMinTemp] = useState('');
  const [maxTemp, setMaxTemp] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Log para debugging
  useEffect(() => {
    console.log('📈 [ChartsSection] historicalData recibido:', historicalData);
    console.log('📈 [ChartsSection] Cantidad de datos:', historicalData?.length);
  }, [historicalData]);

  const filteredEvents = events.filter(event => {
    // Filtro por tipo
    if (filterType !== 'all' && event.type !== filterType) return false;
    
    // Filtro por fecha
    if (filterDate && event.date !== filterDate) return false;
    
    // Filtro por rango de temperatura
    if (minTemp !== '' && event.temp < parseFloat(minTemp)) return false;
    if (maxTemp !== '' && event.temp > parseFloat(maxTemp)) return false;
    
    return true;
  });

  // Calcular coordenadas para las líneas - CON VALIDACIÓN
  const getLinePoints = (data, maxValue) => {
    if (!data || data.length === 0) {
      console.warn('⚠️ getLinePoints: No hay datos');
      return '0,100';
    }
    
    if (data.length === 1) {
      console.log('📊 Solo hay 1 dato, centrando en la gráfica');
      const y = 100 - (data[0] / maxValue) * 100;
      return `100,${y}`;
    }

    const width = 200;
    const height = 100;
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - (value / maxValue) * height;
      return `${x},${y}`;
    });
    
    return points.join(' ');
  };

  const hasData = historicalData && historicalData.length > 0;
  
  const tempValues = hasData 
    ? historicalData.map(d => d.temp).filter(v => v !== null && v !== undefined)
    : [];
  const humidityValues = hasData 
    ? historicalData.map(d => d.humidity).filter(v => v !== null && v !== undefined)
    : [];
  
  console.log('🌡️ [ChartsSection] Valores temp:', tempValues);
  console.log('💧 [ChartsSection] Valores humidity:', humidityValues);
  
  const tempPoints = getLinePoints(tempValues, 50);
  const humidityPoints = getLinePoints(humidityValues, 100);

  // Función para limpiar filtros
  const handleClearFilters = () => {
    setFilterType('all');
    setFilterDate('');
    setMinTemp('');
    setMaxTemp('');
  };

  return (
    <div className="section-content-wrapper">
      <div className="section-header-main">
        <h2 className="section-title-main">Gráficas Históricas</h2>

      </div>

      {!hasData && (
        <div style={{
          padding: '20px',
          backgroundColor: '#242320ff',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <strong>⚠️ Sin datos históricos</strong>
          <p>Esperando datos de MongoDB...</p>
        </div>
      )}

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
              
              {tempValues.length > 0 && (
                <>
                  <polyline
                    points={tempPoints}
                    className="temp-line"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="0.5"
                  />
                  
                  {tempValues.map((temp, index) => {
                    const x = tempValues.length === 1 
                      ? 100 
                      : (index / (tempValues.length - 1)) * 200;
                    const y = 100 - (temp / 50) * 100;
                    return (
                      <circle
                        key={index}
                        cx={x}
                        cy={y}
                        r="1"
                        className="temp-point"
                        fill="#ef4444"
                      >
                        <title>{temp}°C - {historicalData[index]?.time}</title>
                      </circle>
                    );
                  })}
                </>
              )}
            </svg>
            
            <div className="x-axis">
              {hasData && historicalData.map((data, index) => {
                // Mostrar solo cada 5to punto para no saturar el eje X
                if (index % 5 === 0 || index === historicalData.length - 1) {
                  return (
                    <span key={index} className="x-label" style={{fontSize: '10px'}}>
                      {data.time?.slice(0,5) || data.date?.slice(5)}
                    </span>
                  );
                }
                return null;
              })}
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
              
              {humidityValues.length > 0 && (
                <>
                  <polyline
                    points={humidityPoints}
                    className="humidity-line"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="0.5"
                  />
                  
                  {humidityValues.map((humidity, index) => {
                    const x = humidityValues.length === 1 
                      ? 100 
                      : (index / (humidityValues.length - 1)) * 200;
                    const y = 100 - (humidity / 100) * 100;
                    return (
                      <circle
                        key={index}
                        cx={x}
                        cy={y}
                        r="1"
                        className="humidity-point"
                        fill="#3b82f6"
                      >
                        <title>{humidity}% - {historicalData[index]?.time}</title>
                      </circle>
                    );
                  })}
                </>
              )}
            </svg>
            
            <div className="x-axis">
              {hasData && historicalData.map((data, index) => {
                // Mostrar solo cada 5to punto
                if (index % 5 === 0 || index === historicalData.length - 1) {
                  return (
                    <span key={index} className="x-label" style={{fontSize: '10px'}}>
                      {data.time?.slice(0,5) || data.date?.slice(5)}
                    </span>
                  );
                }
                return null;
              })}
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
                  style={{width: `${(event.count / 200) * 100}%`}}
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
          <h3 className="chart-title">
            Últimos Eventos Registrados 
          </h3>
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
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)} 
                className="filter-select"
              >
                <option value="all">Todos</option>
                <option value="Acceso">Acceso</option>
                <option value="Temperatura Alta">Temperatura Alta</option>
                <option value="Humedad Alta">Humedad Alta</option>
                <option value="Intrusión">Intrusión</option>
                <option value="Ventilador">Ventilador</option>
                <option value="Mantenimiento">Mantenimiento</option>
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
            
            <div className="filter-group">
              <label>Temperatura Mínima (°C):</label>
              <input 
                type="number" 
                value={minTemp}
                onChange={(e) => setMinTemp(e.target.value)}
                placeholder="Ej: 20"
                className="filter-input"
                min="0"
                max="50"
              />
            </div>
            
            <div className="filter-group">
              <label>Temperatura Máxima (°C):</label>
              <input 
                type="number" 
                value={maxTemp}
                onChange={(e) => setMaxTemp(e.target.value)}
                placeholder="Ej: 35"
                className="filter-input"
                min="0"
                max="50"
              />
            </div>
            
            <button 
              className="clear-filters-btn"
              onClick={handleClearFilters}
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
              {filteredEvents.length > 0 ? (
                filteredEvents.slice(0, 50).map((event) => (
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
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>
                    No hay eventos que coincidan con los filtros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {filteredEvents.length > 50 && (
            <div style={{
              textAlign: 'center',
              padding: '15px',
              color: '#666',
              fontSize: '14px',
              borderTop: '1px solid #e0e0e0'
            }}>
              Mostrando los primeros 50 eventos de {filteredEvents.length} resultados. 
              Usa los filtros para refinar la búsqueda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChartsSection;