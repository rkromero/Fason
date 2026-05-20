import { z } from "zod"

export const leadSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    empresa: z.string().min(1, "La empresa es requerida"),
    email: z.string().email("Email inválido"),
    telefono: z.string().min(1, "El teléfono es requerido"),
    producto: z.enum(["alfajores", "galletitas"]),
    marca: z.enum(["si", "no"]),
    volumen: z.enum(["menos-1000", "1000-5000", "mas-5000"]),
    envasado: z.enum(["flowpack-personalizado", "flowpack-cristal", "a-granel"]),
    mensaje: z.string().optional(),
    inversionEstimada: z.string().optional(),
    source: z.enum(["web", "referido", "redes", "llamada", "email", "otro", "crm"]).default("crm"),
    stage: z.enum(["entrante", "primer-llamado", "seguimiento", "negociacion", "ganado", "perdido"]).default("entrante"),
})

export type CreateLeadInput = z.infer<typeof leadSchema>
export type UpdateLeadInput = Partial<CreateLeadInput>
