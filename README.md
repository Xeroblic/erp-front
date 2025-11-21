# **Zentria ERP Frontend**

### *Plataforma Web Corporativa para la Gestión Integral de Operaciones Multi-Empresa y Multi-Sucursal*

---

## **1. Introducción Corporativa**

**Zentria ERP** es un ecosistema tecnológico diseñado para centralizar y automatizar la administración de empresas con estructuras **complejas**, presencia en múltiples unidades de negocio y operaciones que requieren un alto nivel de trazabilidad, seguridad y consistencia.

El **Frontend de Zentria ERP** constituye la interfaz oficial del sistema, proporcionando una experiencia moderna, rápida y unificada para todo el personal de la organización. Está construido sobre tecnologías de última generación, con énfasis en:

* Alta performance (Vite + SWC)
* Seguridad y manejo robusto de autenticación
* Escalabilidad modular por negocio
* Experiencia de usuario coherente y corporativa
* Arquitectura mantenible para equipos de desarrollo en crecimiento

El frontend consume servicios a través de **API REST** provistas por el backend (Laravel 12 + JWT), integrándose de forma segura en toda la infraestructura.

---

## **2. Objetivo Estratégico del Proyecto**

Zentria ERP busca **unificar**, **automatizar** y **estructurar** toda la gestión empresarial de organizaciones como:

* Empresas con múltiples divisiones (ej. EcoPC, EcoTI, RentaPC)
* Empresas con redes de sucursales o franquicias
* Departamentos corporativos con flujos administrativos diferenciados
* Organizaciones que requieren separación estricta de datos entre unidades

El sistema permite consolidar todos los procesos críticos:

* Administración corporativa
* Gestión de sucursales
* Usuarios, roles y permisos
* Inventario y estados técnicos
* Transferencias y logística
* Clientes, productos y servicios
* Integraciones externas (WooCommerce, Marketplace, etc.)

Todo bajo un mismo ecosistema visual y operativo.

---

## **3. Arquitectura Tecnológica del Frontend**

### **Framework Principal**

* **React 18 + TypeScript 5**
* Bundler: **Vite 5** (ultra-fast, devServer instantáneo)
* Estilos: **Tailwind CSS 3** (tema corporativo y dark mode nativo)

### **Estado Global**

* **Redux Toolkit + Persistencia**

  * Autenticación (JWT)
  * Empresa / Subsidiaria / Sucursales
  * Usuarios corporativos
  * Permisos dinámicos
  * Personalización por usuario

### **UI Corporativa**

Sistema de diseño custom, documentado, escalable y centralizado.

Incluye componentes estratégicos para ERP empresarial:

* Modales corporativos
* Tablas reactivas (TanStack Table)
* Formularios con validación avanzada (Formik + Yup)
* Cards, Badges, Alerts, Tooltips
* Layouts corporativos: Aside, Header, Footer, Subheader, PageWrapper
* SelectReact personalizado con validación integrada
* Sistema de temas y color brandable por empresa

(*Documentación completa disponible en la “Guía UI – ERP Frontend”*) 

---

## **4. Estructura del Proyecto (Nivel Enterprise)**

```text
zentria-erp-front
├── public                # Recursos estáticos
├── src
│   ├── App               # Componente maestro
│   ├── assets
│   ├── components        # Sistema UI corporativo
│   │   ├── authorization
│   │   ├── form
│   │   ├── layouts
│   │   ├── router
│   │   └── ui
│   ├── config            # Configuración core: páginas, temas, API, permisos
│   ├── constants
│   ├── context
│   ├── hooks
│   ├── interface
│   ├── locales           # Internacionalización
│   ├── pages             # Módulos empresariales
│   ├── routes
│   ├── services          # Integración API REST
│   ├── store             # Redux Toolkit + Persistencia
│   ├── styles
│   ├── templates
│   ├── types
│   ├── utils
│   ├── index.tsx
│   ├── i18n.ts
│   └── setupTests.ts
└── vite.config.ts
```

La estructura está diseñada para soportar **decenas de módulos** sin generar deuda técnica.

---

## **5. Core del Sistema (Núcleo de Operación)**

### **5.1. Autenticación Empresarial**

* Inicio de sesión con JWT
* Refresh token automático
* Manejo completo de expiración de sesión
* Persistencia de usuario y empresa activa
* Sincronización entre tabs

### **5.2. Sistema Corporativo de Roles y Permisos**

* Roles contextualizados por alcance:

  * SuperAdmin
  * CompanyAdmin
  * SubsidiaryAdmin
  * BranchAdmin
  * Employee
* Permisos modulares y granulares generados desde backend
* Validación en frontend por:

  * Guards de ruta
  * Bloqueo de componentes
  * Navegación condicional
  * Menú lateral autorizado con `<AuthorityCheckNav>`

### **5.3. Multi-Empresa / Multi-Subsidiaria / Multi-Sucursal**

