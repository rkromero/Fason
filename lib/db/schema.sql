-- Esquema de la base de datos para el CRM
-- Ejecutar este script en PostgreSQL para crear la tabla de leads

CREATE TABLE IF NOT EXISTS leads (
  id VARCHAR(255) PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  empresa VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefono VARCHAR(50) NOT NULL,
  producto VARCHAR(50) NOT NULL CHECK (producto IN ('alfajores', 'galletitas')),
  marca VARCHAR(10) NOT NULL CHECK (marca IN ('si', 'no')),
  volumen VARCHAR(50) NOT NULL CHECK (volumen IN ('menos-1000', '1000-5000', 'mas-5000')),
  envasado VARCHAR(50) NOT NULL CHECK (envasado IN ('flowpack-personalizado', 'flowpack-cristal', 'a-granel')),
  mensaje TEXT,
  inversion_estimada VARCHAR(100),
  stage VARCHAR(50) NOT NULL DEFAULT 'entrante' CHECK (stage IN ('entrante', 'primer-llamado', 'seguimiento', 'negociacion', 'ganado', 'perdido')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  notes JSONB DEFAULT '[]'::jsonb,
  last_contact TIMESTAMP WITH TIME ZONE
);

-- Índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_empresa ON leads(empresa);

-- Comentarios para documentación
COMMENT ON TABLE leads IS 'Tabla principal para almacenar los leads del CRM';
COMMENT ON COLUMN leads.notes IS 'Array de notas en formato JSON';
COMMENT ON COLUMN leads.stage IS 'Etapa actual del lead en el proceso de ventas';

