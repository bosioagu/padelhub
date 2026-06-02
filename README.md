# PadelHub

Plataforma de gestión para clubes y academias de pádel. Reservas de canchas, resultados de partidos, academia, notificaciones y panel de administración.

## Stack

- **Frontend:** Angular 21 (standalone components, signals, inject())
- **Backend / DB:** Supabase (Auth, PostgreSQL, Realtime)
- **Estilos:** Tailwind CSS v3 + Angular Material
- **Emails:** Resend
- **Deploy:** Vercel

## Módulos

| Módulo | Descripción |
|---|---|
| Auth | Login, registro, OAuth, profile setup |
| Canchas | Grilla semanal de disponibilidad (público) |
| Reservas | Listado, nueva reserva, detalle |
| Resultados | Carga y consulta de partidos |
| Academia | Clases y horarios |
| Perfil | Datos del jugador |
| Admin | Dashboard, canchas, jugadores, academia, notificaciones |

## Roles

- **Admin** — gestión completa del club
- **Player** — reservas, resultados, academia
- **Público** — consulta de canchas (sin login)

## Entornos

| Rama | Entorno | URL |
|---|---|---|
| `main` | Producción | TBD |
| `qa` | QA | TBD |

## Setup local

```bash
# Instalar dependencias
npm install

# Variables de entorno
cp src/environments/environment.ts src/environments/environment.local.ts
# Completar con las URLs de tu proyecto Supabase

# Servidor de desarrollo
ng serve
```

## Build

```bash
ng build            # producción
ng build --watch    # watch mode
```

## Testing

```bash
ng test
```

## Deploy

Los deploys se hacen automáticamente vía Vercel:
- Push a `qa` → entorno QA
- Push a `main` → producción

## Licencia

MIT
