# Manual de usuario

Guía paso a paso para evaluar un proyecto con la Plantilla de viabilidad 360° y
emitir el dictamen **Go / Go condicionado / No Go**. No requiere conocimientos
técnicos.

> Los marcadores **[CAPTURA: …]** indican dónde insertar una imagen de pantalla
> en el documento final.

## 1. Abrir la aplicación

Entra a la dirección de la app (local: <http://localhost:3000>; publicada: la
URL de Vercel del equipo). Arriba verás siempre el **nombre del proyecto**, el
**puntaje global**, el **dictamen** y los botones **Validación** y **Descargar
PDF**.

[CAPTURA: barra superior con puntaje, dictamen y botones]

La app arranca con un **ejemplo** (programa de lealtad de la sucursal Centro de un restaurante, que da No Go). Para evaluar tu propio
proyecto, ve a la pestaña **Proyecto** y pulsa **«Empezar un proyecto en
blanco»**.

## 2. Recorrer las pestañas

El trabajo se organiza en pestañas. El dictamen se recalcula solo a medida que
llenas los datos; no hay que “guardar” para ver el resultado.

[CAPTURA: fila de pestañas]

1. **Proyecto**: nombre, descripción, validación de campos, datos de validación
   del caso, y guardar/cargar.
2. **Requerimientos**: lista de requerimientos (ID, descripción, tipo,
   prioridad).
3. **Técnica, Operativa, Mercado, Socioambiental, Estratégica, Ciclo de vida**:
   cada criterio se califica de **1 (muy deficiente) a 5 (excelente)**; escribe
   la evidencia en cada línea.
   - En **Estratégica** también llenas el **FODA**, el **PESTEL** y el
     **Balanced Scorecard**, que dibuja el **mapa estratégico de TI**.
   - En **Ciclo de vida** llenas las fases de preinversión y el **plan de
     monitoreo (KPIs)**.
4. **Financiera**: inversión inicial, beneficios y costos anuales (con su
   crecimiento), tasa, contingencia y escenarios. Aquí aparecen VAN, TIR, B/C,
   recuperación, la tabla de sensibilidad, el tornado y Monte Carlo.
5. **Riesgos**: matriz de probabilidad × impacto con el control de cada riesgo.
6. **Cronograma**: fases con fechas y responsables (con diagrama de Gantt).
7. **Dictamen**: pesos de cada enfoque, condiciones de aprobación,
   recomendaciones y el envío del informe.

[CAPTURA: pestaña Financiera con las métricas]

### Consejo sobre la evidencia

Cada criterio y cada factor tienen un campo de **nota / evidencia**. Llénalo:
es lo que explica *por qué* un enfoque tiene su puntaje y lo que sustenta el
dictamen en el informe.

## 3. Leer el dictamen

En la pestaña **Dictamen** (y arriba, siempre visible) verás uno de tres
resultados:

- **Go**: cumple las 9 condiciones de aprobación. Se recomienda aprobarlo.
- **Go condicionado**: es atractivo (VAN positivo) pero falta cumplir alguna
  condición. Revisa la lista de **recomendaciones**: dice qué resolver.
- **No Go**: no cumple los mínimos (VAN negativo, puntaje muy bajo, demasiados
  riesgos críticos o una dimensión muy baja).

[CAPTURA: tabla de condiciones con cumple/falta y recomendaciones]

La **validación de campos** en la pestaña Proyecto avisa con ✗ (errores) y !
(recomendaciones) qué falta por llenar.

## 4. Generar y enviar el informe

- **Descargar PDF** (arriba a la derecha): arma el informe completo con todas
  las secciones.
- En la pestaña **Dictamen**, bloque **«Enviar el informe»**:
  - **Correo**: escribe el destinatario y pulsa **«Enviar por correo»**. Se
    manda con el PDF adjunto. *(Requiere que el equipo haya configurado el envío;
    si no, aparece un aviso.)*
  - **WhatsApp**: abre un mensaje con el dictamen y un **enlace** a la página del
    informe. WhatsApp no adjunta el PDF; comparte el enlace. Los datos del
    proyecto viajan dentro del propio enlace.
  - **Copiar enlace del informe**: copia esa URL para pegarla donde quieras.

[CAPTURA: bloque Enviar el informe]

## 5. Guardar y cargar un proyecto

En la pestaña **Proyecto**, bloque **«Guardar y cargar»**:

- **Descargar proyecto (.json)**: guarda todo el análisis en un archivo. Úsalo
  para no perder el trabajo (los datos solo viven en tu navegador).
- **Cargar proyecto (.json)**: vuelve a abrir un archivo guardado. Si el archivo
  no sirve, se muestra un error claro.

[CAPTURA: botones Descargar/Cargar proyecto]

## 6. Validar varios casos (/validacion)

La página **Validación** (botón arriba, o `/validacion`) sirve para el anexo de
validación del curso:

1. Pulsa **«Cargar casos (.json)»** y selecciona varios archivos de proyectos.
2. La tabla muestra, por cada caso: VAN, TIR, B/C, recuperación, puntaje,
   dictamen, el **resultado real** declarado y si **coincide** con el dictamen.
3. Abre el **informe completo** de un caso pulsando su nombre.
4. Exporta la tabla a **CSV** (se abre bien en Excel) o a **PDF**.
5. Abajo tienes el **resumen**: cuántos casos coinciden, parciales y no
   coinciden.

[CAPTURA: tabla de validación con el resumen]

Para que un caso tenga resultado real, en la pestaña **Proyecto** llena el
bloque **«Datos de validación del caso»** (Éxito / Fracaso / Sin dato, fuente y
notas) antes de descargar su `.json`.
