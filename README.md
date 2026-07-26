# CheerManager — Frontend

Interfaz web de **CheerManager**, construida con **Next.js** (App Router) y **TypeScript**, para la gestión integral de un club deportivo de porrismo: personas, organización deportiva, horarios, evaluaciones, eventos, tienda/inventario, finanzas, y administración de usuarios/roles.

Este frontend consume la API REST del proyecto hermano **CheerManager Backend** (Spring Boot).

## Tabla de contenido

- [Stack técnico](#stack-técnico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Navegación y módulos](#navegación-y-módulos)
- [Autenticación y permisos](#autenticación-y-permisos)
- [Requisitos previos](#requisitos-previos)
- [Configuración](#configuración)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Convenciones del proyecto](#convenciones-del-proyecto)

## Stack técnico

| Componente | Detalle |
|---|---|
| Framework | Next.js 15 (App Router) |
| Lenguaje | TypeScript |
| UI | React 19, Tailwind CSS, shadcn/ui (Radix UI primitives) |
| Formularios | react-hook-form + zod |
| HTTP | axios |
| Notificaciones | sonner / react-toastify |
| Gráficos | recharts |
| Íconos | lucide-react |

## Estructura del proyecto

```
app/
├── (auth)/                    # Rutas de autenticación agrupadas
│   ├── login/
│   ├── recuperar-password/
│   ├── reset-password/
│   └── cambiar-password/
├── components/
│   ├── Forms/                 # Modales y formularios de creación/edición por módulo
│   ├── asistencias/
│   ├── categorias-nivel/
│   ├── Breadcrumbs.tsx
│   ├── nav-config.ts          # Fuente única de verdad de la navegación (sidebar + breadcrumbs)
│   ├── Sidebar.tsx / side-bar.tsx
│   ├── top-bar.tsx
│   ├── mode-toggle.tsx / theme-provider.tsx
│   ├── with-permission.tsx    # HOC/guard para ocultar UI según permisos
│   └── access-denied.tsx
├── lib/
│   ├── data/                  # Helpers de acceso a datos por módulo (asistencias, categorías, etc.)
│   ├── facturas-pagos.ts
│   └── navetagation.ts
├── <módulo>/page.tsx          # Una carpeta por sección (deportistas, grupos, pagos, eventos, etc.)
└── layout.tsx / globals.css

components/
├── ui/                        # Componentes shadcn/ui
├── ProtectedRoute.tsx
└── theme-provider.tsx

context/
└── UserContext.tsx            # Estado global de usuario/sesión/permisos

hooks/
├── use-mobile.tsx
└── use-toast.ts

lib/
├── api.ts                     # Instancia de axios + interceptores (token, 401)
└── utils.ts
```

## Navegación y módulos

La navegación del sidebar y los breadcrumbs se generan a partir de una única fuente de verdad: `app/components/nav-config.ts`. Cada sección requiere un permiso (`ver_dash_*`) y agrupa varias páginas:

| Sección | Páginas |
|---|---|
| **Personas** | Deportistas, Entrenadores, Historial Médico |
| **Organización** | Niveles, Divisiones, Categorías por Nivel, Grupos, Inscripciones |
| **Horarios** | Gestión de Horarios, Asistencias |
| **Eventos** | Competencias y Eventos, Premios (próximamente) |
| **Evaluación** | Evaluaciones, Criterios (próximamente), Objetivos (próximamente) |
| **Tienda** | Inventario, Ventas, Productos (próximamente) |
| **Finanzas** | Planes de Inscripción, Planes de Mensualidad, Facturas, Pagos, Descuentos, Convenios |
| **Administración** | Usuarios, Roles, Auditoría |

Los ítems marcados como `status: "soon"` corresponden a endpoints que ya existen en el backend pero cuya vista aún no se ha construido en el frontend; se muestran en el sidebar deshabilitados con un badge en vez de generar un 404.

## Autenticación y permisos

- El login obtiene un JWT desde el backend (`POST /api/login`) y se almacena en `localStorage` bajo la clave `cheer_manager_token`.
- `lib/api.ts` configura una instancia de axios que:
  - agrega automáticamente el header `Authorization: Bearer <token>` a cada request,
  - intercepta respuestas `401` (token inválido/expirado o en blacklist tras logout), limpia el token y redirige a `/login`, salvo que la petición sea al propio endpoint de login.
- `context/UserContext.tsx` mantiene el estado global del usuario autenticado y sus permisos.
- `components/ProtectedRoute.tsx` y `app/components/with-permission.tsx` controlan el acceso a rutas y elementos de UI según el rol/permisos del usuario; `app/error-permisos/page.tsx` se muestra cuando el acceso es denegado.

## Requisitos previos

- Node.js 18+ (recomendado 20 LTS)
- npm (o yarn)
- El backend de CheerManager corriendo (por defecto en `http://localhost:8081`)

## Configuración

Variable de entorno principal:

| Variable | Por defecto | Descripción |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8081` | URL base de la API del backend |

Crear un archivo `.env.local` en la raíz del proyecto si se necesita apuntar a un backend distinto al de desarrollo local:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8081
```

## Instalación y ejecución

```bash
git clone https://github.com/varcal-dev/cheermanager_front.git
cd cheermanager_front

npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:3000`.

Scripts disponibles:

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run start    # Servir el build de producción
npm run lint     # Linter (next lint)
```

> El backend debe permitir CORS desde `http://localhost:3000` (ya configurado por defecto en `SecurityConfig` del backend).

## Convenciones del proyecto

- **Un solo lugar para la navegación**: cualquier página nueva, movida o eliminada del sidebar/breadcrumbs se declara únicamente en `app/components/nav-config.ts`.
- **Modales de formulario** viven en `app/components/Forms/`, uno por acción (crear, editar, eliminar, asignar) y por módulo.
- **Acceso a datos** por módulo se centraliza en `app/lib/data/` y `app/lib/*.ts` en lugar de llamadas axios sueltas dentro de los componentes.
- **UI base** con shadcn/ui (`components/ui/`), estilos con Tailwind CSS.
- **Toda la lógica de negocio y validaciones vive en el backend**: el frontend consume la API y no debería requerir lógica de reglas de negocio complejas en el cliente.