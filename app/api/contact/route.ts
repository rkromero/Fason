import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
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

    // Validar campos requeridos
    if (!nombre || !email || !telefono || !empresa || !producto || !marca || !volumen || !envasado) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Obtener email de destino desde variables de entorno (o usar uno por defecto)
    const emailTo = process.env.EMAIL_TO || process.env.EMAIL_FROM || 'contacto@fasonpro.com.ar'
    const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev'

    // Formatear los datos para el email
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

    // Enviar email
    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to: emailTo,
      subject: `Nueva consulta de cotización - ${empresa}`,
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
                  <span class="value">${nombre}</span>
                </div>
                
                <div class="field">
                  <span class="label">Empresa o marca:</span>
                  <span class="value">${empresa}</span>
                </div>
                
                <div class="field">
                  <span class="label">Email:</span>
                  <span class="value"><a href="mailto:${email}">${email}</a></span>
                </div>
                
                <div class="field">
                  <span class="label">Teléfono:</span>
                  <span class="value"><a href="tel:${telefono}">${telefono}</a></span>
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
                
                ${mensaje ? `
                <div class="field">
                  <span class="label">Mensaje:</span>
                  <div class="value" style="white-space: pre-wrap;">${mensaje}</div>
                </div>
                ` : ''}
                
                ${inversionEstimada ? `
                <div class="inversion">
                  <div class="label">Inversión estimada:</div>
                  <div style="font-size: 24px; font-weight: bold; color: #dc2626; margin-top: 5px;">
                    ${inversionEstimada}
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
      console.error('Error al enviar email:', error)
      return NextResponse.json(
        { error: 'Error al enviar el email' },
        { status: 500 }
      )
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

