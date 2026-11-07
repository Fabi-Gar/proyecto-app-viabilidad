# Fórmulas y reglas del motor

Documento técnico de la Plantilla de viabilidad 360°. Describe **todas** las
fórmulas del motor de cálculo ([`lib/calculo.ts`](../lib/calculo.ts)), con
ejemplos numéricos tomados del caso de ejemplo (programa de lealtad en
Apple/Google Wallet). El motor es determinista: con los mismos datos siempre da
el mismo resultado.

Convenciones:

- `H` = horizonte en años (1 a 15).
- `t` = año, de 0 (inversión) a `H`.
- `tasa` = tasa de descuento anual en % (ejemplo: 15).
- `r = tasa / 100` = tasa en tanto por uno.
- `conting` = contingencia sobre la inversión en %.
- `m = { b, c, i }` = multiplicadores de escenario sobre beneficios, costos e
  inversión (1 = base).

Cifras de referencia del ejemplo: **VAN Q 16,796.17**, **TIR 21.88 %**,
**B/C 1.078**, **recuperación 3.07 años**, **puntaje 60.05/100**,
dictamen **Go condicionado**.

---

## 1. Flujo de caja

**Inversión inicial (año 0):**

```
inv0 = (Σ inv[k].v) × (1 + conting/100) × m.i
```

Ejemplo: las 7 líneas suman Q 83,800; con 10 % de contingencia y `m.i = 1`:
`inv0 = 83,800 × 1.10 = Q 92,180`.

**Beneficios del año t** (cada línea crece a su tasa anual `g`):

```
benT[t] = (Σ ben[k].v × (1 + ben[k].g/100)^(t−1)) × m.b
```

En el último año se suma el valor residual: `benT[H] += residual × m.b`.

**Costos del año t:**

```
cosT[t] = (Σ cos[k].v × (1 + cos[k].g/100)^(t−1)) × m.c
```

**Flujo neto:**

```
net[0] = −inv0
net[t] = benT[t] − cosT[t]   para t = 1..H
```

## 2. Valor Actual Neto (VAN)

Se descuenta cada flujo a la tasa `r`:

```
VAN = −inv0 + Σ (net[t] / (1 + r)^t)      t = 1..H
```

También se acumulan los valores presentes de beneficios y costos, que sirven
para B/C y sensibilidad:

```
pvB = Σ benT[t] / (1 + r)^t
pvC = Σ cosT[t] / (1 + r)^t
```

VAN > 0 crea valor; VAN ≤ 0 lo destruye. Ejemplo: **Q 16,796.17**.

## 3. Tasa Interna de Retorno (TIR)

Es la tasa que hace `VAN = 0`. Se resuelve por **bisección** sobre la función

```
f(r) = Σ net[t] / (1 + r)^t
```

en el intervalo `[−0.95, 10]`, con 120 iteraciones. Si `f(−0.95)` y `f(10)`
tienen el mismo signo (no hay cruce por cero), la TIR **no existe** y se
devuelve `null` (por ejemplo, un flujo siempre negativo). Ejemplo: **21.88 %**.

## 4. Relación beneficio/costo (B/C)

```
B/C = pvB / (inv0 + pvC)
```

Es `null` si el denominador no es positivo. B/C > 1 significa que el valor
presente de los beneficios supera al de inversión más costos. Ejemplo:
`B/C = 1.078`.

## 5. Recuperación (payback)

Años hasta que el flujo acumulado pasa de negativo a positivo, **interpolando**
dentro del año en que ocurre:

```
recuperación = (t − 1) + (−acum_previo) / flujo_del_año
```

- **Simple**: con `rate = 0` (flujos sin descontar).
- **Descontada**: con `rate = r` (flujos descontados).

Si nunca se recupera dentro del horizonte, es `null`. Ejemplo simple: **3.07
años**.

## 6. Sensibilidad

Recalcula el VAN variando porcentualmente beneficios, costos e inversión sin
rehacer todo el flujo, usando los valores presentes ya calculados:

```
VAN(db, dc, di) = (1 + db)·pvB − (1 + dc)·pvC − (1 + di)·inv0
```

La tabla de sensibilidad del informe aplica variaciones de −30 % a +30 % en
beneficios y de −20 % a +30 % en costos/inversión. El **tornado** aplica ±20 %
a cada variable (±5 puntos a la tasa) y ordena por cuánto mueven el VAN.

## 7. Escenarios

Se recalcula el modelo completo con los multiplicadores de cada escenario
(porcentajes sobre beneficios `b`, costos `c` e inversión `i`):

- **Pesimista** (ejemplo): `b = 70 %`, `c = 120 %`, `i = 115 %`.
- **Optimista** (ejemplo): `b = 120 %`, `c = 95 %`, `i = 100 %`.

Cada escenario reporta su propio VAN y TIR. El dictamen exige que el **escenario
pesimista mantenga VAN positivo**.

