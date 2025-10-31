import Link from "next/link"
import { Logo } from "@/components/pro-blocks/logo"

export default function PoliticaPrivacidadPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container-padding-x mx-auto flex h-20 md:h-24 max-w-7xl items-center justify-between">
          <Link href="/">
            <Logo className="h-12 w-auto md:h-16 lg:h-20" />
          </Link>
        </div>
      </div>

      <div className="section-padding-y container-padding-x mx-auto max-w-4xl py-16">
        <h1 className="heading-xl mb-8 text-balance">Política de Privacidad de Datos</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-foreground">
          <section>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-AR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Compañía de Alfajores se compromete a proteger la privacidad de sus usuarios y clientes. 
              Esta Política de Privacidad describe cómo recopilamos, usamos, almacenamos y protegemos 
              la información personal de acuerdo con la Ley 25.326 de Protección de Datos Personales 
              de la República Argentina.
            </p>
          </section>

          <section>
            <h2 className="heading-md mb-4">1. Responsable del Tratamiento de Datos</h2>
            <p className="text-muted-foreground leading-relaxed">
              El responsable del tratamiento de los datos personales es Compañía de Alfajores, 
              con domicilio en Buenos Aires, Argentina. Para cualquier consulta relacionada con 
              el tratamiento de sus datos personales, puede contactarnos a través de nuestro 
              formulario de contacto o al email: contacto@fasonpro.com.ar
            </p>
          </section>

          <section>
            <h2 className="heading-md mb-4">2. Información que Recopilamos</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Recopilamos la siguiente información cuando utiliza nuestro formulario de contacto:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Nombre y apellido</li>
              <li>Nombre de empresa o marca</li>
              <li>Dirección de correo electrónico corporativo</li>
              <li>Número de teléfono</li>
              <li>Tipo de producto de interés</li>
              <li>Volumen estimado de producción</li>
              <li>Tipo de envasado requerido</li>
              <li>Información sobre marca registrada o proyecto en marcha</li>
              <li>Mensajes o comentarios adicionales que nos proporcione</li>
            </ul>
          </section>

          <section>
            <h2 className="heading-md mb-4">3. Finalidad del Tratamiento</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Los datos personales recopilados son utilizados exclusivamente para las siguientes finalidades:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Responder a sus consultas y solicitudes de cotización</li>
              <li>Proporcionar información sobre nuestros servicios de fabricación a fason</li>
              <li>Establecer comunicación comercial y seguimiento de su consulta</li>
              <li>Mejorar nuestros servicios y atención al cliente</li>
              <li>Cumplir con obligaciones legales y normativas aplicables</li>
            </ul>
          </section>

          <section>
            <h2 className="heading-md mb-4">4. Base Legal</h2>
            <p className="text-muted-foreground leading-relaxed">
              El tratamiento de sus datos personales se basa en su consentimiento expreso, otorgado 
              al completar y enviar nuestro formulario de contacto. Usted tiene derecho a retirar 
              su consentimiento en cualquier momento, sin que ello afecte la licitud del tratamiento 
              previo a la retirada.
            </p>
          </section>

          <section>
            <h2 className="heading-md mb-4">5. Conservación de Datos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Conservaremos sus datos personales durante el tiempo necesario para cumplir con las 
              finalidades para las cuales fueron recopilados, y en cumplimiento de las obligaciones 
              legales aplicables. Una vez cumplidos estos plazos, procederemos a la eliminación 
              segura de sus datos.
            </p>
          </section>

          <section>
            <h2 className="heading-md mb-4">6. Seguridad de los Datos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Implementamos medidas técnicas y organizativas apropiadas para proteger sus datos 
              personales contra el acceso no autorizado, la pérdida, destrucción o alteración. 
              Sin embargo, ningún método de transmisión por Internet o almacenamiento electrónico 
              es completamente seguro, por lo que no podemos garantizar una seguridad absoluta.
            </p>
          </section>

          <section>
            <h2 className="heading-md mb-4">7. Compartir Información</h2>
            <p className="text-muted-foreground leading-relaxed">
              No vendemos, alquilamos ni compartimos sus datos personales con terceros, excepto:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Cuando sea necesario para cumplir con una obligación legal</li>
              <li>Con proveedores de servicios que nos ayudan a operar nuestro negocio (como 
                  servicios de hosting o email), siempre que estos terceros se comprometan a 
                  mantener la confidencialidad de sus datos</li>
              <li>Con su consentimiento explícito previo</li>
            </ul>
          </section>

          <section>
            <h2 className="heading-md mb-4">8. Sus Derechos (Ley 25.326)</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              De acuerdo con la Ley 25.326 de Protección de Datos Personales, usted tiene derecho a:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Acceso:</strong> Solicitar información sobre sus datos personales que tenemos en nuestro poder</li>
              <li><strong>Rectificación:</strong> Solicitar la corrección de datos inexactos o incompletos</li>
              <li><strong>Supresión:</strong> Solicitar la eliminación de sus datos personales cuando ya no sean necesarios</li>
              <li><strong>Oposición:</strong> Oponerse al tratamiento de sus datos personales en determinadas circunstancias</li>
              <li><strong>Portabilidad:</strong> Recibir sus datos personales en un formato estructurado y de uso común</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Para ejercer cualquiera de estos derechos, puede contactarnos a través de nuestro 
              formulario de contacto o al email: contacto@fasonpro.com.ar
            </p>
          </section>

          <section>
            <h2 className="heading-md mb-4">9. Registro Nacional de Bases de Datos</h2>
            <p className="text-muted-foreground leading-relaxed">
              En cumplimiento de la Ley 25.326, nuestras bases de datos están inscriptas en el 
              Registro Nacional de Bases de Datos de la Dirección Nacional de Protección de Datos 
              Personales del Ministerio de Justicia y Derechos Humanos de la Nación.
            </p>
          </section>

          <section>
            <h2 className="heading-md mb-4">10. Cambios en esta Política</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nos reservamos el derecho de modificar esta Política de Privacidad en cualquier momento. 
              Cualquier cambio será publicado en esta página con la fecha de última actualización. 
              Le recomendamos revisar periódicamente esta política para estar informado sobre cómo 
              protegemos su información.
            </p>
          </section>

          <section>
            <h2 className="heading-md mb-4">11. Contacto</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Si tiene preguntas, consultas o reclamos sobre el tratamiento de sus datos personales, 
              puede contactarnos a través de:
            </p>
            <ul className="list-none space-y-2 text-muted-foreground">
              <li><strong>Email:</strong> contacto@fasonpro.com.ar</li>
              <li><strong>Formulario de contacto:</strong> Disponible en nuestro sitio web</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              También tiene derecho a presentar una denuncia ante la Dirección Nacional de Protección 
              de Datos Personales si considera que el tratamiento de sus datos personales no se ajusta 
              a la normativa vigente.
            </p>
          </section>
        </div>

        <div className="mt-12 flex justify-center">
          <Link href="/">
            <button className="rounded-md border bg-primary px-6 py-3 text-primary-foreground shadow-sm transition-colors hover:opacity-90">
              Volver al inicio
            </button>
          </Link>
        </div>
      </div>
    </main>
  )
}

