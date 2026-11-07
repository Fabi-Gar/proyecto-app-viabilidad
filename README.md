# Plantilla de viabilidad 360°

Aplicación web para evaluar la **viabilidad de cualquier proyecto** (un ERP, un
CRM, una app, etc.) y emitir un dictamen **Go / Go condicionado / No Go**.
Calcula el análisis financiero (VAN, TIR, B/C, recuperación, sensibilidad,
escenarios y Monte Carlo), el puntaje por enfoque, el mapa y la matriz de
riesgos y el dictamen, y genera un **informe completo en PDF** que puede
enviarse por **correo** o compartirse por **WhatsApp**.

Proyecto final del curso *Análisis y Evaluación de Proyectos* — Maestría en
Informática, Universidad Mariano Gálvez (UMG).

## Qué hace

- **Calculadora en vivo**: formularios por pestaña (datos generales, inversión,
  beneficios y costos, requerimientos, los ocho enfoques de evaluación, riesgos,
  FODA, PESTEL, Balanced Scorecard, ciclo de vida, KPIs y cronograma). El
  dictamen y las métricas se actualizan solos.
- **Informe**: en PDF (`pdf/InformePDF.tsx`) y como página web pública
  (`/informe/[id]`).
- **Envío**: correo con el PDF adjunto (Resend) y enlace por WhatsApp.
- **Validación de casos** (`/validacion`): carga varios proyectos `.json` y
  compara el dictamen de la calculadora contra el resultado real conocido.
- **Guardar / cargar**: descarga y carga de proyectos en `.json`.

## Requisitos

- Node.js 20 LTS o superior.

## Cómo correrlo

```bash
npm install
npm run dev
```

Abre <http://localhost:3000>.

Otros comandos:

```bash
npm run build      # build de producción
npm start          # sirve el build
npm test           # pruebas de regresión del motor (tsx + node:test)
npm run verificar  # verificación rápida del ejemplo contra las cifras esperadas
```

## Variables de entorno

Copia `.env.example` a `.env.local` y complétalo (o configúralas en Vercel →
*Settings → Environment Variables*). **No se suben a git.**

| Variable             | Para qué sirve                                             | Obligatoria |
| -------------------- | --------------------------------------------------------- | ----------- |
| `RESEND_API_KEY`     | Clave de Resend para enviar el correo. Solo en servidor.  | Solo correo |
| `EMAIL_FROM`         | Remitente verificado en Resend (dominio propio).          | Solo correo |
| `NEXT_PUBLIC_APP_URL`| URL pública de la app (base del enlace de WhatsApp).      | Recomendada |

La calculadora, el PDF y la validación funcionan **sin configurar nada**. Las
variables solo hacen falta para el envío por correo y para que el enlace de
WhatsApp use el dominio de producción.

## Despliegue en Vercel

1. Sube el repositorio a GitHub.
2. En Vercel: *New Project* → importa el repo.
3. Agrega las variables de entorno.
4. *Deploy*. Las rutas de API corren como funciones serverless.

Prueba el envío con un correo propio antes de la demo.

## Guardar y cargar proyectos

En la pestaña **Proyecto**:

- **Descargar proyecto (.json)**: guarda el análisis en un archivo.
- **Cargar proyecto (.json)**: lo vuelve a abrir; valida el archivo y completa
  los campos que falten.

Los proyectos de validación se guardan en la carpeta [`casos/`](casos/)
(ver su README).

## Documentación

- [`docs/formulas.md`](docs/formulas.md) — todas las fórmulas y reglas del motor
  (sección técnica del documento final).
- [`docs/manual-usuario.md`](docs/manual-usuario.md) — cómo evaluar un proyecto
  de principio a fin.
- [`docs/manual-administrador.md`](docs/manual-administrador.md) — instalación,
  despliegue, Resend y solución de problemas.

## Limitaciones conocidas

- **Datos solo en el navegador**: el proyecto en edición se guarda en
  `localStorage` del navegador; no hay base de datos. Usa *Descargar proyecto
  (.json)* para no perder el trabajo.
- **WhatsApp comparte un enlace**, no envía el PDF. El enlace lleva el proyecto
  **codificado en la propia URL** (hash `#d=…`); por eso puede ser largo. Quien
  reciba el enlace ve el informe, y los datos viajan en el enlace, no en un
  servidor.
- **Correo**: requiere un **dominio verificado en Resend** y las variables de
  entorno. Sin ellas, la app avisa que el envío no está configurado.
- **Monte Carlo**: 5,000 corridas con **semilla fija** (resultado reproducible)
  y **horizonte máximo de 15 años**. El Excel original usaba 2,000 corridas y
  hasta 10 años; por eso las probabilidades pueden diferir ligeramente, aunque
  VAN, TIR, B/C y recuperación coinciden.

## Estructura

```
app/            Páginas (calculadora, informe público, /validacion) y API de correo
components/     Paneles de la calculadora, informe web, editores y gráficas
lib/            Motor de cálculo, tipos, ejemplos, esquema, validación y utilidades
pdf/            Documentos @react-pdf (informe y tabla de validación)
emails/         Plantilla del correo (React Email)
casos/          Casos de validación (.json) + README
docs/           Fórmulas y manuales
scripts/        verificar.ts (comprobación rápida del ejemplo)
tests/          Pruebas de regresión
```