## 8. Simulación de Monte Carlo

- **5,000 corridas** con un generador `mulberry32` de **semilla fija
  (20261015)**, por lo que el resultado es **reproducible**.
- Cada corrida sortea variaciones con **distribución triangular** `tri()` (mínimo,
  moda 0, máximo) para beneficios, costos e inversión, según los rangos
  configurados (`mc.bmin..bmax`, etc.), y recalcula el VAN con la fórmula de
  sensibilidad.
- Resultados: VAN promedio, **probabilidad de VAN > 0**, y percentiles 5, 50 y
  95. Ejemplo: probabilidad ≈ **42 %**.

La distribución triangular toma `u` uniforme en [0,1) y `c = (moda−a)/(b−a)`:

```
si u < c:  a + √(u·(b−a)·(moda−a))
si u ≥ c:  b − √((1−u)·(b−a)·(b−moda))
```

## 9. Puntaje por enfoque (0–100)

Los enfoques que se califican con criterios de 1 a 5 (Técnica, Operativa,
Mercado, Socioambiental, Estratégica y Ciclo de vida):

```
puntaje = (Σ (calificación − 1) / (4 × nº de criterios)) × 100
```

Ejemplo (Mercado, calificaciones [3,3,2,3,3]):
`((2+2+1+2+2) / (4×5)) × 100 = (9/20)×100 = 45`.

## 10. Puntaje financiero (0–100)

El enfoque Financiero suma hasta 100 puntos:

| Componente                | Puntos |
| ------------------------- | ------ |
| VAN > 0                   | 30     |
| TIR − tasa ≥ 0.05         | 20 (≥ 0 pero < 0.05 → 10; < 0 → 0) |
| B/C ≥ 1.2                 | 15 (≥ 1 pero < 1.2 → 8) |
| Recuperación ≤ H/2        | 15 (≤ H pero > H/2 → 8) |
| Probabilidad de VAN > 0   | 20 × prob (Monte Carlo) |

## 11. Puntaje de riesgos (0–100)

Para cada riesgo con probabilidad `p` (1–5), impacto `i` (1–5) y efectividad del
control `m` (%):

```
inherente = p × i
residual  = p × i × (1 − m/100)
```

Con el promedio de los residuales (`avg`) y la cantidad de **riesgos críticos**
(`crit` = residual ≥ 15):

```
score = acotar(100 − 6.67 × avg − 8 × crit, 0, 100)
```

Si no hay riesgos registrados, el score es 50. Niveles por residual:
**Bajo** < 5, **Medio** 5–9, **Alto** 10–14, **Crítico** ≥ 15.

## 12. Puntaje global y pesos

Promedio ponderado de los ocho enfoques con los pesos configurados:

```
total = Σ (puntaje_enfoque × peso_enfoque) / Σ pesos
```

Pesos del ejemplo: Técnica 15, Operativa 10, Mercado 15, Financiera 25,
Socioambiental 5, Estratégica 10, Riesgos 15, Ciclo de vida 5.

## 13. Dictamen: Go / Go condicionado / No Go

Se evalúan **9 condiciones**:

1. VAN positivo.
2. TIR ≥ tasa de descuento.
3. B/C > 1.
4. Recuperación dentro del horizonte.
5. Probabilidad de VAN > 0 (Monte Carlo) ≥ 70 %.
6. El escenario pesimista mantiene VAN positivo.
7. Sin riesgos críticos residuales.
8. Ninguna dimensión por debajo de 50 puntos.
9. Puntaje global ≥ umbral Go (por defecto 70).

**Reglas:**

- **No Go** (rechazo duro) si ocurre cualquiera: VAN ≤ 0, puntaje global menor
  que el umbral mínimo (`umbralCond`, por defecto 55), 3 o más riesgos críticos,
  o alguna dimensión por debajo de 30.
- **Go** si se cumplen **las 9** condiciones.
- **Go condicionado** en cualquier otro caso: el VAN es positivo y el proyecto
  es atractivo, pero falta cumplir alguna condición. El informe lista las
  recomendaciones (qué condición resolver y qué criterios o riesgos mejorar).

## 14. Regla de validación (anexo)

La página `/validacion` compara el **resultado real** conocido de cada caso con
el dictamen de la calculadora (ver [`lib/coincidencia.ts`](../lib/coincidencia.ts)):

| Resultado real | Dictamen        | ¿Coincide?  |
| -------------- | --------------- | ----------- |
| Éxito          | Go              | Coincide    |
| Éxito          | Go condicionado | Parcial     |
| Éxito          | No Go           | No coincide |
| Fracaso        | No Go           | Coincide    |
| Fracaso        | Go condicionado | Parcial     |
| Fracaso        | Go              | No coincide |
| Sin dato       | (cualquiera)    | Sin dato    |
