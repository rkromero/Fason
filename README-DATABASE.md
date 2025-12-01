# Configuración de PostgreSQL en Railway

Este documento explica cómo configurar PostgreSQL en Railway para el CRM.

## Pasos para configurar PostgreSQL en Railway

### 1. Crear la base de datos en Railway

1. Ve a tu proyecto en [Railway](https://railway.app)
2. Haz clic en **"New"** o **"+"**
3. Selecciona **"Database"** → **"Add PostgreSQL"**
4. Railway creará automáticamente una instancia de PostgreSQL

### 2. Obtener la URL de conexión

1. Haz clic en el servicio PostgreSQL que acabas de crear
2. Ve a la pestaña **"Variables"**
3. Copia la variable `DATABASE_URL` (Railway la crea automáticamente)
4. Esta URL tiene el formato: `postgresql://user:password@host:port/database`

### 3. Configurar la variable de entorno

1. Ve a tu servicio de aplicación (Next.js) en Railway
2. Haz clic en **"Variables"**
3. Agrega o verifica que existe la variable `DATABASE_URL` con el valor copiado
4. Si no existe, haz clic en **"New Variable"** y agrega:
   - **Name**: `DATABASE_URL`
   - **Value**: (pega la URL que copiaste)

### 4. Inicializar la base de datos

Tienes dos opciones para inicializar la base de datos:

#### Opción A: Desde Railway (Recomendado)

1. Ve a tu servicio PostgreSQL en Railway
2. Haz clic en la pestaña **"Query"** o **"Data"**
3. Copia el contenido del archivo `lib/db/schema.sql`
4. Pégalo en el editor SQL y ejecuta la query
5. Esto creará la tabla `leads` con todos los índices necesarios

#### Opción B: Desde tu máquina local

1. Instala las herramientas de PostgreSQL localmente (psql)
2. Conecta a tu base de datos usando la `DATABASE_URL`:
   ```bash
   psql $DATABASE_URL
   ```
3. Ejecuta el contenido de `lib/db/schema.sql`:
   ```sql
   \i lib/db/schema.sql
   ```

### 5. Verificar la conexión

Una vez configurado, tu aplicación debería conectarse automáticamente a PostgreSQL cuando se despliegue en Railway.

## Estructura de la base de datos

La tabla `leads` tiene la siguiente estructura:

- `id` (VARCHAR): Identificador único del lead
- `nombre` (VARCHAR): Nombre del contacto
- `empresa` (VARCHAR): Nombre de la empresa
- `email` (VARCHAR): Email de contacto
- `telefono` (VARCHAR): Teléfono de contacto
- `producto` (VARCHAR): Tipo de producto ('alfajores' o 'galletitas')
- `marca` (VARCHAR): Si tiene marca registrada ('si' o 'no')
- `volumen` (VARCHAR): Volumen mensual estimado
- `envasado` (VARCHAR): Tipo de envasado
- `mensaje` (TEXT): Mensaje opcional del cliente
- `inversion_estimada` (VARCHAR): Inversión estimada
- `stage` (VARCHAR): Etapa actual del lead
- `created_at` (TIMESTAMP): Fecha de creación
- `updated_at` (TIMESTAMP): Fecha de última actualización
- `notes` (JSONB): Array de notas en formato JSON
- `last_contact` (TIMESTAMP): Fecha del último contacto

## Migración de datos existentes

Si tienes datos en el almacenamiento en memoria (`leads-store.ts`), puedes migrarlos ejecutando un script de migración. Por ahora, los nuevos leads se crearán directamente en PostgreSQL.

## Troubleshooting

### Error: "relation 'leads' does not exist"
- **Solución**: Ejecuta el script `lib/db/schema.sql` en tu base de datos

### Error: "Connection refused"
- **Solución**: Verifica que la variable `DATABASE_URL` esté correctamente configurada en Railway

### Error: "password authentication failed"
- **Solución**: Verifica que estés usando la `DATABASE_URL` correcta del servicio PostgreSQL en Railway

## Notas importantes

- ⚠️ **Nunca** compartas tu `DATABASE_URL` públicamente
- ✅ Railway maneja automáticamente las conexiones SSL en producción
- ✅ La base de datos se respalda automáticamente en Railway
- ✅ Puedes ver los datos directamente desde Railway en la pestaña "Data"

