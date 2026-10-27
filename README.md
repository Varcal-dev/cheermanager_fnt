# CheerManager — Frontend

Interfaz web de **CheerManager**, plataforma multi-club para gestionar clubes de porrismo (cheerleading). Construida con **Next.js (App Router)**, **React 19** y **TypeScript**. Cubre la operación del club (personas, organización, horarios, finanzas, evaluaciones, eventos, tienda, administración), la administración de la plataforma (clubes) y un **portal de solo lectura** para deportistas y acudientes.

Consume la API REST del proyecto hermano **CheerManager Backend** (Spring Boot).

## Contenido

- [Stack](#stack)
- [Estructura](#estructura)
- [Navegación y pantallas](#navegación-y-pantallas)
- [Flujos de negocio y su estado en el front](#flujos-de-negocio-y-su-estado-en-el-front)
- [Autenticación, permisos y roles de usuario](#autenticación-permisos-y-roles-de-usuario)
- [Configuración](#configuración)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Convenciones](#convenciones)
- [Deuda técnica y pendientes](#deuda-técnica-y-pendientes)

## Stack

| Componente | Detalle |
|---|---|
| Framework | Next.js 15.2 (App Router) |
| Lenguaje | TypeScript 5 |
| UI | React 19, Tailwind CSS 3.4, shadcn/ui (Radix UI), lucide-react, `cmdk` |
| Formularios | react-hook-form + zod |
| HTTP | axios (instancia única en `lib/api.ts`) |
| Notificaciones | react-toastify |
| Gráficos | recharts 2.15 |
| Despliegue previsto | Vercel (u otro hosting de Next.js) |

## Estructura

```
app/
├── (auth)/                  # login, recuperar-password, reset-password, cambiar-password
├── <modulo>/page.tsx        # una carpeta por pantalla (ver tabla de navegación)
├── mi/page.tsx              # portal de deportista / acudiente (solo lectura)
├── clubes/page.tsx          # plataforma: alta y suspensión de clubes (superadmin)
├── components/
│   ├── Forms/               # modales y formularios por acción (crear, editar, anular, asignar...)
│   ├── matricula/           # asistente de matrícula (4 pasos) + useMatriculaState
│   ├── deportistas/         # paneles: evaluaciones, objetivos, acudientes y consentimientos
│   ├── eventos/             # formulario, grupos, premios, resultados y cobro por lote de un evento
│   ├── inventario/          # categorías, productos y variantes
│   ├── asistencias/ · categorias-nivel/ · Horarios/ (calendario semanal)
│   ├── nav-config.ts        # ÚNICA fuente de verdad de la navegación (sidebar + breadcrumbs)
│   ├── side-bar.tsx · top-bar.tsx · Breadcrumbs.tsx · CommandPalette.tsx (Cmd+K)
│   ├── OnboardingCard.tsx   # lista de puesta en marcha del club (inicio)
├── lib/
│   ├── dashboard.ts         # tipos y llamadas de los 9 dashboards
│   ├── facturas-pagos.ts    # facturas, pagos, cartera y generación de cobros mensuales
│   ├── matricula.ts · portal.ts · evaluacion-rutina.ts · rubrica-guia.ts
├── layout.tsx · page.tsx    # raíz e inicio (KPIs + pestañas de dashboards)
components/                  # shadcn/ui (ui/) y ProtectedRoute.tsx (única copia)
context/UserContext.tsx      # usuario, permisos y bandera de superadmin de plataforma
hooks/ · lib/                # use-mobile · api.ts (axios), auditoria.ts, deportistas-historiales.ts, utils.ts
```

## Navegación y pantallas

El sidebar y los breadcrumbs salen de `app/components/nav-config.ts`. Cada sección exige un permiso `ver_dash_*` (excepto Plataforma, que exige `gestionar_clubes`, y el portal, que exige `acceder_portal`).

| Sección | Pantallas |
|---|---|
| **Inicio** | `/` — KPIs, lista de arranque del club y pestañas de dashboards (Financiero, Deportistas, Organización, Evaluación, Eventos, Tienda, Administración) según permisos |
| **Mi portal** | `/mi` — avisos del club, facturas, pagos, asistencias, evaluaciones, objetivos, rutinas, solicitud de temporada; descarga CSV e impresión |
| **Personas** | Deportistas · Entrenadores · Historial médico · Consentimientos |
| **Organización** | Niveles · Divisiones · Categorías por nivel (solo lectura) · Temporadas · Grupos · Inscripciones (asistente de matrícula) · Solicitudes de inscripción |
| **Horarios** | Gestión de horarios · Asistencias |
| **Eventos** | Eventos y competencias (con grupos, premios y resultados) |
| **Evaluación** | Evaluaciones · Objetivos · Rutinas (rúbrica FEDECOLCHEER/IASF) · Criterios |
| **Tienda** | Inventario · Ventas |
| **Finanzas** | Inscripciones y membresías · Mensualidades y cuotas · Planes de pago · Descuentos · Convenios · Facturas · Pagos |
| **Administración** | Usuarios · Roles y permisos · Auditoría |
| **Plataforma** | Clubes (solo superadmin) |
| Cuenta | Perfil · Cambiar contraseña · Recuperar / restablecer contraseña |

Los ítems con `status: "soon"` se muestran deshabilitados con una insignia en lugar de generar un 404.

## Flujos de negocio y su estado en el front

Leyenda: ✅ vista completa · 🟡 parcial · ❌ falta la vista (el back ya existe salvo que se indique).

| Flujo | Estado | Dónde / qué falta |
|---|---|---|
| Login, recuperar/restablecer clave, cambio obligatorio de clave | ✅ | `(auth)/*`, `ProtectedRoute` redirige a `/cambiar-password` si `requiereCambioPassword` |
| Clave temporal (admin) | ✅ | `ClaveTemporalDialog` en usuarios |
| Alta/suspensión de clubes | ✅ | `/clubes` |
| Onboarding del club | ✅ | `OnboardingCard` en `/` |
| Usuarios, roles y permisos | ✅ | `/usuarios`, `/roles` (crear/editar permisos solo con `gestionar_catalogos`) |
| Deportistas, entrenadores, acudientes, foto, historial de estado | ✅ | `/deportistas`, `/entrenadores`, `AcudientesConsentimientosPanel` |
| Retirar y reactivar deportista | ✅ | `/deportistas`: botones **Retirar** (`eliminar_deportista`) y **Reactivar** (`modificar_deportista`, solo para Retirados); tras reactivar hay que matricularlo de nuevo. El formulario de edición no deja poner ni quitar "Retirado" a mano |
| Consentimientos (Ley 1581) | ✅ | `/consentimientos` y panel del deportista |
| Temporadas | ✅ | `/temporadas` |
| Grupos, candidatos, entrenadores asignados, horarios | ✅ | `/grupos`, `/horarios`, `/entrenadores` |
| Matrícula (deportista → plan → grupo → confirmación) | ✅ | `MatriculaWizard` desde `/inscripciones` o el botón "Matricular" de `/deportistas` |
| Aprobar / rechazar solicitudes de inscripción | ✅ | `/solicitudes-inscripcion`: filtro por estado, aprobar eligiendo plan de inscripción y mensualidad, rechazar con motivo (permiso `gestionar_inscripciones`) |
| Renovación por el deportista/acudiente | ✅ | `/mi` (solicitar y cancelar) |
| Facturación mensual y cartera en mora | ✅ | `/facturas` (filtro y días de mora), botón de generar cobros en `/pagos` (la facturación automática la hace el back) |
| Facturas manuales y anulación con motivo | ✅ | `NuevaFacturaModal`, `AnularDialog` |
| Pagos (registrar, estado, anular) | ✅ | `/pagos` |
| Planes, descuentos, convenios | ✅ | `/planes-*`, `/tipos-planes-pago`, `/descuentos`, `/convenios` |
| Asistencia | ✅ | `/asistencias`, `/horarios` |
| Evaluaciones y objetivos | ✅ | `/evaluaciones`, `/objetivos`, paneles del deportista |
| Criterios de evaluación (CRUD) | ✅ | `/criterios-evaluacion`: filtro por categoría, crear/editar/eliminar según permisos; marca los criterios con evaluaciones |
| Rutinas con rúbrica | 🟡 | `/evaluacion-rutina` captura, vista previa e historial; la configuración de la rúbrica (solo plataforma) no tiene pantalla |
| Eventos, grupos, premios, resultados | ✅ | `/eventos` con paneles |
| Cobro de un evento por lote | ✅ | Pestaña **Cobro** en cada evento (`CobroEventoPanel`): elige grupos y valor, vista previa y confirmación; requiere `crear_factura` |
| Inventario y ventas | 🟡 | `/inventario`, `/ventas` (con anulación por motivo). Sin alerta de stock bajo (el endpoint existe). Al vender a un miembro, la casilla "Pagada al momento" (por defecto marcada) registra el pago; desmarcada, queda a cuenta |
| Portal deportista/acudiente | ✅ | `/mi` (con avisos del club: `AvisosPortal`) |
| Recordatorios de mora | ✅ | Tarjeta en `/pagos` (`RecordatoriosMoraCard`, permiso `gestionar_recordatorios_mora`): canales con casillas (sistema marcado por defecto), vista previa, envío, envío automático y correo de prueba |
| Dashboards | ✅ | Los 9 conectados en `/` con carga diferida por pestaña |
| Auditoría | ✅ | `/auditoria` (los `logs-acceso` no tienen pantalla) |

## Autenticación, permisos y roles de usuario

- `POST /api/login` devuelve un JWT que se guarda en `localStorage` (`cheer_manager_token`). El token incluye el club del usuario; el front **no** envía ningún id de club.
- `lib/api.ts` agrega `Authorization: Bearer <token>` y, ante un `401` fuera de los endpoints de autenticación, limpia la sesión y redirige a `/login`. Usa `getErrorMessage()` para leer errores (algunos endpoints devuelven JSON `{ message }` y otros texto plano).
- `context/UserContext.tsx` carga `/api/usuario/me` y `/api/usuario/permisos`, y expone la bandera `esPlataforma` (permiso `gestionar_clubes`).
- `ProtectedRoute` exige un permiso por pantalla: sin sesión → `/login`; clave por cambiar → `/cambiar-password`; sin permiso → `/error-permisos`, o `/mi` si el usuario tiene `acceder_portal`.
- `WithPermission` oculta botones y acciones según permisos; el backend siempre vuelve a validar.
- Roles plantilla por club: **Administrador**, **Entrenador**, **Deportista** y **Acudiente** (estos dos ven solo `/mi`).

## Configuración

| Variable | Por defecto | Descripción |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8081` | URL base de la API |

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8081
```

En producción apunta a la URL HTTPS de la API y asegúrate de que el dominio del front esté en `CORS_ALLOWED_ORIGINS` del backend.

## Instalación y ejecución

Requisitos: Node.js 18+ (recomendado 20 LTS), npm y el backend en marcha.

```bash
git clone https://github.com/varcal-dev/cheermanager_front.git
cd cheermanager_front
npm install        # el proyecto usa legacy-peer-deps (.npmrc)
npm run dev        # http://localhost:3000
```

```bash
npm run dev      # desarrollo
npm run build    # build de producción
npm run start    # servir el build
npm run lint     # next lint
```

Para probar de punta a punta: entra con el superadmin del backend, crea un club desde `/clubes` y entra luego con el administrador de ese club.

## Convenciones

- **Una sola fuente de navegación**: páginas nuevas, movidas o retiradas se declaran solo en `app/components/nav-config.ts`.
- **Modales de formulario** en `app/components/Forms/`, uno por acción y módulo.
- **Acceso a datos** en `app/lib/*.ts`; evita llamadas axios sueltas dentro de los componentes grandes.
- **Estados de cuenta** de facturas: el back los calcula (`PENDIENTE`, `ABONO_PARCIAL`, `PAGADA`, `EN_MORA`, `ANULADA`) y `facturas-pagos.ts` los traduce a etiquetas.
- **Lógica de negocio en el backend**: el front muestra, valida lo básico y delega las reglas.
- **UI base** con shadcn/ui y Tailwind; identidad de marca Ratels (dorado, tipografías Space Grotesk / Inter / JetBrains Mono).

## Deuda técnica y pendientes

1. **Dos `next.config`** (`.mjs` con `ignoreBuildErrors`/`ignoreDuringBuilds`, `.ts` con `NEXT_PUBLIC_API_URL`): unificar en uno y, cuando se pueda, quitar el ocultamiento de errores de tipos.
2. **Páginas muy grandes** (`deportistas` ≈ 2.300 líneas, `page.tsx` ≈ 1.400, `entrenadores`, `evaluaciones`, `evaluacion-rutina`, `usuarios` ≈ 1.000+): dividir en componentes y extraer un hook genérico de CRUD para eliminar el código repetido de carga/modales.
3. Endpoints sin consumo en el front: `refresh-token`, `facturas/mora`, `producto-variantes/stock-bajo`, `deportistas/{id}/perfil-completo`, `logs-acceso/*`.
4. No hay pruebas automatizadas ni CI en el front.
