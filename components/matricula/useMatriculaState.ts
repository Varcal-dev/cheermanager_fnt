"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "react-toastify";
import {
    DeportistaDisponible,
    EstadoMatricula,
    ESTADO_INICIAL,
    PasoMatricula,
} from "@/app/lib/matricula";

export function useMatriculaState(estadoInicial: EstadoMatricula = ESTADO_INICIAL) {
    const [estado, setEstado] = useState<EstadoMatricula>(estadoInicial);
    const [guardando, setGuardando] = useState(false);

    const irA = (paso: PasoMatricula) =>
        setEstado((prev) => ({ ...prev, paso }));

    const elegirDeportista = (deportista: DeportistaDisponible) => {
        setEstado((prev) => ({ ...prev, deportista, paso: "plan" }));
    };

    // Paso 2 → crea (o actualiza) la inscripción real. A partir de este punto,
    // cerrar el modal ya NO pierde el avance: la inscripción queda guardada
    // en el backend, solo falta el grupo.
    //
    // Si ya existe inscripcionId (el usuario le dio "Volver" desde el paso
    // Grupo y está reenviando este paso), actualizamos con PUT en vez de
    // crear una inscripción duplicada con POST.
    const confirmarPlan = async (payload: {
        planPagoId: number;
        planMensualidadId?: number;
        convenioId?: number;
        fechaVencimiento: string;
    }) => {
        if (!estado.deportista) return;
        setGuardando(true);
        const hoy = new Date().toISOString().slice(0, 10);
        try {
            let inscripcionId = estado.inscripcionId;
            let facturaId = estado.facturaId;

            if (inscripcionId) {
                await api.put(`/api/inscripciones/${inscripcionId}`, {
                    planPago: { id: payload.planPagoId },
                    planMensualidad: payload.planMensualidadId
                        ? { id: payload.planMensualidadId }
                        : null,
                    fechaInscripcion: hoy,
                    fechaVencimiento: payload.fechaVencimiento,
                    estado: "Activa",
                });
            } else {
                const res = await api.post("/api/inscripciones", {
                    deportistaId: estado.deportista.deportista_id,
                    planPagoId: payload.planPagoId,
                    planMensualidadId: payload.planMensualidadId ?? null,
                    fechaInscripcion: hoy,
                    fechaVencimiento: payload.fechaVencimiento,
                    estado: "Activa",
                });
                inscripcionId = res.data.id ?? res.data.inscripcionId;
                facturaId = res.data.facturaId ?? null;
            }

            if (payload.convenioId) {
                try {
                    await api.put(`/api/deportistas/${estado.deportista.deportista_id}/convenio`, {
                        convenioId: payload.convenioId,
                    });
                } catch {
                    toast.error("La inscripción se creó, pero falló la asignación del convenio");
                }
            }

            setEstado((prev) => ({
                ...prev,
                inscripcionId,
                facturaId,
                paso: "grupo",
            }));
            toast.success("Inscripción creada. Ahora asigna un grupo.");
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || error.response?.data || "No se pudo crear la inscripción",
            );
            throw error;
        } finally {
            setGuardando(false);
        }
    };

    // Paso 3 → agrega al grupo. Si el usuario cierra el modal justo antes de
    // este paso, la fila de inscripciones ya lo muestra como "sin grupo" y
    // puede retomar aquí mismo desde ahí.
    const confirmarGrupo = async (grupoId: number, grupoNombre: string) => {
        if (!estado.deportista) return;
        setGuardando(true);
        try {
            await api.post(`/api/grupos/${grupoId}/agregar-deportistas`, {
                deportistaId: estado.deportista.deportista_id,
                observaciones: "",
            });
            setEstado((prev) => ({ ...prev, grupoId, grupoNombre, paso: "confirmacion" }));
            toast.success("Deportista asignado al grupo correctamente");
        } catch (error: any) {
            toast.error(
                error.response?.data ?? "No se pudo asignar el grupo",
            );
            throw error;
        } finally {
            setGuardando(false);
        }
    };

    const reiniciar = () => setEstado(ESTADO_INICIAL);

    return { estado, guardando, irA, elegirDeportista, confirmarPlan, confirmarGrupo, reiniciar };
}