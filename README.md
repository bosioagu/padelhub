# PadelHub

Plataforma de gestión para clubes y academias de pádel. Reservas de canchas, resultados de partidos, academia, notificaciones y panel de administración.

---

## Versioning

- Versión actual: `v0.1.0` taggeada en `main`
- Historial de cambios en [CHANGELOG.md](./CHANGELOG.md)
- Notas de release en [RELEASE_NOTES.md](./RELEASE_NOTES.md)

**Próximo release:**
```bash
npm run release        # interactivo: patch / minor / major → bumpa version, actualiza CHANGELOG, crea tag
npm run release:dry    # preview sin hacer cambios
```

---

## QA Environment

- Rama `qa` → Vercel crea automáticamente un Preview Deployment con URL propia
- Configurar en **Vercel → Settings → Environment Variables** → agregar las mismas variables con scope **Preview**, apuntando a un proyecto Supabase de prueba si se necesitan datos separados

**Workflow:**
```
feature/* → qa (QA) → main (producción)
```

### ¿Qué pasa cuando hago commit + push?

| Rama | Resultado |
|------|-----------|
| `qa` | Vercel despliega en Preview URL — **no toca producción** |
| `main` | Vercel despliega en producción |

**Trabajar en una feature:**
```bash
git checkout qa               # asegurate de estar en qa
# ... hacés cambios ...
git add .
git commit -m "feat: mi cambio"
git push origin qa            # → despliega en QA automáticamente
```

**Pasar a producción cuando QA está OK:**
```bash
git checkout main
git merge qa
git push origin main          # → despliega en producción
```

---

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_ANON_KEY` | Anon key pública de Supabase |

---

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

---

## Desarrollo local

```bash
npm install
ng serve
```

## Build

```bash
ng build            # producción
ng build --watch    # watch mode
```
