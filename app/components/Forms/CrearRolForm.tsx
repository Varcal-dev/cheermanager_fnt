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
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
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
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/roles`,
        values
      );
      if (response.status === 200) {
        toast({
          title: "Rol creado exitosamente.",
        });
        form.reset();
        onRolCreated(); // Refresh the roles list
        onClose(); // Close the dialog
      } else {
        toast({
          title: "Error al crear el rol.",
          description: "Por favor, inténtelo de nuevo.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error al crear el rol.",
        description:
          "Hubo un error al comunicarse con el servidor. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
      console.error("Error creating rol:", error);
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
        <Button type="submit">Crear Rol</Button>
      </form>
    </Form>
  );
}
