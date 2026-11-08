"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/context/UserContext";
import type { PlanPago } from "@/lib/deportistas-historiales";
import type { Deportista, Nivel } from "@/app/deportistas/types";
import ObjetivosPanel from "./ObjetivosPanel";
import EvaluacionesPanel from "./EvaluacionesPanel";
import AcudientesConsentimientosPanel from "./AcudientesConsentimientosPanel";
import ImprimirAutorizacionesButton from "./ImprimirAutorizacionesButton";
import CopiaDatosButtons from "./CopiaDatosButtons";
import AnonimizarTitularButton from "./AnonimizarTitularButton";
import PagosDeportistaPanel from "./PagosDeportistaPanel";
import FichaDeportivaPanel from "./FichaDeportivaPanel";
import HistorialDeportista from "./historial/HistorialDeportista";

interface Props {
  deportista: Deportista;
  niveles: Nivel[];
  planesPago: PlanPago[];
  onNivelCambiado: () => void;
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2">
      <span className="text-muted-foreground">{etiqueta}</span>
      <span>{valor}</span>
    </div>
  );
}

/** Contenido que se despliega bajo la fila de un deportista: una pestaña por tema. */
export default function DeportistaDetalle({ deportista, niveles, planesPago, onNivelCambiado }: Props) {
  const { permissions } = useUser();
  const verAcudientes = permissions.includes("ver_acudientes") || permissions.includes("ver_consentimientos");
  const verPagos = permissions.includes("ver_pago");
  const exportarDatos = permissions.includes("exportar_datos_titular");
  const puedeAnonimizar = permissions.includes("anonimizar_titular") && deportista.estadoNombre === "Retirado";

  return (
    <Tabs defaultValue="info" className="w-full">
      <TabsList>
        <TabsTrigger value="info">Información Personal</TabsTrigger>
        <TabsTrigger value="ficha">Ficha deportiva</TabsTrigger>
        <TabsTrigger value="historial">Historial</TabsTrigger>
        <TabsTrigger value="evaluaciones">Evaluaciones</TabsTrigger>
        <TabsTrigger value="objetivos">Objetivos</TabsTrigger>
        {verPagos && <TabsTrigger value="pagos">Pagos</TabsTrigger>}
        {verAcudientes && <TabsTrigger value="acudientes">Acudientes y consentimientos</TabsTrigger>}
      </TabsList>

      <TabsContent value="info" className="mt-4">
        {exportarDatos && (
          <div className="mb-4">
            <CopiaDatosButtons personaId={deportista.personaId} />
          </div>
        )}
        {puedeAnonimizar && (
          <div className="mb-4">
            <AnonimizarTitularButton
              personaId={deportista.personaId}
              nombre={`${deportista.nombre} ${deportista.apellidos}`.trim()}
              onHecho={onNivelCambiado}
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Datos Personales</h4>
            <div className="space-y-2">
              <Dato etiqueta="Fecha de Nacimiento:" valor={new Date(deportista.fechaNacimiento).toLocaleDateString()} />
              <Dato etiqueta="Teléfono:" valor={deportista.telefono} />
              <Dato etiqueta="Fecha de Inscripción:" valor={new Date(deportista.fechaRegistro).toLocaleDateString()} />
              <Dato etiqueta="Peso:" valor={`${deportista.peso} kg`} />
              <Dato etiqueta="Altura:" valor={`${deportista.altura} cm`} />
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Información Médica</h4>
            <div className="space-y-2">
              <Dato etiqueta="Contacto de Emergencia:" valor={deportista.contactoEmergencia} />
              <p className="text-sm text-muted-foreground">
                El detalle médico está en la pestaña <strong>Historial → Historial Médico</strong>.
              </p>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="ficha" className="mt-4">
        <FichaDeportivaPanel deportistaId={deportista.deportistaId} />
      </TabsContent>

      <TabsContent value="historial" className="mt-4">
        <HistorialDeportista
          deportistaId={deportista.deportistaId}
          niveles={niveles}
          planesPago={planesPago}
          onNivelCambiado={onNivelCambiado}
        />
      </TabsContent>

      <TabsContent value="evaluaciones" className="mt-4">
        <EvaluacionesPanel deportistaId={deportista.deportistaId} />
      </TabsContent>

      <TabsContent value="objetivos" className="mt-4">
        <ObjetivosPanel deportistaId={deportista.deportistaId} />
      </TabsContent>

      {verPagos && (
        <TabsContent value="pagos" className="mt-4">
          <PagosDeportistaPanel personaId={deportista.personaId} />
        </TabsContent>
      )}

      {verAcudientes && (
        <TabsContent value="acudientes" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <ImprimirAutorizacionesButton deportista={deportista} />
          </div>
          <AcudientesConsentimientosPanel
            deportistaId={deportista.deportistaId}
            personaId={deportista.personaId}
            fechaNacimiento={deportista.fechaNacimiento}
          />
        </TabsContent>
      )}
    </Tabs>
  );
}