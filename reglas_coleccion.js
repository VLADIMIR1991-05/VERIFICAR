// reglas_coleccion.js
// Reglas por coleccion y limites de fabricacion (fichas COLECCIONES_MADEVAL).
// Generan AVISOS amarillos: no cambian medidas ni cuentan como error del despiece.
// Para apagar una regla, cambia "activa: true" por "activa: false".

const REGLAS_COLECCION = {
    // Limites ajustados con 20 semanas de produccion real.
    anchoMaximoUnaPuerta: { activa: true, maximo: 620 },
    anchoMaximoDosPuertas: { activa: true, maximo: 1200, maximoConRefuerzo: 1200 },
    anchoMaximoGavetas: { activa: true, maximo: 1000 },
    duoSinModulosAltos: { activa: true },
    luzBaseSoloEnAltos: { activa: true },
    alturaNoEstandar: { activa: true }
};

// Nomenclaturas que identifican cada coleccion dentro del codigo.
const COLECCIONES_POR_NOMENCLATURA = [
    { nombre: "Loft", prueba: partes => partes[0] === "MET" || partes.includes("LOFT") },
    { nombre: "Mozione", prueba: partes => partes[0] === "MZ" },
    { nombre: "Cubik Living", prueba: partes => partes.some(p => /^CB[1-5]X$|^CB[AB]\d/.test(p)) },
    { nombre: "Duo", prueba: (partes, cod) => /DUO/.test(cod) },
    { nombre: "Henzo", prueba: (partes, cod, linea) => /HZ/.test(cod) || /HZ/.test(linea) },
    { nombre: "Curcu", prueba: partes => partes.includes("CU") || partes[0] === "CU" },
    { nombre: "Line", prueba: (partes, cod, linea) => partes.includes("LIN") || partes.includes("LINE") || /^[A-Z]ULI/.test(linea) },
    { nombre: "Shaker 2.0", prueba: (partes, cod, linea) => partes.includes("CT") || /^[A-Z]UCO/.test(linea) },
    { nombre: "Cuatro", prueba: (partes, cod, linea) => /^[A-Z]UQU/.test(linea) },
    { nombre: "Aurora", prueba: (partes, cod, linea) => partes.includes("AU") || partes.some(p => /-AU$/.test(p)) || /^[A-Z]UAU/.test(linea) }
];

// Alturas modulares estandar; cualquier otra H se considera especial.
const ALTURAS_ESTANDAR = ["H1", "H2", "H3", "H4", "H5", "H6", "H7", "HE", "H8", "H9", "H11", "H12", "H886", "H2246", "H2436"];

// Devuelve el nombre de la coleccion detectada o "" si es estandar.
// linea: columna "linea" del despiece (KUHZ+MV, KUCO+EV...), si existe.
function detectarColeccion(cod, linea = "") {
            const codigo = String(cod || "").toUpperCase().trim();
            const lineaBase = String(linea || "").toUpperCase().split("+")[0];
            const partes = codigo.split(/[-+]/).filter(Boolean);
            const encontrada = COLECCIONES_POR_NOMENCLATURA.find(coleccion => coleccion.prueba(partes, codigo, lineaBase));
            return encontrada ? encontrada.nombre : "";
        }

// Revisa el codigo contra las reglas de coleccion y devuelve avisos y notas.
// opciones.linea: linea del despiece; opciones.incluirNotasAltura: solo en el consultor.
function obtenerAvisosColeccion(cod, opciones = {}) {
            const codigo = normalizarSinPuerta(String(cod || "").toUpperCase().trim());
            const avisos = [];
            const notas = [];
            if (!codigo) return { coleccion: "", avisos, notas };

            const coleccion = detectarColeccion(codigo, opciones.linea);
            const dims = obtenerDimensionesModulo(codigo);
            const tipo = dims.tipo || "";
            const ancho = dims.ancho || 0;
            const lectura = interpretarCodigoModulo(codigo).join(" + ").toUpperCase();
            const esModuloConFrente = ["B", "A", "S", "BS", "X"].includes(tipo);
            const sinPuertas = lectura.includes("SIN PUERTA");
            const tieneGavetas = /\bGAVETA/.test(lectura);
            const unaPuerta = /APERTURA (IZQUIERDA|DERECHA)/.test(lectura);

            // Excepciones vistas en produccion: puerta ancha, fregaderos y auxiliares de puertas fraccionadas.
            const principal = separarCodigoPrincipalYAccesorios(codigo).principal;
            const esPuertaAncha = /PTA?[- ]?ANCHA/.test(codigo);
            const esFregadero = /^[A-Z]+[\d.,]+[ID]?(H[\d.,]+)?(P[\d.,]+)?F/.test(principal);
            const esAuxiliar = tipo === "X";

            if (esModuloConFrente && ancho && !sinPuertas && !esPuertaAncha && !esAuxiliar) {
                const reglaGavetas = REGLAS_COLECCION.anchoMaximoGavetas;
                const reglaUna = REGLAS_COLECCION.anchoMaximoUnaPuerta;
                const reglaDos = REGLAS_COLECCION.anchoMaximoDosPuertas;

                if (tieneGavetas && !esFregadero && reglaGavetas.activa && ancho > reglaGavetas.maximo) {
                    avisos.push(`Modulo de gavetas de ${ancho / 10} cm: el maximo es ${reglaGavetas.maximo / 10} cm.`);
                } else if (!tieneGavetas && unaPuerta && !esFregadero && reglaUna.activa && ancho > reglaUna.maximo) {
                    avisos.push(`Modulo de 1 puerta de ${ancho / 10} cm: el maximo es ${reglaUna.maximo / 10} cm.`);
                } else if (!tieneGavetas && !unaPuerta && reglaDos.activa && ancho > reglaDos.maximo) {
                    avisos.push(ancho > reglaDos.maximoConRefuerzo
                        ? `Modulo de 2 puertas de ${ancho / 10} cm: supera el maximo de ${reglaDos.maximoConRefuerzo / 10} cm incluso con refuerzo.`
                        : `Modulo de 2 puertas de ${ancho / 10} cm: el maximo es ${reglaDos.maximo / 10} cm; hasta ${reglaDos.maximoConRefuerzo / 10} cm solo con refuerzo adicional.`);
                }
            }

            if (REGLAS_COLECCION.duoSinModulosAltos.activa && coleccion === "Duo" && tipo === "A") {
                avisos.push("La coleccion Duo no tiene modulos altos.");
            }

            // LBA se usa en altos, repisas, tapas y botelleros; solo se avisa en modulos bajos.
            if (REGLAS_COLECCION.luzBaseSoloEnAltos.activa && tieneTokenCodigo(codigo, "LBA") && ["B", "MB", "MBS", "BS"].includes(tipo)) {
                avisos.push("Luz LED base (LBA) es una opcion de modulos altos.");
            }

            if (REGLAS_COLECCION.alturaNoEstandar.activa && opciones.incluirNotasAltura) {
                const alturaCodigo = (separarCodigoPrincipalYAccesorios(codigo).principal.match(/H(E|\d+(?:[.,]\d+)?)/) || [])[0];
                if (alturaCodigo && !ALTURAS_ESTANDAR.includes(alturaCodigo.replace(",", "."))) {
                    notas.push(`Altura ${alturaCodigo} fuera del sistema modular estandar (medida especial).`);
                }
            }

            if (coleccion === "Loft") notas.push("Loft: no se modifican medidas de la estructura metalica.");

            return { coleccion, avisos, notas };
        }
