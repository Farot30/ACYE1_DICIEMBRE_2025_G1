## Descripción General

Sistema web de monitoreo y control en tiempo real para centros de datos desarrollado para la Facultad de Ingeniería USAC. Permite visualizar métricas ambientales, controlar accesos, gestionar alertas y analizar datos históricos mediante una interfaz moderna y responsive.

---

## 🔐 Acceso al Sistema

### Credenciales de Acceso
- **Usuario:** `fiusac_datacenter`
- **Contraseña:** `SecurePass2025`

### URL de Acceso
- **Desarrollo:** `http://localhost:3000`
- **Producción:** (Configurar según deployment)

---

## Secciones del Dashboard

El sistema cuenta con **4 secciones principales** accesibles desde la barra de navegación superior:

### **1** Estado en Tiempo Real

**Propósito:** Monitoreo instantáneo de las condiciones actuales del datacenter.

**Métricas Disponibles:**
- **🌡️ Temperatura:** Lectura actual en grados Celsius con estado (Normal/Alta)
- **💧 Humedad:** Porcentaje de humedad relativa con indicador de estado
- **🚪 Estado de Puerta:** Abierta/Cerrada con indicador de seguridad
- **🛡️ Estado del Sistema:** Operativo/Alarma con código de estado

**Panel de Alertas Activas:**
- Contador de alertas en tiempo real
- Lista de eventos recientes con timestamps
- Indicadores visuales por tipo de alerta (⚠️ Advertencia, ℹ️ Información)

**Actualización:** Se refresca automáticamente cada **3 segundos**

---

### **2** Gráficas Históricas

**Propósito:** Visualización de tendencias y análisis de datos de los últimos 3 días.

#### 📈 Gráfica de Temperatura
- **Rango:** 0°C - 50°C
- **Período:** Últimos 3 días (mínimo)
- **Visualización:** Línea continua con puntos individuales
- **Tooltip:** Hover sobre puntos para ver valor exacto y timestamp

#### 💧 Gráfica de Humedad
- **Rango:** 0% - 100%
- **Período:** Últimos 3 días (mínimo)
- **Visualización:** Línea continua con puntos individuales
- **Tooltip:** Hover sobre puntos para ver valor exacto y timestamp

#### 📊 Cantidad de Eventos por Tipo
**Gráfica de barras horizontal mostrando:**
- 🔑 **Acceso:** Aperturas/cierres de puerta
- 🌡️ **Temperatura Alta:** Eventos > 28°C (umbral configurable)
- 💧 **Humedad Alta:** Eventos > 70% (umbral configurable)
- 🚨 **Intrusión:** Detecciones de movimiento no autorizado

#### 📋 Tabla Filtrable: Últimos 50 Eventos Registrados

**Columnas:**
- **Tipo:** Badge visual por categoría de evento
- **Fecha:** Formato YYYY-MM-DD
- **Hora:** Formato 24h (HH:MM:SS)
- **Temperatura:** Valor en °C al momento del evento
- **Descripción:** Detalle del evento

**Filtros Disponibles:**

1. **Por Tipo de Evento:**
   - Todos
   - Acceso
   - Temperatura Alta
   - Humedad Alta
   - Intrusión
   - Ventilador
   - Mantenimiento

2. **Por Fecha:**
   - Selector de calendario para filtrar día específico

3. **Por Rango de Temperatura:**
   - **Temperatura Mínima:** Ej: 20°C
   - **Temperatura Máxima:** Ej: 35°C

**Botón "Limpiar Filtros":** Resetea todos los filtros a valores por defecto

**Límite de Visualización:** 50 eventos. Si hay más resultados, aparece mensaje informativo.

**Actualización:** Se refresca automáticamente cada **3 segundos**

---

### **3.** Estadísticas

**Propósito:** Análisis de métricas del día actual y resumen de 3 días.

#### Estadísticas del Día (Tarjetas Individuales)

1. **Temperatura Máxima**
   - Valor más alto registrado hoy
   - Indicador visual rojo

2. **Temperatura Mínima**
   - Valor más bajo registrado hoy
   - Indicador visual azul

