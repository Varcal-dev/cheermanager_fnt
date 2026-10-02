"use client";

import { useState } from "react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  nombre: z.string().min(2, {
    message: "El nombre del rol debe tener al menos 2 caracteres.",
  }),
  descripcion: z.string().optional(),
});

interface CrearRolFormProps {
  onRolCreated: () => void;
  onClose: () => void;
}

export function CrearRolForm({ onRolCreated, onClose }: CrearRolFormProps) {
  const [enviando, setEnviando] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setEnviando(true);
    try {
      const response = await api.post("/api/roles", values);
      if (response.status === 200) {
        toast.success("Rol creado exitosamente.");
        form.reset();
        onRolCreated();
        onClose();
      }
    } catch (error) {
      console.error("Error creating rol:", error);
      toast.error(
        "Hubo un error al comunicarse con el servidor. Por favor, inténtelo de nuevo.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Rol</FormLabel>
              <FormControl>
                <Input placeholder="Nombre" {...field} />
              </FormControl>
              <FormDescription>
                Este es el nombre que se mostrará para el rol.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Input placeholder="Descripción del rol" {...field} />
              </FormControl>
              <FormDescription>
                Breve descripción de las funciones o propósito del rol.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={enviando}>
          {enviando ? "Creando..." : "Crear Rol"}
        </Button>
      </form>
    </Form>
  );
}