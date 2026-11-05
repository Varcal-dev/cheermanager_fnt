# CheerManager — Frontend

Interfaz web de **CheerManager**, plataforma multi-club para gestionar clubes de porrismo (cheerleading). Construida con **Next.js (App Router)**, **React 19** y **TypeScript**. Cubre la operación del club (personas, organización, horarios, finanzas, evaluaciones, eventos, tienda, administración), la administración de la plataforma (clubes y suscripciones) y un **portal de solo lectura** para deportistas y acudientes.

Consume la API REST del proyecto hermano **CheerManager Backend** (Spring Boot).

## Contenido

- [Stack](#stack)
- [Estructura](#estructura)
- [Navegación y pantallas](#navegación-y-pantallas)
- [Flujos de negocio y su estado en el front](#flujos-de-negocio-y-su-estado-en-el-front)
- [Autenticación, permisos y sesión](#autenticación-permisos-y-sesión)
- [Suscripción y bloque legal](#suscripción-y-bloque-legal)
- [Configuración](#configuración)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Integración continua](#integración-continua)
- [Convenciones](#convenciones)
- [Deuda técnica y pendientes](#deuda-técnica-y-pendientes)

## Stack

| Componente | Detalle |
|---|---|
| Framework | Next.js 15.5 (App Router) |
| Lenguaje | TypeScript 5 |
| UI | React 19, Tailwind CSS 3.4, shadcn/ui (Radix UI), lucide-react, `cmdk`, next-themes |
| Formularios | react-hook-form + zod |
| HTTP | axios (instancia única en `lib/api.ts`) |
| Notificaciones | react-toastify |
| Gráficos | recharts 2.15 |
| Fechas | date-fns |
| Despliegue previsto | Vercel (u otro hosting de Next.js) |

## Estructura

```
app/
├── (auth)/                  # login, recuperar-password, reset-password, cambiar-password, terminos
├── <modulo>/page.tsx        # una carpeta por pantalla (ver tabla de navegación)
├── mi/                      # portal de deportista / acudiente (solo lectura) y mi/autorizaciones
├── clubes/page.tsx          # plataforma: alta, suspensión y suscripción de clubes (superadmin)
├── components/
│   ├── Forms/               # modales y formularios por acción (crear, editar, anular, asignar...)
│   ├── matricula/           # asistente de matrícula (4 pasos) + useMatriculaState
│   ├── deportistas/         # detalle, paneles (evaluaciones, objetivos, acudientes y consentimientos),
│   │                        #   historial, copia de datos y anonimización
│   ├── evaluacion-rutina/   # captura, deducciones, drivers, historial y guías de la rúbrica
│   ├── eventos/             # formulario, grupos, premios, resultados y cobro por lote
│   ├── inicio/              # pestañas de dashboards (carga diferida con useResumenPerezoso)
│   ├── inventario/ · pagos/ · portal/ · usuarios/ · entrenadores/ · asistencias/ · categorias-nivel/ · Horarios/
│   ├── nav-config.ts        # ÚNICA fuente de verdad de la navegación (sidebar + breadcrumbs)
│   ├── side-bar.tsx · top-bar.tsx · Breadcrumbs.tsx · CommandPalette.tsx (Cmd+K)
│   └── OnboardingCard.tsx · AvisoSuscripcion.tsx
├── lib/                     # acceso a datos y tipos por dominio: dashboard, facturas-pagos, matricula,
│                            #   portal, evaluacion-rutina, rubrica-guia, suscripcion, autorizaciones,
│                            #   autorizacion-imprimible, copia-datos, evaluaciones
├── layout.tsx · page.tsx    # raíz e inicio (KPIs + pestañas de dashboards)
components/                  # shadcn/ui (ui/) y ProtectedRoute.tsx (única copia)
context/UserContext.tsx      # usuario, permisos, esPlataforma y legalPendiente
hooks/ · lib/                # use-mobile · api.ts (axios), auditoria.ts, deportistas-historiales.ts, utils.ts
public/habilidades/          # imágenes de guía de habilidades N1–N4 (elevaciones y gimnasia)
```

## Navegación y pantallas

El sidebar y los breadcrumbs salen de `app/components/nav-config.ts`. Cada sección exige un permiso `ver_dash_*` (excepto Plataforma, que exige `gestionar_clubes`, y el portal, que exige `acceder_portal`).

| Sección | Pantallas |
|---|---|
| **Inicio** | `/` — KPIs, lista de arranque del club y pestañas de dashboards según permisos |
| **Mi portal** | `/mi` — avisos, facturas, pagos, asistencias, evaluaciones, objetivos, rutinas, solicitud de temporada; descarga CSV e impresión · `/mi/autorizaciones` |
| **Personas** | Deportistas · Entrenadores · Historial médico · Consentimientos · Importar y exportar |
| **Organización** | Niveles · Divisiones · Categorías por nivel (solo lectura) · Temporadas · Grupos · Inscripciones (asistente de matrícula) · Solicitudes |
| **Horarios** | Gestión de horarios · Asistencias |
| **Eventos** | Eventos y competencias (grupos, premios, resultados y cobro) |
| **Evaluación** | Criterios · Evaluaciones · Objetivos · Rutinas (rúbrica FEDECOLCHEER/IASF) · Rúbrica |
| **Tienda** | Inventario · Ventas |
| **Finanzas** | Inscripciones y membresías · Mensualidades y cuotas · Planes de pago · Descuentos · Convenios · Facturas · Pagos · Caja · Conciliación |
| **Administración** | Usuarios · Roles y permisos · Auditoría |
| **Plataforma** | Clubes (solo superadmin) |
| Cuenta | Perfil · Cambiar contraseña · Recuperar / restablecer contraseña · Términos |

Los ítems con `status: "soon"` se muestran deshabilitados con una insignia en lugar de generar un 404. Las páginas Importar y exportar, Consentimientos, Caja y Conciliación validan además su propio permiso (`importar_deportistas` / `exportar_listados`, `ver_caja`, `conciliar_pagos`).

## Flujos de negocio y su estado en el front

Leyenda: ✅ vista completa · 🟡 parcial · ❌ falta la vista (el back ya existe salvo que se indique).

| Flujo | Estado | Dónde / qué falta |
|---|---|---|
| Login, recuperar/restablecer clave, cambio obligatorio de clave | ✅ | `(auth)/*`; `ProtectedRoute` redirige a `/cambiar-password` si `requiereCambioPassword` |
| Clave temporal (admin) | ✅ | `ClaveTemporalDialog` en usuarios |
| Alta/suspensión de clubes y suscripciones | ✅ | `/clubes` |
| Aceptación de términos del club | ✅ | Redirección del Administrador cuando `legalPendiente`; `/terminos` |
| Onboarding del club | ✅ | `OnboardingCard` en `/` |
| Usuarios, roles y permisos | ✅ | `/usuarios`, `/roles` (crear/editar permisos solo con `gestionar_catalogos`) |
| Deportistas, entrenadores, acudientes, foto, historial de estado | ✅ | `/deportistas`, `/entrenadores`, `AcudientesConsentimientosPanel` |
| Retirar y reactivar deportista | ✅ | Botones **Retirar** (`eliminar_deportista`) y **Reactivar** (`modificar_deportista`, solo Retirados); tras reactivar hay que matricularlo de nuevo |
| Consentimientos (Ley 1581), copia de datos y anonimización | ✅ | `/consentimientos`, `CopiaDatosButtons`, `AnonimizarTitularButton`, `ImprimirAutorizacionesButton` |
| Importación de deportistas y exportes CSV | ✅ | `/importar-exportar` |
| Temporadas | ✅ | `/temporadas` |
| Grupos, candidatos, entrenadores asignados, horarios | ✅ | `/grupos`, `/horarios`, `/entrenadores` |
| Matrícula (deportista → plan → grupo → confirmación) | ✅ | `MatriculaWizard` desde `/inscripciones` o el botón «Matricular» de `/deportistas` |
| Solicitudes de inscripción (aprobar / rechazar) | ✅ | `/solicitudes-inscripcion` (permiso `gestionar_inscripciones`) |
| Renovación por el deportista/acudiente | ✅ | `/mi` (solicitar y cancelar) |
| Facturación mensual y cartera en mora | ✅ | `/facturas` (filtro y días de mora); botón de generar cobros en `/pagos` |
| Facturas manuales y anulación con motivo | ✅ | `NuevaFacturaModal`, `AnularDialog` |
| Pagos (registrar, estado, anular) | ✅ | `/pagos` |
| Caja y conciliación | ✅ | `/caja`, `/conciliacion` |
| Recordatorios de mora | ✅ | `RecordatoriosMoraCard` en `/pagos` (`gestionar_recordatorios_mora`) |
| Planes, descuentos, convenios | ✅ | `/planes-*`, `/tipos-planes-pago`, `/descuentos`, `/convenios` |
| Asistencia | ✅ | `/asistencias`, `/horarios` |
| Evaluaciones y objetivos | ✅ | `/evaluaciones`, `/objetivos`, paneles del deportista |
| Criterios de evaluación (CRUD) | ✅ | `/criterios-evaluacion` |
| Rutinas con rúbrica | ✅ | `/evaluacion-rutina` (captura, vista previa, historial) y `/rubrica` (consulta; edición solo plataforma con `configurar_rubrica`) |
| Eventos, grupos, premios, resultados | ✅ | `/eventos` con paneles |
| Cobro de un evento por lote | ✅ | Pestaña **Cobro** (`CobroEventoPanel`); requiere `crear_factura` |
| Inventario y ventas | 🟡 | `/inventario`, `/ventas` (con anulación por motivo). Sin alerta de stock bajo (el endpoint existe) |
| Portal deportista/acudiente | ✅ | `/mi` con avisos del club (`AvisosPortal`) y autorizaciones |
| Dashboards | ✅ | Los 9 conectados en `/` con carga diferida por pestaña |
| Auditoría | 🟡 | `/auditoria`; los `logs-acceso` no tienen pantalla |

## Autenticación, permisos y sesión

- `POST /api/login` devuelve un JWT que se guarda en `localStorage` (`cheer_manager_token`). El token incluye el club del usuario; el front **no** envía ningún id de club.
- `lib/api.ts` agrega `Authorization: Bearer <token>`. **Renueva la sesión en silencio**: cuando al token le quedan menos de 30 minutos pide uno nuevo con `POST /api/refresh-token`; si falla, sigue con el actual y no cierra la sesión. Ante un `401` fuera de los endpoints de autenticación, limpia la sesión y redirige a `/login`. `getErrorMessage()` lee errores (JSON `{ message }` o texto plano).
- `context/UserContext.tsx` carga `/api/usuario/me` y `/api/usuario/permisos` y expone `esPlataforma` (permiso `gestionar_clubes`) y `legalPendiente`.
- `ProtectedRoute` exige un permiso por pantalla: sin sesión → `/login`; clave por cambiar → `/cambiar-password`; sin permiso → `/error-permisos`, o `/mi` si el usuario tiene `acceder_portal`.
- `WithPermission` oculta botones y acciones según permisos; el backend siempre vuelve a validar.
- Roles plantilla por club: Administrador, Director Deportivo, Coordinador Administrativo, Entrenador, Asistente, Tesorero, Encargado de Inventario, Deportista y Acudiente (estos dos ven solo `/mi`).

## Suscripción y bloque legal

- Si la suscripción del club está vencida, el backend responde `402` a las escrituras (las consultas siguen funcionando); `AvisoSuscripcion` informa el estado.
- Si el club no ha aceptado los términos vigentes, las escrituras responden `428` y el Administrador es llevado a aceptarlos.
- En ambos casos se muestra el mensaje que envía el servidor.

## Configuración

| Variable | Por defecto | Descripción |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8081` | URL base de la API (el valor por defecto vive en `lib/api.ts`) |

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8081
```

En producción apunta a la URL HTTPS de la API y asegúrate de que el dominio del front esté en `CORS_ALLOWED_ORIGINS` del backend. No redefinas `NEXT_PUBLIC_*` en `next.config.ts`: una variable ausente se convertiría en el texto «undefined».

## Instalación y ejecución

Requisitos: Node.js 18+ (recomendado 20 LTS), npm y el backend en marcha.

```bash
git clone https://github.com/varcal-dev/cheermanager_front.git
cd cheermanager_front
npm install        # el proyecto usa legacy-peer-deps (.npmrc) por React 19
npm run dev        # http://localhost:3000
```

```bash
npm run dev      # desarrollo
npm run build    # build de producción
npm run start    # servir el build
npm run lint     # next lint
```

Para probar de punta a punta: entra con el superadmin del backend, crea un club desde `/clubes` y entra luego con el administrador de ese club (cambiará la clave y aceptará los términos).

## Integración continua

GitHub Actions (`.github/workflows/ci.yml`): Node 20, `npm ci`, `npx tsc --noEmit` y `npm run build`.

## Convenciones

- **Una sola fuente de navegación**: páginas nuevas, movidas o retiradas se declaran solo en `app/components/nav-config.ts`.
- **Modales de formulario** en `app/components/Forms/`, uno por acción y módulo.
- **Acceso a datos** en `app/lib/*.ts`; evita llamadas axios sueltas dentro de los componentes grandes.
- **Estados de cuenta** de facturas: el back los calcula (`PENDIENTE`, `ABONO_PARCIAL`, `PAGADA`, `EN_MORA`, `ANULADA`) y `facturas-pagos.ts` los traduce a etiquetas.
- **Lógica de negocio en el backend**: el front muestra, valida lo básico y delega las reglas.
- **UI base** con shadcn/ui y Tailwind; identidad de marca Ratels (dorado, tipografías Space Grotesk / Inter / JetBrains Mono).

## Deuda técnica y pendientes

1. **Páginas muy grandes** (`deportistas` ≈ 2.300 líneas, `page.tsx` ≈ 1.400, `entrenadores`, `evaluaciones`, `evaluacion-rutina`, `usuarios` ≈ 1.000+): dividir en componentes y extraer un hook genérico de CRUD.
2. Endpoints sin consumo en el front: `facturas/mora`, `producto-variantes/stock-bajo`, `deportistas/{id}/perfil-completo`, `logs-acceso/*`.
3. **No hay pruebas automatizadas** en el front (el CI solo revisa tipos y build).
4. Hay un `Dockerfile` en `app/uploads/` que parece fuera de lugar: revisar si debe estar ahí.
5. Alerta de stock bajo en inventario y pantalla para `logs-acceso`.