3. **Total de Alarmas**
   - Suma de alertas de temperatura y humedad del día
   - Indicador visual amarillo

4. **Accesos del Día**
   - Contador de aperturas de puerta autorizadas
   - Indicador visual verde

5. **Tiempo Promedio Puerta Abierta**
   - Cálculo basado en eventos de acceso
   - Formato: Xm Ys

#### Resumen de los Últimos 3 Días

**Panel con 4 métricas calculadas:**

1. **Promedio de Temperatura**
   - Promedio aritmético de todas las lecturas de 3 días
   - Precisión: 1 decimal

2. **Promedio de Humedad**
   - Promedio aritmético de todas las lecturas de 3 días
   - Precisión: 1 decimal

3. **Total Accesos (3 días)**
   - Suma de eventos de acceso en el período

4. **Eficiencia del Sistema**
   - Porcentaje basado en lecturas recibidas vs esperadas
   - Fórmula: `(lecturas_recibidas / lecturas_esperadas) * 100`
   - Lecturas esperadas = 3 días × 24h × 60min × 6 lecturas/min

**Actualización:** Se refresca automáticamente cada **3 segundos**

---

### **4.** Panel de Control

**Propósito:** Control remoto de actuadores del datacenter.

#### Controles Disponibles

##### 1. Control de Puerta

**Estados:**
- **Cerrada (Bloqueada)** - Verde, seguro
- **Abierta (Desbloqueada)** - Rojo, atención

**Acciones:**
- **Abrir Puerta:** Envía comando `ON` vía MQTT
- **Cerrar Puerta:** Envía comando `OFF` vía MQTT

**Proceso:**
1. Click en botón "Abrir Puerta" o "Cerrar Puerta"
2. Botón muestra estado "Procesando..."
3. Sistema envía comando MQTT a Raspberry Pi
4. Backend crea evento en MongoDB
5. Notificación de confirmación aparece
6. Estado se actualiza en 3 segundos

**Registro:** Cada acción queda registrada con timestamp y usuario

---

##### 2. 🔧 Modo Mantenimiento

**Estados:**
- **Activado** - Desactiva alarmas automáticas
- **Desactivado** - Sistema en modo normal

**Funcionalidad:**
- Al activarse: Suspende triggers de alarmas de temperatura/humedad
- Al desactivarse: Reanuda monitoreo automático

**Proceso:**
1. Click en switch "Modo Mantenimiento"
2. Sistema envía comando `ON` o `OFF` vía MQTT
3. Backend registra evento con usuario que lo activó
4. Notificación de confirmación
5. Estado se refleja en toda la aplicación

**Uso Recomendado:**
- Activar antes de realizar mantenimiento preventivo
- Desactivar al finalizar trabajos en el datacenter

---

##### 3. Control de Ventilador

**Estados:**
- **Encendido** - Ventilación activa
- **Apagado** - Ventilación manual desactivada

**Acciones:**
- **Encender:** Activa ventilador manualmente
- **Apagar:** Desactiva ventilador

**Proceso:**
1. Click en botón "Encender Ventilador" o "Apagar Ventilador"
2. Sistema envía comando MQTT
3. Backend registra evento
4. Notificación visual de confirmación

**Nota:** El ventilador también puede activarse automáticamente cuando temperatura > umbral (28°C)

---

#### Panel de Notificaciones

**Ubicación:** Parte inferior del Panel de Control

**Tipos de Notificaciones:**

1. **Éxito (Verde):**
   - "Puerta abierta exitosamente"
   - "Ventilador encendido correctamente"
   - "Modo mantenimiento activado"

2. **Error (Rojo):**
   - "Error al abrir puerta"
   - "Fallo en comunicación MQTT"
   - "Backend no responde"

3. **Advertencia (Amarillo):**
   - "Temperatura crítica - Revisar sistema"
   - "Puerta abierta por más de 5 minutos"

**Duración:** Las notificaciones se auto-ocultan después de 5 segundos

**Límite:** Máximo 5 notificaciones visibles simultáneamente

---

