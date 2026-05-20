import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { escapeHtml } from '@/lib/sanitize'
import { checkRateLimit, rateLimitResponse, getClientIp } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    // Rate limiting: máximo 3 envíos por IP cada 10 minutos
    const ip = getClientIp(request)
    const rl = checkRateLimit(`contact:${ip}`, { windowMs: 10 * 60 * 1000, maxRequests: 3 })
    if (!rl.allowed) {
      return rateLimitResponse(rl.retryAfterMs)
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY no está configurada')
      return NextResponse.json(
        { error: 'Error de configuración del servidor.' },
        { status: 500 }
      )
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    const body = await request.json()
    const {
      nombre,
      empresa,
      email,
      telefono,
      producto,
      marca,
      volumen,
      envasado,
      mensaje,
      inversionEstimada,
    } = body

    if (!nombre || !email || !telefono || !empresa || !producto || !marca || !volumen || !envasado) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    // Validaciones básicas de formato
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    if (nombre.length > 200 || empresa.length > 200 || (mensaje && mensaje.length > 5000)) {
      return NextResponse.json({ error: 'Campos exceden el largo máximo' }, { status: 400 })
    }

    // Sanitizar todos los valores para prevenir XSS en el HTML del email
    const safe = {
      nombre: escapeHtml(nombre),
      empresa: escapeHtml(empresa),
      email: escapeHtml(email),
      telefono: escapeHtml(telefono),
      mensaje: mensaje ? escapeHtml(mensaje) : '',
      inversionEstimada: inversionEstimada ? escapeHtml(inversionEstimada) : '',
    }

    const emailTo = process.env.EMAIL_TO || process.env.EMAIL_FROM || 'contacto@fasonpro.com.ar'
    const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev'

    const tipoProducto = producto === 'alfajores' ? 'Alfajores' : 'Galletitas'
    const tipoEnvasado =
      envasado === 'a-granel'
        ? 'A granel'
        : envasado === 'flowpack-personalizado'
        ? 'Flow pack personalizado'
        : 'Flowpack cristal'

    const volumenTexto =
      volumen === 'menos-1000'
        ? 'Menos de 1.000 unidades'
        : volumen === '1000-5000'
        ? '1.000 - 5.000 unidades'
        : 'Más de 5.000 unidades'

    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to: emailTo,
      subject: `Nueva consulta de cotización - ${safe.empresa}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
              .field { margin-bottom: 20px; }
              .label { font-weight: bold; color: #111827; margin-bottom: 5px; display: block; }
              .value { color: #374151; }
              .inversion { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Nueva Consulta de Cotización</h1>
              </div>
              <div class="content">
                <h2 style="color: #dc2626; margin-top: 0;">Datos del Cliente</h2>
                
                <div class="field">
                  <span class="label">Nombre y apellido:</span>
                  <span class="value">${safe.nombre}</span>
                </div>
                
                <div class="field">
                  <span class="label">Empresa o marca:</span>
                  <span class="value">${safe.empresa}</span>
                </div>
                
                <div class="field">
                  <span class="label">Email:</span>
                  <span class="value"><a href="mailto:${safe.email}">${safe.email}</a></span>
                </div>
                
                <div class="field">
                  <span class="label">Teléfono:</span>
                  <span class="value"><a href="tel:${safe.telefono}">${safe.telefono}</a></span>
                </div>
                
                <h2 style="color: #dc2626; margin-top: 30px;">Detalles del Proyecto</h2>
                
                <div class="field">
                  <span class="label">Tipo de producto:</span>
                  <span class="value">${tipoProducto}</span>
                </div>
                
                <div class="field">
                  <span class="label">¿Tiene marca registrada o proyecto en marcha?</span>
                  <span class="value">${marca === 'si' ? 'Sí' : 'No'}</span>
                </div>
                
                <div class="field">
                  <span class="label">Volumen estimado mensual:</span>
                  <span class="value">${volumenTexto}</span>
                </div>
                
                <div class="field">
                  <span class="label">Tipo de envasado:</span>
                  <span class="value">${tipoEnvasado}</span>
                </div>
                
                ${safe.mensaje ? `
                <div class="field">
                  <span class="label">Mensaje:</span>
                  <div class="value" style="white-space: pre-wrap;">${safe.mensaje}</div>
                </div>
                ` : ''}
                
                ${safe.inversionEstimada ? `
                <div class="inversion">
                  <div class="label">Inversión estimada:</div>
                  <div style="font-size: 24px; font-weight: bold; color: #dc2626; margin-top: 5px;">
                    ${safe.inversionEstimada}
                  </div>
                </div>
                ` : ''}
              </div>
              <div class="footer">
                <p>Este email fue enviado desde el formulario de contacto de FasonPro</p>
                <p>${new Date().toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' })}</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('Error al enviar email con Resend:', error)
      return NextResponse.json(
        { error: 'Error al enviar el email' },
        { status: 500 }
      )
    }

    // Crear lead automáticamente en el CRM (datos originales sin escapar para la DB)
    try {
      const { createLead } = await import('@/lib/db/queries')
      const { createActivity } = await import('@/lib/db/activity-queries')
      const newLead = await createLead({
        nombre,
        empresa,
        email,
        telefono,
        producto,
        marca,
        volumen,
        envasado,
        mensaje,
        inversionEstimada,
        stage: 'entrante',
        notes: [],
        source: 'web',
      })
      await createActivity(newLead.id, {
        type: 'created',
        content: 'Lead creado automáticamente desde formulario web',
      })
      console.log('Lead creado automáticamente en el CRM:', newLead.id)
    } catch (leadError) {
      console.error('Error al crear lead en el CRM:', leadError)
    }

    return NextResponse.json(
      { success: true, messageId: data?.id },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error en API contact:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
