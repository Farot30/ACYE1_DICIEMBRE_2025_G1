// Reemplaza TODO el archivo StatisticsSection.js

import React from 'react';
import { 
  TrendingUp, Thermometer, Bell, DoorOpen, Clock, Calendar 
} from 'lucide-react';
import '../styles/StatisticsSection.css';

function StatisticsSection({ dailyStats, currentTime, threeDaysSummary }) {
  return (
    <div className="section-content-wrapper">
      <div className="section-header-main">
        <h2 className="section-title-main">Estadísticas del Día</h2>
        <span className="date-badge">
          <Calendar size={16} />
          {currentTime.toLocaleDateString('es-GT')}
        </span>
      </div>

      <div className="stats-grid-detailed">
        <div className="stat-card-detailed">
          <div className="stat-icon-wrapper red">
            <TrendingUp size={28} />
          </div>
          <div className="stat-details">
            <span className="stat-label-detailed">Temperatura Máxima</span>
            <span className="stat-value-detailed">{dailyStats.maxTemp}°C</span>
            <span className="stat-sublabel">Registrada hoy</span>
          </div>
        </div>

        <div className="stat-card-detailed">
          <div className="stat-icon-wrapper blue">
            <Thermometer size={28} />
          </div>
          <div className="stat-details">
            <span className="stat-label-detailed">Temperatura Mínima</span>
            <span className="stat-value-detailed">{dailyStats.minTemp}°C</span>
            <span className="stat-sublabel">Registrada hoy</span>
          </div>
        </div>

        <div className="stat-card-detailed">
          <div className="stat-icon-wrapper yellow">
            <Bell size={28} />
          </div>
          <div className="stat-details">
            <span className="stat-label-detailed">Total de Alarmas</span>
            <span className="stat-value-detailed">{dailyStats.totalAlarms}</span>
            <span className="stat-sublabel">Activadas en el día</span>
          </div>
        </div>

        <div className="stat-card-detailed">
          <div className="stat-icon-wrapper green">
            <DoorOpen size={28} />
          </div>
          <div className="stat-details">
            <span className="stat-label-detailed">Accesos del Día</span>
            <span className="stat-value-detailed">{dailyStats.totalAccess}</span>
            <span className="stat-sublabel">Personal autorizado</span>
          </div>
        </div>

        <div className="stat-card-detailed">
          <div className="stat-icon-wrapper purple">
            <Clock size={16} />
          </div>
          <div className="stat-details">
            <span className="stat-label-detailed">Tiempo Promedio Puerta Abierta</span>
            <span className="stat-value-detailed">{dailyStats.avgDoorOpenTime}</span>
            <span className="stat-sublabel">Calculado sobre {dailyStats.totalAccess} accesos</span>
          </div>
        </div>
      </div>

      {/* Resumen de 3 días - DATOS REALES */}
      <div className="summary-card">
        <h3 className="summary-title">Resumen de los Últimos 3 Días</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Promedio de Temperatura</span>
            <span className="summary-value">{threeDaysSummary.avgTemp}°C</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Promedio de Humedad</span>
            <span className="summary-value">{threeDaysSummary.avgHumidity}%</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Accesos (3 días)</span>
            <span className="summary-value">{threeDaysSummary.totalAccess}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Eficiencia del Sistema</span>
            <span className="summary-value">{threeDaysSummary.systemEfficiency}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatisticsSection;