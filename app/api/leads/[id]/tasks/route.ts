import { NextResponse } from 'next/server'
import { getTasksByLeadId, createTask, completeTask, deleteTask } from '@/lib/db/task-queries'
import { createActivity } from '@/lib/db/activity-queries'

// GET - Obtener tareas de un lead
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const tasks = await getTasksByLeadId(params.id)
    return NextResponse.json({ tasks }, { status: 200 })
  } catch (error) {
    console.error('Error al obtener tareas:', error)
    return NextResponse.json({ error: 'Error al obtener tareas' }, { status: 500 })
  }
}

// POST - Crear tarea o completar/eliminar
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rol = request.headers.get('x-user-rol')
    if (rol === 'viewer') {
      return NextResponse.json({ error: 'No tenés permisos' }, { status: 403 })
    }

    const body = await request.json()
    const userId = request.headers.get('x-user-id') || undefined

    // Completar tarea
    if (body.action === 'complete' && body.taskId) {
      const task = await completeTask(body.taskId)
      if (!task) {
        return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })
      }
      await createActivity(params.id, {
        type: 'task-done',
        content: `Tarea completada: ${task.description}`,
        createdBy: userId,
      })
      const tasks = await getTasksByLeadId(params.id)
      return NextResponse.json({ tasks, completedTask: task }, { status: 200 })
    }

    // Eliminar tarea
    if (body.action === 'delete' && body.taskId) {
      await deleteTask(body.taskId)
      const tasks = await getTasksByLeadId(params.id)
      return NextResponse.json({ tasks }, { status: 200 })
    }

    // Crear tarea
    if (!body.description || !body.dueDate) {
      return NextResponse.json({ error: 'Descripción y fecha son requeridas' }, { status: 400 })
    }

    const task = await createTask(params.id, {
      type: body.type || 'otro',
      description: body.description,
      dueDate: body.dueDate,
      dueTime: body.dueTime,
      notes: body.notes,
    })

    await createActivity(params.id, {
      type: 'note',
      content: `Nueva tarea creada: ${task.description}`,
      metadata: { taskType: task.type },
      createdBy: userId,
    })

    const tasks = await getTasksByLeadId(params.id)
    return NextResponse.json({ tasks, newTask: task }, { status: 201 })
  } catch (error) {
    console.error('Error en tareas:', error)
    return NextResponse.json({ error: 'Error al procesar tarea' }, { status: 500 })
  }
}
