export default function GraciasPage() {
  return (
    <main className="section-padding-y container-padding-x min-h-[70vh] bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 7L9 18L4 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="heading-lg mb-4 text-balance">¡Gracias por tu solicitud!</h1>
        <p className="mb-8 text-lg text-muted-foreground leading-relaxed">
          Recibimos tus datos correctamente. Nuestro equipo se pondrá en contacto para <strong>calcular la inversión y
          enviarte la cotización</strong> a la brevedad.
        </p>
        <div className="mx-auto grid max-w-xl gap-4 text-left">
          <div className="rounded-xl border bg-card p-4">
            <h2 className="mb-1 font-semibold">¿Qué sigue?</h2>
            <p className="text-sm text-muted-foreground">Te contactaremos por email o WhatsApp para confirmar
            especificaciones de producto, volúmenes y envasado.</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <h2 className="mb-1 font-semibold">Tiempo de respuesta</h2>
            <p className="text-sm text-muted-foreground">Normalmente respondemos dentro de las próximas 24–48 horas hábiles.</p>
          </div>
        </div>
        <a href="/" className="mt-10 inline-flex items-center justify-center rounded-md border bg-primary px-6 py-3 text-primary-foreground shadow-sm transition-colors hover:opacity-90">
          Volver al inicio
        </a>
      </div>
    </main>
  );
}


