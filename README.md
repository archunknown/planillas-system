<div align="center">

# Planillas System

**Sistema web de gestión de planillas para estudios contables que atienden micro y pequeñas empresas peruanas.**  
Automatiza el cálculo de remuneraciones, descuentos, aportes, generación de boletas de pago y exportación de archivos para PLAME y AFP-Net.

---

</div>

## Características

| Módulo | Descripción |
|--------|-------------|
| **Cálculo de planillas** | Por régimen laboral: General, MYPE, Construcción Civil, Agrario |
| **Gestión de entidades** | Empresas, trabajadores y contratos |
| **Boletas de pago** | Generación en PDF |
| **Beneficios sociales** | Liquidaciones de CTS, vacaciones y gratificaciones truncas |
| **Exportaciones legales** | Archivos para PLAME (SUNAT) y AFP-Net |
| **Parámetros legales** | RMV, tasas AFP, jornales Capeco, UIT — actualizables |
| **Multiusuario** | Roles: administrador, contador, cliente |
| **Acceso** | Responsive desde navegador y móvil |

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript |
| Base de datos | PostgreSQL 16 |
| ORM | Prisma 7 |
| Autenticación | NextAuth.js |
| Estilos | Tailwind CSS + shadcn/ui |
| PDF | @react-pdf/renderer |
| Contenedores | Docker |

---

## Requisitos previos

- Node.js `20+`
- Docker y Docker Compose
- Git

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/archunknown/planillas-system.git
cd planillas-system
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
DB_USER=planillas_admin
DB_PASSWORD=planillas_dev_2026
DB_NAME=planillas_db
DATABASE_URL="postgresql://planillas_admin:planillas_dev_2026@localhost:5432/planillas_db"
NEXTAUTH_SECRET="genera-tu-propio-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Levantar la base de datos

**Linux:**

```bash
sudo systemctl start docker
docker-compose up -d
```

**Windows (con Docker Desktop):**

```powershell
docker compose up -d
```

### 5. Aplicar migraciones

```bash
npx prisma migrate dev
```

### 6. Iniciar el servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

---

## Estructura del proyecto

```
planillas-system/
├── prisma/
│   ├── schema.prisma              # Modelo de datos
│   └── migrations/                # Migraciones de BD
├── src/
│   ├── app/                       # Rutas y páginas (App Router)
│   ├── lib/
│   │   ├── calculations/          # Motor de cálculo de planillas
│   │   ├── exports/               # Generadores PLAME, AFP-Net
│   │   └── pdf/                   # Templates de boletas y liquidaciones
│   └── components/                # Componentes React reutilizables
├── docker-compose.yml
├── prisma.config.ts
└── package.json
```

---

## Solución de problemas

### Docker: error de iptables en Linux

Si al ejecutar `docker-compose up -d` aparece un error de iptables:

```bash
sudo modprobe br_netfilter
sudo systemctl restart docker
docker-compose up -d
```

### Prisma: error de conexión a la base de datos

Verifica que el contenedor de PostgreSQL esté corriendo:

```bash
docker ps
```

Si no aparece, levántalo nuevamente con `docker-compose up -d`.

---

## Licencia

Este proyecto es parte de un trabajo de investigación académico. Todos los derechos reservados.
