# Calendario App (React + Vim + TypeScript)

Una aplicación de calendario simple inspirada en Google Calendar, construida con React, TypeScript y Vite.

## Características

- Vista mensual interactiva
- Navegación entre meses
- Creación, edición y eliminación de eventos
- Categorización por colores (tipo Google Calendar)
- Persistencia de datos en local (localStorage)

## Instrucciones de Instalación

Como esta aplicación fue generada manualmente, necesitarás instalar las dependencias primero.

1. Abre una terminal en esta carpeta:
   ```bash
   cd /Users/aldairpa/Documents/Horario
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Tecnologías

- **React**: Biblioteca de UI
- **TypeScript**: Tipado estático
- **Vite**: Build tool rápido
- **Tailwind-like CSS**: Estilos personalizados en CSS puro (inspirado en Material Design)
- **date-fns**: Manejo de fechas
- **lucide-react**: Iconos modernos

## Estructura del Proyecto

- `src/components`: Componentes reutilizables (CalendarGrid, Header, EventModal)
- `src/context`: Estado global de la aplicación (CalendarContext)
- `src/utils`: Utilidades de fechas
- `src/App.tsx`: Layout principal
