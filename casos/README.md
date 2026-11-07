# Casos de validación

Esta carpeta guarda los **casos de validación** del anexo: un archivo `.json`
por cada proyecto que se evalúa para comprobar que el dictamen de la calculadora
coincide con el resultado real conocido.

## Formato

Cada archivo es un proyecto exportado desde la calculadora con el botón
**«Descargar proyecto (.json)»** (pestaña *Proyecto*). Es el mismo objeto
`Proyecto` que usa la app (ver [`lib/tipos.ts`](../lib/tipos.ts)).

Para que el caso sirva en la tabla de validación, llena en la pestaña *Proyecto*
el bloque **«Datos de validación del caso»**:

- **Resultado real**: `Éxito`, `Fracaso` o `Sin dato`.
- **Fuente**: texto o URL de donde salen las cifras y el resultado del caso.
- **Notas**: contexto u observaciones.

## Cómo usarlos

1. Abre la calculadora y carga o captura los datos del caso.
2. Rellena el bloque de datos de validación.
3. Descarga el proyecto (`.json`) y guárdalo aquí, con un nombre claro
   (por ejemplo `erp-empresa-x.json`).
4. Abre la página **[/validacion](../app/validacion/page.tsx)** en la app,
   carga todos los `.json` de esta carpeta y revisa la tabla de coincidencias.
   Desde ahí puedes exportar la tabla a CSV y a PDF.

## Regla de coincidencia

| Resultado real | Dictamen de la calculadora | ¿Coincide?   |
| -------------- | -------------------------- | ------------ |
| Éxito          | Go                         | Coincide     |
| Éxito          | Go condicionado            | Parcial      |
| Éxito          | No Go                      | No coincide  |
| Fracaso        | No Go                      | Coincide     |
| Fracaso        | Go condicionado            | Parcial      |
| Fracaso        | Go                         | No coincide  |
| Sin dato       | (cualquiera)               | Sin dato     |

## Archivos

- `ejemplo-tarjetas-lealtad.json` — caso de ejemplo (programa de lealtad en
  Apple/Google Wallet). Es el proyecto de demostración de la app; su resultado
  real está marcado como *Sin dato* porque aún no se ha implementado.

Agrega aquí los `.json` reales de cada caso de validación del equipo.