## Tipos de Alertas y Su Interpretación

### 1. Alerta de Temperatura Alta

**Condición de Disparo:** Temperatura > 28°C

**Apariencia en Sistema:**
- Badge rojo en tabla de eventos
- Contador incrementa en gráfica de barras
- Descripción: "Temperatura crítica detectada: XXºC (umbral: 28ºC)"

**Acciones Recomendadas:**
1. Verificar funcionamiento del aire acondicionado
2. Activar ventilador manualmente desde Panel de Control
3. Revisar carga de servidores
4. Si persiste > 5 minutos, activar protocolo de enfriamiento de emergencia

**Reseteo Automático:** Cuando temperatura vuelve a < 28°C

---

### 2. Alerta de Humedad Alta

**Condición de Disparo:** Humedad > 70

**Apariencia en Sistema:**
- Badge azul claro en tabla de eventos
- Contador incrementa en gráfica de barras
- Descripción: "Humedad elevada detectada: XX% (umbral: 70%)"

**Acciones Recomendadas:**
1. Verificar sistema de deshumidificación
2. Revisar fugas de agua en techo/paredes
3. Aumentar ventilación si temperatura lo permite
4. Revisar condensación en equipos

**Riesgo:** Humedad alta puede causar corrosión y cortocircuitos

---

### 3. Alerta de Acceso

**Condición de Disparo:** 
- Puerta abierta/cerrada (eventos normales)
- Puerta abierta > 5 minutos (advertencia)

**Tipos de Eventos de Acceso:**
- **"Puerta OPEN"** - Apertura autorizada
- **"Puerta CLOSED"** - Cierre normal
- **"Puerta abriendo"** - Comando desde web
- **"Puerta cerrando"** - Comando desde web

**Registro:** Incluye usuario que realizó la acción

**Acciones Recomendadas:**
- Si apertura es > 5 min: Verificar si personal está dentro
- Si no hay personal autorizado: Cerrar remotamente desde Panel de Control

---

### 4. Alerta de Intrusión

**Condición de Disparo:** Sensor PIR detecta movimiento cuando modo mantenimiento está OFF

**Apariencia en Sistema:**
- Badge rojo oscuro en tabla de eventos
- Descripción: "Movimiento detectado"
- Incrementa contador en gráfica

**Acciones Recomendadas:**
1. **INMEDIATO:** Verificar cámaras de seguridad
2. Revisar registro de accesos autorizados
3. Si no hay personal autorizado: Activar protocolo de seguridad
4. Contactar a personal de vigilancia

**Nota:** Si estás realizando mantenimiento, activa "Modo Mantenimiento" para evitar falsas alarmas

---

### 5. Evento de Ventilador

**Tipos:**
- "Ventilador encendido" - Activación manual o automática
- "Ventilador apagado" - Desactivación manual

**No es una alerta crítica,** solo registro de activaciones

---

### 6. Evento de Mantenimiento

**Tipos:**
- "Mantenimiento activado" - Inicio de modo mantenimiento
- "Mantenimiento desactivado" - Fin de modo mantenimiento

**Incluye:** Usuario que activó/desactivó el modo

**Propósito:** Auditoría de intervalos de mantenimiento

---

## Sistema de Actualización Automática

El dashboard se actualiza automáticamente SIN necesidad de refrescar la página:

### Intervalos de Actualización

| Sección | Frecuencia | Datos que se actualizan |
|---------|-----------|-------------------------|
| **Estado en Tiempo Real** | 3 segundos | Temp, humedad, estado puerta, alertas |
| **Gráficas Históricas** | 3 segundos | Nuevos puntos en gráficas, eventos |
| **Estadísticas** | 3 segundos | Promedios, contadores, métricas |
| **Panel de Control** | Al cargar página | Estado inicial de actuadores |
| **Reloj del Header** | 1 segundo | Hora actual del sistema |

### Indicadores Visuales de "En Vivo"

- **Punto verde parpadeante** en sección "Estado en Tiempo Real"
- Badge "EN VIVO" en header de sección
- Notificaciones emergentes al detectar nuevos eventos
