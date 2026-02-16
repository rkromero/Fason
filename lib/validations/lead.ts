import { z } from "zod"

export const leadSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    empresa: z.string().min(1, "La empresa es requerida"),
    email: z.string().email("Email inválido"),
    telefono: z.string().min(1, "El teléfono es requerido"),
    producto: z.string().min(1, "El producto es requerido"),
    marca: z.string().min(1, "La marca es requerida"),
    volumen: z.string().min(1, "El volumen estimado es requerido"),
    envasado: z.string().min(1, "El tipo de envasado es requerido"),
    mensaje: z.string().optional(),
    inversionEstimada: z.string().optional(),
    source: z.string().default("crm"),
    stage: z.enum(["entrante", "contactado", "reunion", "propuesta", "negociacion", "ganado", "perdido"]).default("entrante"),
})

export type CreateLeadInput = z.infer<typeof leadSchema>
export type UpdateLeadInput = Partial<CreateLeadInput>
