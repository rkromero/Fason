"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Lead } from "@/lib/types/lead"
import { KanbanFilters } from "@/components/kanban-top-bar"
import { toast } from "sonner"
import confetti from "canvas-confetti"

// Type for the API response
interface LeadsResponse {
    leads: Lead[]
    total: number
}

// Helper to build query string
function buildLeadsQuery(filters: KanbanFilters): string {
    const params = new URLSearchParams()
    if (filters.search.trim()) params.set("search", filters.search.trim())
    if (filters.producto !== "all") params.set("producto", filters.producto)
    if (filters.owner !== "all") params.set("owner", filters.owner)
    if (filters.quickFilters.includes("hoy")) params.set("createdToday", "true")

    switch (filters.sortOrder) {
        case "ultima-actividad":
            params.set("sortBy", "updated")
            params.set("sortDir", "desc")
            break
        case "mayor-monto":
            params.set("sortBy", "monto")
            params.set("sortDir", "desc")
            break
    }

    // High limit for Kanban for now, until we implement infinite scroll properly
    params.set("limit", "500")
    const qs = params.toString()
    return qs ? `/api/leads?${qs}` : "/api/leads"
}

// ─── Clientside Enrichment for derived fields ─────────────
function enrichLead(lead: Lead): Lead {
    const tasks = lead.tasks || []
    const nextPending = tasks
        .filter((t) => t.status !== "done")
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]

    return {
        ...lead,
        nextTaskDate: lead.nextTaskDate ?? nextPending?.dueDate,
        nextTaskDescription: lead.nextTaskDescription ?? nextPending?.description,
    }
}

// ─── Clientside Filtering for non-DB fields ───────────────
function applyClientFilters(leads: Lead[], filters: KanbanFilters): Lead[] {
    let result = leads
    for (const qf of filters.quickFilters) {
        switch (qf) {
            case "vencidos":
                result = result.filter((l) => l.nextTaskDate && new Date(l.nextTaskDate) < new Date())
                break
            case "sin-tarea":
                result = result.filter((l) => !l.nextTaskDate)
                break
            case "alta-prioridad":
                result = result.filter((l) => l.priority === "A")
                break
        }
    }
    if (filters.source !== "all") result = result.filter((l) => l.source === filters.source)
    return result
}

export function useLeads(filters: KanbanFilters) {
    const queryClient = useQueryClient()
    const queryKey = ["leads", filters.search, filters.producto, filters.owner, filters.sortOrder, filters.quickFilters.includes("hoy")]

    // 1. Fetch Leads
    const { data, isLoading, error, refetch } = useQuery<LeadsResponse>({
        queryKey,
        queryFn: async () => {
            const res = await fetch(buildLeadsQuery(filters))
            if (!res.ok) throw new Error("Error al cargar leads")
            return res.json()
        },
        staleTime: 30000, // 30s stale time
    })

    // processed leads
    const rawLeads = data?.leads || []
    const enrichedLeads = rawLeads.map(enrichLead)
    const filteredLeads = applyClientFilters(enrichedLeads, filters)
    const totalLeads = data?.total || 0

    // 2. Mutations
    const updateLeadMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Lead> }) => {
            const res = await fetch(`/api/leads/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            })
            if (!res.ok) throw new Error("Error al actualizar lead")
            return res.json()
        },
        onMutate: async ({ id, updates }) => {
            await queryClient.cancelQueries({ queryKey })
            const previousData = queryClient.getQueryData<LeadsResponse>(queryKey)

            // Optimistic update
            if (previousData) {
                queryClient.setQueryData<LeadsResponse>(queryKey, {
                    ...previousData,
                    leads: previousData.leads.map((l) => (l.id === id ? { ...l, ...updates } : l)),
                })
            }
            return { previousData }
        },
        onError: (err, newTodo, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(queryKey, context.previousData)
            }
            toast.error("Error al actualizar lead")
        },
        onSuccess: (data, variables) => {
            // Confetti check
            if (variables.updates.stage === "ganado") {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ["#10B981", "#3B82F6", "#F59E0B"],
                })
                toast.success("¡Lead Ganado! 🎉")
            } else {
                // toast.success("Lead actualizado") // Opcional, puede ser ruidoso
            }
            queryClient.invalidateQueries({ queryKey: ["leads"] })
        },
    })

    const createLeadMutation = useMutation({
        mutationFn: async (newLeadFn: any) => {
            // logic defined in dialog usually, but we can centralize if passed full object
            // But for now, we just expose a refresh or handle it via invalidation
            return null
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] })
        }
    })

    const deleteLeadMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/leads/${id}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Error al eliminar")
            return res.json()
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey })
            const previousData = queryClient.getQueryData<LeadsResponse>(queryKey)
            if (previousData) {
                queryClient.setQueryData<LeadsResponse>(queryKey, {
                    ...previousData,
                    leads: previousData.leads.filter((l) => l.id !== id),
                })
            }
            return { previousData }
        },
        onError: (err, id, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(queryKey, context.previousData)
            }
            toast.error("Error al eliminar lead")
        },
        onSuccess: () => {
            toast.success("Lead eliminado")
            queryClient.invalidateQueries({ queryKey: ["leads"] })
        }
    })

    return {
        leads: filteredLeads,
        rawLeads, // for other uses if needed
        totalLeads,
        isLoading,
        error,
        refetch,
        updateLead: updateLeadMutation.mutateAsync,
        deleteLead: deleteLeadMutation.mutateAsync,
        invalidateLeads: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
    }
}
