# Release Notes

## v0.1.0 — Setup inicial (próximo)

### Resumen
Primera versión funcional de PadelHub. Incluye autenticación completa, gestión de canchas y reservas, panel de administración y soporte PWA.

### Novedades
- **Autenticación** — login/registro con email y OAuth, setup de perfil, guards por rol
- **Canchas** — grilla semanal pública con disponibilidad en tiempo real
- **Reservas** — flujo completo: nueva reserva, listado personal, detalle y cancelación
- **Resultados** — carga y consulta de resultados de partidos
- **Academia** — consulta de clases y horarios disponibles
- **Admin** — gestión de canchas, jugadores, academia y notificaciones
- **PWA** — instalable en dispositivos móviles

### Stack técnico
- Angular 21 + Supabase + Tailwind CSS v3 + Angular Material
- Deploy en Vercel (QA y Producción)

### Cambios necesarios antes del release
- [ ] Completar `src/environments/environment.ts` con URLs de Supabase de producción
- [ ] Ejecutar migración SQL inicial en Supabase (`src/supabase/migrations/001_initial_schema.sql`)
- [ ] Configurar variables de entorno en Vercel
- [ ] Verificar flujo completo de auth en producción

---

> Para el historial completo de cambios ver [CHANGELOG.md](CHANGELOG.md).
