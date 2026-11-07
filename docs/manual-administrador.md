# Manual de administrador

Guía de instalación, despliegue, configuración del correo (Resend) y solución de
problemas de la Plantilla de viabilidad 360°. Dirigido a quien instala, publica
y mantiene la aplicación.

> Los marcadores **[CAPTURA: …]** indican dónde insertar una imagen de pantalla
> en el documento final.

## 1. Requisitos

- **Node.js 20 LTS** o superior.
- Cuenta de **GitHub** (para desplegar) y de **Vercel** (plan gratuito).
- Para el correo: cuenta de **Resend** con un **dominio verificado**.

## 2. Instalación local

```bash
git clone <URL-del-repositorio>
cd app-viabilidad
npm install
npm run dev
```

Abre <http://localhost:3000>. Para un build de producción local:

```bash
npm run build
npm start
```

[CAPTURA: terminal con npm run dev y la app abierta]

## 3. Variables de entorno

Copia `.env.example` a `.env.local` y complétalo. **`.env.local` no se sube a
git** (está en `.gitignore`).

| Variable             | Descripción                                            |
| -------------------- | ------------------------------------------------------ |
| `RESEND_API_KEY`     | Clave de API de Resend. **Solo en el servidor.**       |
| `EMAIL_FROM`         | Remitente verificado, p. ej. `informes@tu-dominio.com`.|
| `NEXT_PUBLIC_APP_URL`| URL pública de la app (base del enlace de WhatsApp).   |

`NEXT_PUBLIC_APP_URL` es la única que llega al navegador (prefijo
`NEXT_PUBLIC_`). **`RESEND_API_KEY` nunca** debe ir en código de cliente ni en
variables `NEXT_PUBLIC_`; solo la usa la API en el servidor.

## 4. Configurar Resend (correo)

1. Crea una cuenta en <https://resend.com>.
2. **Agrega y verifica tu dominio** (Domains → Add Domain) creando los registros
   DNS que indica Resend (SPF/DKIM). El correo `EMAIL_FROM` debe usar ese
   dominio.
3. Crea una **API Key** (API Keys → Create). Cópiala a `RESEND_API_KEY`.
4. Plan gratuito: suficiente para las pruebas del curso.

[CAPTURA: panel de Resend con el dominio verificado]

Sin estas variables, la app **funciona igual** (calculadora, PDF, validación); al
intentar enviar correo responde con un aviso de *“envío no configurado”*.

## 5. Despliegue en Vercel

1. Sube el repositorio a GitHub.
2. En Vercel: **New Project → Import** el repositorio.
3. En **Environment Variables**, agrega `RESEND_API_KEY`, `EMAIL_FROM` y
   `NEXT_PUBLIC_APP_URL` (usa la URL definitiva de Vercel).
4. **Deploy**. Las rutas bajo `app/api/` corren como funciones serverless.
5. Tras el despliegue, prueba el envío con un correo propio.

[CAPTURA: variables de entorno en Vercel]

## 6. Renovación de claves

- Para **rotar** la clave de Resend: crea una nueva API Key, actualiza
  `RESEND_API_KEY` en Vercel (y en `.env.local` si corre local) y vuelve a
  desplegar. Luego revoca la clave anterior en Resend.
- Si cambia el dominio del remitente, actualiza `EMAIL_FROM` y verifica el nuevo
  dominio en Resend.
- Si cambia la URL de la app, actualiza `NEXT_PUBLIC_APP_URL` (afecta el enlace
  de WhatsApp).

## 7. Mantenimiento y pruebas

```bash
npm test           # pruebas de regresión del motor (deben pasar en verde)
npm run verificar  # comprobación rápida del ejemplo contra las cifras esperadas
npm run build      # valida tipos y que todo compile
```

Si tocas el motor (`lib/calculo.ts`), corre `npm test` antes de desplegar: las
pruebas comparan VAN, TIR, B/C, recuperación, puntaje y dictamen de varios casos
contra valores verificados.

## 8. Solución de problemas

| Síntoma | Causa probable | Qué hacer |
| --- | --- | --- |
| “El envío de correo no está configurado” | Falta `RESEND_API_KEY` o `EMAIL_FROM` | Configura las variables y vuelve a desplegar. |
| Resend rechaza el envío (error 4xx/5xx) | Dominio no verificado o `EMAIL_FROM` no coincide con el dominio | Verifica el dominio en Resend y usa un remitente de ese dominio. |
| El enlace de WhatsApp lleva a “No se pudo abrir el informe” | El enlace se cortó al compartir (es largo) | Vuelve a copiar el enlace completo (botón *Copiar enlace del informe*). |
| El enlace de WhatsApp apunta a `localhost` | Falta `NEXT_PUBLIC_APP_URL` | Configúrala con la URL pública y redepliega. |
| Se perdió el trabajo al cambiar de equipo o navegador | Los datos viven en `localStorage` de ese navegador | Usa *Descargar proyecto (.json)* para respaldar; se recupera con *Cargar proyecto*. |
| `npm run build` falla al descargar la fuente de Google | Sin conexión durante el build | Reintenta con conexión; no es un error del código. |
| El PDF sale con caracteres raros en algún símbolo | La fuente estándar del PDF no tiene ese glifo | El informe ya sustituye los símbolos problemáticos; evita pegar símbolos poco comunes en los textos. |

## 9. Seguridad

- No subas `.env.local` ni las claves a git.
- La `RESEND_API_KEY` solo se usa del lado servidor (API route).
- La app no guarda correos ni claves en logs.
- El informe compartido por enlace lleva los datos **codificados en la URL**; no
  compartas enlaces de proyectos sensibles con quien no deba verlos.
