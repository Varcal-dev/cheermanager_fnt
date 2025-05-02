import Link from "next/link"
import {
  Home,
  Users,
  UserPlus,
  Layers,
  Clock,
  BarChart,
  ShoppingBag,
  ShoppingCart,
  FileText,
  Award,
  Calendar,
  CreditCard,
  Percent,
  Receipt,
  UserCog,
  Shield,
  Activity,
  ClipboardList,
} from "lucide-react"

const Sidebar = () => {
  return (
    <aside className="w-64 bg-white shadow-md">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-purple-600">Gestor Cheer Gym</h1>
      </div>
      <nav className="mt-6">
        <Link href="/" className="block px-4 py-2 text-gray-600 hover:bg-purple-100 hover:text-purple-600">
          <Home className="inline-block mr-2" size={18} />
          Inicio
        </Link>
        <div className="px-4 py-2 text-gray-500 uppercase text-sm">Personas</div>
        <Link href="/entrenadores" className="block px-4 py-2 text-gray-600 hover:bg-purple-100 hover:text-purple-600">
          <Users className="inline-block mr-2" size={18} />
          Entrenadores
        </Link>
        <Link href="/deportistas" className="block px-4 py-2 text-gray-600 hover:bg-purple-100 hover:text-purple-600">
          <UserPlus className="inline-block mr-2" size={18} />
          Deportistas
        </Link>
        <Link
          href="/historial-medico"
          className="block px-4 py-2 text-gray-600 hover:bg-purple-100 hover:text-purple-600"
        >
          <FileText className="inline-block mr-2" size={18} />
          Historial Médico
        </Link>
        <div className="px-4 py-2 text-gray-500 uppercase text-sm">Organización</div>
        <Link href="/grupos" className="block px-4 py-2 text-gray-600 hover:bg-purple-100 hover:text-purple-600">
          <Layers className="inline-block mr-2" size={18} />
          Gestión de Grupos
        </Link>
        <Link href="/niveles" className="block px-4 py-2 text-gray-600 hover:bg-purple-100 hover:text-purple-600">
          <BarChart className="inline-block mr-2" size={18} />
          Niveles
        </Link>
        <Link href="/inscripciones" className="block px-4 py-2 text-gray-600 hover:bg-purple-100 hover:text-purple-600">
          <ClipboardList className="inline-block mr-2" size={18} />
          Inscripciones
        </Link>
        <Link href="/horarios" className="block px-4 py-2 text-gray-600 hover:bg-purple-100 hover:text-purple-600">
          <Clock className="inline-block mr-2" size={18} />
          Horarios
        </Link>
        <Link href="/evaluacion" className="block px-4 py-2 text-gray-600 hover:bg-purple-100 hover:text-purple-600">
          <Award className="inline-block mr-2" size={18} />
          Evaluación
        </Link>
        <Link href="/eventos" className="block px-4 py-2 text-gray-600 hover:bg-purple-100 hover:text-purple-600">
          <Calendar className="inline-block mr-2" size={18} />
          Eventos
        </Link>
        <div className="px-4 py-2 text-gray-500 uppercase text-sm">Finanzas</div>
        <Link href="/planes-pago" className="block px-4 py-2 text-gray-600 hover:bg-purple-100 hover:text-purple-600">
          <CreditCard className="inline-block mr-2" size={18} />
          Planes de Pago
        </Link>
        <Link href="/descuentos" className="block px-4 py-2 text-gray-600 hover:bg-purple-100 hover:text-purple-600">
          <Percent className="inline-block mr-2" size={18} />
          Descuentos
        </Link>
        <Link href="/facturas" className="block px-4 py-2 text-gray-600 hover:bg-purple-100 hover:text-purple-600">
          <Receipt className="inline-block mr-2" size={18} />
          Facturas
        </Link>
        <Link href="/pagos" className="block px-4 py-2 text-gray-600 hover:bg-purple-100 hover:text-purple-600">
          <CreditCard className="inline-block mr-2" size={18} />
          Pagos
        </Link>
        <div className="px-4 py-2 text-gray-500 uppercase text-sm">Tienda</div>
        <Link href="/inventario" className="block px-4 py-2 text-gray-600 hover:bg-purple-100 hover:text-purple-600">
          <ShoppingBag className="inline-block mr-2" size={18} />
          Inventario
        </Link>
        <Link href="/ventas" className="block px-4 py-2 text-gray-600 hover:bg-purple-100 hover:text-purple-600">
          <ShoppingCart className="inline-block mr-2" size={18} />
          Ventas
        </Link>
        <div className="px-4 py-2 text-gray-500 uppercase text-sm">Admin</div>
        <Link href="/usuarios" className="block px-4 py-2 text-gray-600 hover:bg-purple-100 hover:text-purple-600">
          <UserCog className="inline-block mr-2" size={18} />
          Usuarios
        </Link>
        <Link href="/roles" className="block px-4 py-2 text-gray-600 hover:bg-purple-100 hover:text-purple-600">
          <Shield className="inline-block mr-2" size={18} />
          Roles y Permisos
        </Link>
        <Link href="/auditoria" className="block px-4 py-2 text-gray-600 hover:bg-purple-100 hover:text-purple-600">
          <Activity className="inline-block mr-2" size={18} />
          Auditoría
        </Link>
      </nav>
    </aside>
  )
}

export default Sidebar
