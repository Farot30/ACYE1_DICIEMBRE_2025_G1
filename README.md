
# Data Center Monitoring System - FIUSAC [ACYE1-Grupo 1]

## Integrantes del Proyecto

| Nombre                          | Carnet    |
|---------------------------------|-----------|
| Yeison Omar López Dueñas        | 202102688 |
| Héctor Antonio Cardona Cos      | 202307354 |
| Ottoniel Fabicio Vásquez Pineda | 202307820 |
| Pablo Daniel Velásquez Hernández| 202302232 |
| Diego Eduardo España Vásquez    | 202307716 |

## Descripción del Proyecto
Este repositorio contiene la implementación del Proyecto 1: Data Center - FIUSAC para el curso de Arquitectura de Computadoras y Ensambladores 1 en la Facultad de Ingeniería de la Universidad de San Carlos de Guatemala (USAC). El proyecto desarrolla un sistema de monitoreo y seguridad para el Data Center de Servidores de Ingeniería, utilizando Raspberry Pi para integrar sensores y actuadores, con comunicación en tiempo real vía MQTT y almacenamiento en MongoDB.

El sistema permite monitorear condiciones ambientales (temperatura, humedad, movimiento), activar alertas automáticas, controlar accesos remotos y visualizar datos a través de una aplicación web con dashboard.
Problema a Resolver
El Data Center carece de monitoreo automatizado 24/7, lo que puede causar interrupciones en servicios académicos y administrativos, pérdida de datos o daños en equipos por sobrecalentamiento o intrusiones.

## Objetivos

- Diseñar un sistema integral de monitoreo y seguridad.
- Integrar hardware y software para operación continua.
- Proporcionar visualización y control remoto.

## Tecnologías Utilizadas

- Raspberry Pi con Python para IoT.
- Protocolo MQTT (HiveMQ).
- API REST.
- Aplicación web (framework opcional: React, etc.).
- MongoDB en la nube.
- GitHub para control de versiones.

## Instrucciones de Instalación

- Clonar el repositorio: git clone https://github.com/Farot30/ACYE1_DICIEMBRE_2025_G1.git
- Configurar MQTT y MongoDB en un archivo .env o config.py.
- Instalar dependencias: pip install paho-mqtt RPi.GPIO pymongo Adafruit_DHT.
- Ejecutar: Python en Raspberry Pi, backend API y web app localmente.

## Uso

- Accede al dashboard web con credenciales institucionales.
- Monitorea en tiempo real, visualiza históricos y controla dispositivos vía MQTT.

## Entregables

- Prototipo físico funcional.
- Código fuente en GitHub con README y configs.
- Manuales técnico y de usuario.
- Video de demostración.
