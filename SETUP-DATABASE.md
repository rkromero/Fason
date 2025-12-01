# 🚀 Guía Rápida: Configurar PostgreSQL en Railway

## ✅ Ya creaste el servicio de base de datos - Ahora sigue estos pasos:

### Paso 1: Obtener la DATABASE_URL

1. En Railway, haz clic en tu servicio **PostgreSQL**
2. Ve a la pestaña **"Variables"** (o "Settings" → "Variables")
3. Busca la variable `DATABASE_URL` 
4. **Copia el valor completo** (tiene este formato: `postgresql://user:password@host:port/database`)

### Paso 2: Configurar DATABASE_URL en tu aplicación

1. En Railway, haz clic en tu servicio **Next.js** (tu aplicación)
2. Ve a la pestaña **"Variables"**
3. Haz clic en **"New Variable"** o **"Raw Editor"**
4. Agrega:
   - **Name**: `DATABASE_URL`
   - **Value**: (pega la URL que copiaste del paso 1)
5. Haz clic en **"Add"** o guarda los cambios

### Paso 3: Inicializar la base de datos

Tienes **2 opciones**:

#### ✅ Opción A: Automática (Recomendada)

La aplicación inicializará la base de datos automáticamente la primera vez que se use. Solo necesitas:

1. Hacer push de los cambios al repositorio
2. Railway desplegará automáticamente
3. La primera vez que accedas al CRM, se creará la tabla automáticamente

#### 📝 Opción B: Manual (Si prefieres hacerlo tú mismo)

1. En Railway, haz clic en tu servicio **PostgreSQL**
2. Ve a la pestaña **"Query"** o **"Data"** → **"Query"**
3. Copia y pega este SQL:

```sql
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

CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_empresa ON leads(empresa);
```

4. Haz clic en **"Run"** o ejecuta la query

### Paso 4: Verificar que funciona

1. Despliega los cambios (haz push al repositorio)
2. Ve a tu aplicación en Railway
3. Accede al CRM (`/admin/crm`)
4. Deberías ver el tablero Kanban (probablemente vacío al principio)
5. Intenta crear un lead desde el formulario de contacto

## 🔍 Verificar que está funcionando

### En Railway:
- Ve a tu servicio PostgreSQL → **"Data"** → Deberías ver la tabla `leads`
- Si la tabla existe, ¡está funcionando! ✅

### En tu aplicación:
- Los leads se guardan y persisten
- No se pierden al reiniciar el servidor
- Puedes verlos en el CRM

## ❌ Si algo no funciona

### Error: "relation 'leads' does not exist"
- **Solución**: Ejecuta el SQL del Paso 3 (Opción B) manualmente

### Error: "Connection refused" o "password authentication failed"
- **Solución**: Verifica que la `DATABASE_URL` esté correcta en las variables de tu aplicación

### Error: "DATABASE_URL is not defined"
- **Solución**: Asegúrate de haber agregado la variable `DATABASE_URL` en tu servicio Next.js

## 📝 Notas importantes

- ⚠️ **Nunca** compartas tu `DATABASE_URL` públicamente
- ✅ Railway maneja automáticamente las conexiones SSL
- ✅ La base de datos se respalda automáticamente
- ✅ Puedes ver los datos en Railway → PostgreSQL → Data

## 🎉 ¡Listo!

Una vez completados estos pasos, tu CRM estará usando PostgreSQL y los datos persistirán correctamente.

