/**
 * Mapa estratégico de TI (versión web / SVG-libre).
 *
 * Cuatro bandas apiladas (de abajo hacia arriba: Aprendizaje y crecimiento,
 * Procesos internos, Clientes, Financiera). Los objetivos del BSC aparecen como
 * cajas dentro de su banda, con la iniciativa de TI que los habilita. Entre
 * bandas hay una flecha hacia arriba que marca la relación causa-efecto.
 *
 * Se usa tanto en el editor (pestaña Estratégica) como en el informe público.
 * El PDF tiene su propia versión con primitivos de @react-pdf (MapaEstrategicoPDF).
 */
import { PERSPECTIVAS_BSC } from "@/lib/esquema";
import type { ObjetivoBSC, PerspectivaBSC } from "@/lib/tipos";

export function MapaEstrategico({ bsc }: { bsc: ObjetivoBSC[] }) {
  const porBanda: [PerspectivaBSC, ObjetivoBSC[]][] = PERSPECTIVAS_BSC.map((persp) => [
    persp,
    bsc.filter((o) => o.perspectiva === persp && (o.objetivo.trim() || o.iniciativaTI.trim())),
  ]);

  const hayAlgo = porBanda.some(([, objs]) => objs.length > 0);
  if (!hayAlgo) {
    return (
      <p className="hint">
        Agrega objetivos al Balanced Scorecard para dibujar el mapa estratégico.
      </p>
    );
  }

  return (
    <div className="mapa" role="img" aria-label="Mapa estratégico de TI por perspectivas del Balanced Scorecard">
      {porBanda.map(([persp, objs], i) => (
        <div key={persp}>
          <div className="mapa-band">
            <div className="mapa-band-label">{persp}</div>
            <div className="mapa-cards">
              {objs.length === 0 ? (
                <span className="hint" style={{ padding: "6px 2px" }}>
                  (Sin objetivos en esta perspectiva)
                </span>
              ) : (
                objs.map((o, j) => (
                  <div className="mapa-card" key={j}>
                    <div className="mapa-obj">{o.objetivo || "(sin objetivo)"}</div>
                    {o.iniciativaTI.trim() && (
                      <div className="mapa-ti">TI: {o.iniciativaTI}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          {i < porBanda.length - 1 && (
            <div className="mapa-arrow" aria-hidden="true">
              ↑
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