Soporte completo para organizaciones complejas:

* Rutas dependientes del contexto
* Peticiones automáticas por empresa activa
* Listado corporativo consolidado
* Cambios de sucursal en tiempo real

### **5.4. Personalización Avanzada**

Cada usuario puede configurar:

* Color institucional
* Tamaño de fuente
* Modo oscuro / claro / sistema
* Preferencias almacenadas en Backend y LocalStorage

Cambio de tema **en tiempo real**, sin recargar la aplicación.

---

## **6. Sistema UI Corporativo (Design System)**

Zentria ERP integra un **framework de componentes UI** desarrollado internamente:

### **Componentes Clave**

* **Modal System** (header, body, footer, confirmaciones)
* **Card System** (headers, acciones, contenedores)
* **SelectReact System** (select avanzado corporativo)
* **Table System** (tablas accesibles)
* **Alert / Badge / Button System**
* **Input System con validación integrada**
* **Layouts corporativos reutilizables**

El sistema UI busca:

* Consistencia visual en todo el ERP
* Mínimo código repetido
* Flexibilidad para módulos futuros
* Estándares accesibles AA/AAA

*(Documentación del diseño UI:)*
👉 

---

## **7. Navegación Corporativa**

Zentria utiliza un sistema de routing por “plantillas”:

* **AsideRouter** → menú lateral autorizado
* **HeaderRouter** → barra superior contextual
* **ContentRouter** → render principal de páginas
* **FooterRouter** → pie autónomo por módulo

Cada módulo puede:

* Ocultar aside/header/footer
* Sobrescribir el layout
* Renderizar encabezados propios

---

## **8. Integración API REST**

El front se conecta al backend mediante:

* **BaseService** (Axios con interceptores)
* **ApiService** (response normalizado)
* **Servicios por módulo**
* Manejo robusto de:

  * Tokens vencidos
  * Errores 401 y 403
  * Redirección automática
  * Manejo central de mensajes (Toastify)
  * API abort signals

Toda la lógica está centralizada para facilitar mantenimiento y auditorías.

---

## **9. Módulos Corporativos Implementados**

### **✔ Administración General**

* Datos de empresa
* Subsidiarias
* Sucursales (en expansión)
* Roles y permisos
* Usuarios corporativos
* Estado y actividad de cuenta

### **✔ Invitaciones y Onboarding**

* Creación de usuarios no activados
* Envío automático de correos
* Activación por token
* Reenvío y expiración
* Tabla de estados

### **✔ Dashboard Multi-Empresa**

* Variantes por unidad (EcoPC / EcoTI / Paris / Ripley / Falabella)
* Conteos, métricas y gráficos
* Configurable por usuario

### **✔ Perfil y Personalización**

* Información personal
* Avatar
* Tema visual y preferencias persistentes

### **✔ Autenticación**

* Login
* Logout seguro
* Recuperación de contraseña
* Cambio credenciales

### **✔ Gestión Organizacional (en desarrollo continuo)**

* Calendario corporativo
* Tickets internos
* RRHH (estructura avanzada)

*(Documentación general por módulo:)*
👉 

---

## **10. Internacionalización**

Zentria ERP soporta:

* Español
* Inglés
* Árabe

Con i18next + Dayjs.

esto se debe implementar a futuro ya que wen la V1 
se dejaron los componentes pero no se implementaron completamente en el sistema

Todos los textos del panel son traducibles y ampliables.

---

## **11. Seguridad y Buenas Prácticas**

* Tokens JWT seguros y refresco automático
* Limpiado de estado en logout
* Protección contra overflows de UI
* Controles de permisos en múltiples niveles
* Validación profunda de formularios
* Sanitización en inputs críticos
* Aislamiento completo entre empresas (multi-tenancy visual)

---

## **12. Testing y Control de Calidad**

* Configuración completa con Jest + RTL
* En proceso: tests unitarios y de integración
* Estructura preparada para pipelines CI/CD

---

## **13. Roadmap Estratégico**

### **Próximas expansiones confirmadas**

* Inventario + estados técnicos
* Transferencias
* Gestión logística
* Sincronización WooCommerce API
* Clientes & Productos
* RRHH completo
* Tickets + workflow
* Reportes corporativos exportables

### **Objetivo final:**

**Un ERP modular, escalable, auditable y administrable a nivel corporativo, con foco en empresas tecnológicas, retail y servicio técnico.**

---

## **14. Conclusión Ejecutiva**

Zentria ERP Frontend representa un **producto empresarial sólido**, diseñado para organizaciones que requieren:

* Control jerárquico complejo
* Seguridad robusta
* Altos volúmenes de datos
* Personalización por usuario y por empresa
* Experiencia consistente y profesional
* Integración con múltiples fuentes de información

Es una plataforma moderna, escalable y preparada para crecer hacia cualquier vertical: logística, inventario, RRHH, ventas, soporte técnico, marketplace y más.
