// generador_despiece.js
// Genera el despiece de un modulo a partir de su codigo.
// Las MEDIDAS salen del mismo motor que usa el validador (reglas_validacion.js),
// asi el despiece generado siempre pasa la validacion.
// Las RECETAS (que piezas y cuantas) se aprendieron de 20 semanas de produccion real.

// Nombre legible de cada pieza.
const DESCRIPCION_PIEZAS = {
    LATI: "Lateral izquierdo", LATD: "Lateral derecho",
    "LATI-HZ": "Lateral izquierdo Henzo", "LATD-HZ": "Lateral derecho Henzo",
    BAS: "Base", "BAS-TI": "Base con tiradera interna", TEC: "Techo",
    AJP: "Ajuste AJP", AJPS: "Ajuste AJPS", AJF: "Ajuste AJF", AJPI: "Ajuste AJPI",
    RESP: "Respaldo", REPMM: "Repisa movil", REPMP: "Repisa movil", REPF: "Repisa fija",
    MALE: "Maletera", PT: "Puerta", FC: "Frente de cajon",
    LDD: "Lateral decorativo derecho", LDI: "Lateral decorativo izquierdo",
    ZAPAP: "Zapatera", ZPIN: "Zapatero inclinado", LTE3: "Lateral torre de cajones",
    "D-LATI": "Lateral izquierdo (vestidor)", "D-LATD": "Lateral derecho (vestidor)"
};

const NOMBRE_SISTEMA = { SS: "Slim", SB: "SB", SM: "Metabox", SL: "Legrabox", SI: "Sistema invisible", MRV: "Merivobox" };

// Cantos mas usados por pieza en produccion (L1, L2, C1, C2).
const CANTOS_TIPICOS = {
    LATI: [0, 0, 1, 0], LATD: [0, 0, 1, 0], "LATI-HZ": [0, 0, 2, 2], "LATD-HZ": [0, 0, 2, 2],
    BAS: [0, 0, 2, 0], "BAS-TI": [0, 0, 1, 0], TEC: [0, 0, 1, 0],
    AJP: [0, 0, 0, 0], AJPS: [0, 0, 2, 0], AJF: [0, 0, 2, 0], AJPI: [0, 0, 2, 0],
    RESP: [0, 0, 0, 0], REPMM: [0, 0, 2, 2], REPMP: [0, 0, 2, 2], REPF: [0, 0, 1, 0], MALE: [0, 0, 1, 0],
    PT: [0, 0, 2, 2], FC: [0, 0, 2, 2],
    "D-LATI": [0, 0, 1, 0], "D-LATD": [0, 0, 1, 0], ZAPAP: [0, 0, 1, 0], ZPIN: [0, 0, 1, 0], LTE3: [0, 0, 1, 0],
    "FON-SS": [0, 0, 0, 0], "POS-SS": [0, 0, 2, 0], "FRI-SS": [0, 0, 2, 2],
    "FON-MRV": [0, 0, 0, 0], "POS-MRV": [0, 0, 2, 0],
    "FON-SM": [0, 0, 0, 0], "POS-SM": [0, 0, 2, 0], "FRI-SM": [0, 0, 2, 0],
    "FON-SB": [0, 0, 0, 0], "POS-SB": [2, 0, 0, 0], "FRI-SB": [0, 0, 2, 2],
    "FON-SL": [0, 0, 0, 0], "POS-SL": [0, 0, 2, 0], "FON-SI": [0, 0, 0, 0], "POS-SI": [0, 0, 0, 2]
};

// Repisas segun altura del modulo (produccion real).
const REPISAS_ALTOS_POR_ALTURA = { 380: 0, 570: 1, 760: 2, 950: 2, 1140: 2, 1330: 3 };

// Alturas de posicion de gaveta por sistema y cantidad de gavetas.
const POSICIONES_GAVETA = {
    SS: { 1: [199], 2: [199, 199], 3: [101, 101, 199], 4: [101, 101, 101, 101], "2IN": [63, 300], "3IN": [63, 101, 199] },
    MRV: { 1: [184], 2: [184, 184], 3: [83, 83, 184], 4: [83, 83, 83, 83] },
    SM: { 1: [199], 2: [71, 199], 3: [71, 71, 199], 4: [71, 71, 71, 71] },
    SB: { 1: [199], 2: [100, 199], 3: [100, 100, 199], 4: [70, 70, 100, 100] },
    SL: { 1: [148], 2: [63, 148], 3: [63, 63, 148], 4: [63, 63, 63, 63] },
    SI: { 1: [105], 2: [105, 105], 3: [105, 105, 105], 4: [105, 105, 105, 105] }
};
const FONDO_METABOX = { 1: [498], 2: [483, 498], 3: [483, 483, 498], 4: [483, 483, 483, 498] };

// Comodin de closet (CM) por sistema: altura de posicion, friso del frente interno,
// alto del frente de cajon y laterales de torre LTE3 (aprendido de produccion).
const COMODIN_POR_SISTEMA = {
    SS: { posicion: 63, posicionRepisero: 101, friso: "FRI-SB", frente: 140, frenteRepisero: 143, lte3: true },
    SB: { posicion: 100, posicionRepisero: 100, friso: "FRI-SB", frente: 175, frenteRepisero: 175, lte3: false },
    SI: { posicion: 105, posicionRepisero: 105, friso: "FRI-SI", frente: 175, frenteRepisero: 175, lte3: true, lte3Medida: [760, 518] }
};

// Altura de frentes de cajon para bajos H4 (760).
const FRENTES_CAJON_H4 = { G1: [757], G2: [342, 342], G3: [170, 170, 342], G4: [187, 187, 187, 187], G2IN: [722], G3IN: [342, 342] };

// Lee del codigo lo que necesita la receta.
// linea: columna "linea" del despiece (KUHZ+MV, MCU+LM...), opcional.
function analizarCodigoParaDespiece(cod, linea = "") {
            const codigo = normalizarSinPuerta(String(cod || "").toUpperCase().trim());
            const dims = obtenerDimensionesModulo(codigo);
            const partes = codigo.split(/[-+]/).filter(Boolean);
            const principal = separarCodigoPrincipalYAccesorios(codigo).principal;
            const lectura = interpretarCodigoModulo(codigo).join(" + ").toUpperCase();
            // Gavetas en el codigo principal (B60G3) o como accesorio (B60H4-G3).
            const tokenGavetas = partes.find(p => /^G\d(IN)?$/.test(p)) || "";
            const gavetas = Number((principal.match(/G(\d)/) || tokenGavetas.match(/G(\d)/) || [])[1] || 0);
            const sistemaToken = partes.find(p => ["SS", "SLIM", "SM", "MRV", "SL", "SI", "SB"].includes(p)) || "";
            const sistema = sistemaToken === "SLIM" ? "SS" : sistemaToken;
            const lineaBase = String(linea || "").toUpperCase().split("+")[0];
            const materialFrente = String(linea || "").toUpperCase().split("+")[1] || "";

            return {
                codigo,
                dims,
                tipo: dims.tipo || "",
                gavetas,
                gavetaInterna: (/G\dIN|IN(?![A-Z])/.test(principal) || /IN$/.test(tokenGavetas)) && gavetas > 0,
                sistema,
                henzo: partes.includes("HZ") || /HZ/.test(codigo) || /HZ/.test(lineaBase),
                lineaBase,
                materialFrente,
                // Lineas modulares/closet (MCU, MOU, CU, VU) llaman REPMP a la repisa movil; cocina y bano REPMM.
                nombreRepisaMovil: /^(M|C|V)/.test(lineaBase) ? "REPMP" : "REPMM",
                closetMou: /^MOU/.test(lineaBase),
                tiraderaInterna: partes.includes("TI"),
                fregadero: /^[A-Z]+[\d.,]+[ID]?(H[\d.,]+)?(P[\d.,]+)?F(?!F)/.test(principal),
                sinPuertas: lectura.includes("SIN PUERTA"),
                repisero: /[\d.]R(?![A-Z])|RP\d|[\d.]R[SP-]|C\dR/.test(principal) || /^(CL|CM)[\d.]+[ID]?(H\d+)?R/.test(principal),
                colgador: /C[12]/.test(principal),
                colgadorSimple: /C1/.test(principal),
                zapatero: /ZH/.test(principal),
                frenteInterno: /FI/.test(principal) || partes.includes("FI"),
                // Closets abiertos (S/P) usan laterales D-LATI / D-LATD (menos linea MOU);
                // en vestidor VU tambien los de puerta de aluminio (AL).
                lateralVestidor: (codigo.includes("S/P") && !/^MOU/.test(lineaBase)) || (/^VU/.test(lineaBase) && /AL/.test(principal)),
                lectura
            };
        }

// Arma la lista de piezas (receta) sin medidas.
function recetaModulo(info, opciones) {
            const lista = [];
            const agregar = (pieza, cant, extra = {}) => { if (cant > 0) lista.push({ pieza, cant, ...extra }); };
            const { tipo, dims } = info;
            // Laterales Henzo, salvo gavetas de la linea MCUHZ (van con laterales normales).
            const usaLateralHenzo = info.henzo && ["B", "MB", "MBS", "EB"].includes(tipo) && !(info.gavetas && /^MCU/.test(info.lineaBase));
            const latI = usaLateralHenzo ? "LATI-HZ" : info.lateralVestidor && ["CL", "CM", "ECL"].includes(tipo) ? "D-LATI" : "LATI";
            const repisaMovil = info.nombreRepisaMovil;
            const latD = latI.replace("LATI", "LATD");
            const casco = () => { agregar(latI, 1); agregar(latD, 1); };

            if (tipo === "BS" || tipo === "BSCL") {
                // Bastidor: 2 bases (arriba/abajo) y 2 laterales.
                casco();
                agregar("BAS", 2);
            } else if (["B", "MB", "EB"].includes(tipo)) {
                casco();
                agregar("BAS", 1);
                if (info.fregadero) {
                    agregar("AJP", 1, { alturaAjuste: 150 });
                    agregar("AJPS", 1, { alturaAjuste: 60 });
                    agregar("AJF", 1, { alturaAjuste: 80 });
                    agregar("AJPI", 1, { alturaAjuste: 150 });
                } else {
                    agregar("AJP", 1, { alturaAjuste: 60 });
                    agregar("AJPS", 1, { alturaAjuste: 60 });
                    agregar("AJF", 1, { alturaAjuste: 60 });
                    agregar("RESP", 1);
                    if (!info.gavetas && dims.alto >= 760) agregar(repisaMovil, 1);
                }
            } else if (tipo === "MBS") {
                casco();
                agregar("BAS", 1);
                agregar("AJP", 1, { alturaAjuste: 60 });
                agregar("AJPS", 1, { alturaAjuste: 60 });
                agregar("AJF", 1, { alturaAjuste: 60 });
                agregar("AJPI", 1, { alturaAjuste: 100 });
                if (info.gavetas) agregar("RESP", 1);
            } else if (["A", "EA", "S", "ES"].includes(tipo)) {
                casco();
                agregar(info.tiraderaInterna ? "BAS-TI" : "BAS", 1);
                agregar("TEC", 1);
                agregar("AJP", dims.alto >= 950 ? 2 : 1, { alturaAjuste: 60 });
                agregar("RESP", 1);
                if (!info.gavetas) agregar(repisaMovil, REPISAS_ALTOS_POR_ALTURA[dims.alto] ?? Math.max(0, Math.round(dims.alto / 400)));
            } else if (tipo === "X") {
                casco();
                agregar("BAS", 1);
                agregar("TEC", 1);
                agregar("AJP", 2, { alturaAjuste: 60 });
                agregar("RESP", 1);
                if (!info.gavetas) {
                    agregar("REPF", 1);
                    agregar(repisaMovil, dims.alto >= 2120 ? 5 : Math.max(0, Math.round(dims.alto / 400) - 1));
                }
            } else if (["CL", "CM", "ECL"].includes(tipo)) {
                // Closets (produccion real): casco 15, maletera/repisas/zapatera 18.
                casco();
                agregar("BAS", 1);
                agregar("TEC", 1);
                agregar("AJP", 2, { alturaAjuste: 60 });
                agregar("RESP", 1);
                // C2 (dos tubos) en altura 2120 no lleva maletera: no queda espacio.
                const sinMaletera = /C2/.test(info.codigo) && dims.alto - (info.closetMou ? 70 : 0) <= 2120;
                if (!sinMaletera) agregar("MALE", 1);
                if (info.zapatero) agregar("ZPIN", 7);
                else if (info.repisero) agregar("REPMP", tipo === "CM" ? 2 : 4);
                else if (info.colgadorSimple && tipo !== "CM") agregar("ZAPAP", 1);
                if (tipo === "CM") {
                    // Comodin: repisa fija sobre 4 gavetas (Slim por defecto).
                    agregar("REPF", 1);
                    const sistema = COMODIN_POR_SISTEMA[info.sistema] ? info.sistema : "SS";
                    const reglaCm = COMODIN_POR_SISTEMA[sistema];
                    // Slim: posicion 63 con frente interno o colgador C1; 101 en repisero sin FI.
                    const alturaPosicion = info.frenteInterno || info.colgadorSimple ? reglaCm.posicion : reglaCm.posicionRepisero;
                    for (let i = 0; i < 4; i++) {
                        agregar(`FON-${sistema}`, 1);
                        agregar(`POS-${sistema}`, 1, { alturaSistema: alturaPosicion });
                        // Friso del frente interno (en Slim sale como FRI-SB).
                        if (info.frenteInterno) agregar(reglaCm.friso, 1, { alturaSistema: 135, medidaComo: `FRI-${sistema}` });
                    }
                    if (info.frenteInterno && reglaCm.lte3) {
                        // Laterales de la torre de cajones (medida aprendida, no depende del ancho).
                        const nota = "medida aprendida de produccion, por confirmar";
                        if (reglaCm.lte3Medida) agregar("LTE3", 2, { medidaFija: reglaCm.lte3Medida, nota });
                        else if (dims.alto >= 2310) agregar("LTE3", 1, { medidaFija: [727, 472], espesorFijo: 36, nota });
                        else agregar("LTE3", 2, { medidaFija: [757, 502], nota });
                    } else if (!info.frenteInterno && opciones.incluirFrentes) {
                        agregar("FC", 4, { alturaFrente: info.colgadorSimple ? reglaCm.frente : reglaCm.frenteRepisero, nota: "altura aprendida de produccion, por confirmar" });
                    }
                }
            } else {
                return null;
            }

            // Piezas del sistema de gavetas (el comodin CM ya las agrego arriba).
            if (info.gavetas && info.sistema && tipo !== "CM") {
                const tabla = POSICIONES_GAVETA[info.sistema] || {};
                const alturas = (info.gavetaInterna && tabla[`${info.gavetas}IN`]) || tabla[info.gavetas] || [];
                alturas.forEach((altura, i) => {
                    const fondo = info.sistema === "SM" ? FONDO_METABOX[info.gavetas][i] : null;
                    agregar(`FON-${info.sistema}`, 1, { alturaSistema: fondo });
                    agregar(`POS-${info.sistema}`, 1, { alturaSistema: altura });
                });
                if (info.sistema === "SM") agregar("FRI-SM", 1);
            }

            // Frentes (solo cuando los frentes van en melamina y en este despiece).
            if (opciones.incluirFrentes && !info.sinPuertas && !(tipo === "CM" && !info.frenteInterno)) {
                if (info.gavetas && tipo !== "CM") {
                    const claveFrentes = `G${info.gavetas}${info.gavetaInterna ? "IN" : ""}`;
                    const alturas = dims.alto === 760 ? FRENTES_CAJON_H4[claveFrentes] : null;
                    if (alturas) alturas.forEach(altura => agregar("FC", 1, { alturaFrente: altura }));
                    else {
                        // Sin tabla para esta altura: reparte el alto en partes iguales con 3 mm de luz.
                        const altura = Math.floor((dims.alto - 3 * info.gavetas) / info.gavetas);
                        agregar("FC", info.gavetas, { alturaFrente: altura, nota: "Altura de frente estimada (solo hay reparto real para H4)." });
                    }
                } else {
                    agregar("PT", 1, { puertas: true });
                }
            }

            return lista;
        }

// Calcula largo x ancho de una pieza con el motor del validador.
function calcularMedidasGeneradas(item, modulo) {
            const regla = validarMedidasPieza(item.pieza, 1, 1, modulo);
            const objetivos = (regla && regla.objetivos) || [];

            if (item.medidaFija) {
                return { largo: item.medidaFija[0], ancho: item.medidaFija[1], formula: "medida fija aprendida de produccion" };
            }

            if (/^(FON|POS|FRI)-/.test(item.pieza)) {
                const sistema = medidasSistemaGaveta(item.medidaComo || item.pieza, modulo);
                if (!sistema) return null;
                return { largo: sistema.anchos[0], ancho: item.alturaSistema || sistema.alturas[0], formula: `ancho interno - ${sistema.anchos.length > 1 ? sistema.descuento.split(" o ")[0] : sistema.descuento}` };
            }

            if (item.pieza === "FC") {
                return { largo: modulo.ancho - 3, ancho: item.alturaFrente || 0, formula: "ancho - 3 (1.5 mm por lado)" };
            }

            if (objetivos.length < 1) return null;
            const largo = objetivos[0];
            const ancho = /^AJ/.test(item.pieza) ? (item.alturaAjuste || objetivos[1]) : objetivos[1];
            if (!largo || !ancho) return null;

            return { largo, ancho, formula: String(regla.mensaje || "").replace(/^deberia (medir|tener)\s*/, "") };
        }

// Genera el despiece completo de un codigo.
// opciones: { grosorCasco, grosorRespaldo, grosorRepisas, grosorFrentes, incluirFrentes, cantidad }
function generarDespiece(cod, opciones = {}) {
            const op = {
                // Closets siempre casco 15; cocina y bano 18 (si no se indica otro).
                grosorCasco: Number(opciones.grosorCasco) || (/^(CL|CM|ECL)$/.test(obtenerDimensionesModulo(normalizarSinPuerta(String(cod || "").toUpperCase())).tipo || "") ? 15 : 18),
                grosorRespaldo: Number(opciones.grosorRespaldo) || 6,
                grosorRepisas: Number(opciones.grosorRepisas) || 18,
                grosorFrentes: Number(opciones.grosorFrentes) || 18,
                incluirFrentes: opciones.incluirFrentes !== undefined
                    ? opciones.incluirFrentes !== false
                    : !/^(LM|LZ|LB|EV|TM)$/.test(String(opciones.linea || "").toUpperCase().split("+")[1] || ""),
                cantidad: Math.max(1, Number(opciones.cantidad) || 1)
            };
            const info = analizarCodigoParaDespiece(cod, opciones.linea);
            const avisos = [];

            if (!info.dims.ancho || !info.dims.alto) {
                return { codigo: info.codigo, info, piezas: [], avisos: ["No pude leer ancho y alto de este codigo."] };
            }

            const receta = recetaModulo(info, op);
            if (!receta) {
                return { codigo: info.codigo, info, piezas: [], avisos: [`Todavia no hay receta para el tipo "${info.tipo}".`] };
            }

            if (info.gavetas && !info.sistema) avisos.push("El codigo tiene gavetas pero no indica sistema (SLIM, SM, MRV, SL, SI, SB): no se generan fondos ni posiciones.");
            if (info.fregadero) avisos.push("Fregadero: sin respaldo por conexiones de agua (regla de produccion).");

            if (!op.incluirFrentes) avisos.push("Frentes no incluidos (van en otro proceso: laca, enchape, vidrio...).");

            // Mismo objeto modulo que arma el validador (closets MOU: estructura 70 mm mas baja).
            const esClosetMou = info.closetMou && ["CL", "CM"].includes(info.tipo);
            if (esClosetMou) avisos.push("Closet linea MOU: estructura 70 mm mas baja que el codigo.");
            const modulo = {
                ancho: info.dims.ancho,
                alto: info.dims.alto - (esClosetMou ? 70 : 0),
                profundidad: info.dims.profundidadEstructura || info.dims.profundidad,
                profundidadTotal: info.dims.profundidad,
                grosor: op.grosorCasco,
                grosorRespaldo: op.grosorRespaldo,
                anchoInterno: info.dims.ancho - op.grosorCasco * 2 - 1,
                tieneTpm: false,
                contextoOrejas: {},
                contextoFrenteFalso: {},
                tipo: info.tipo,
                linea: info.henzo ? (info.lineaBase || "HZ") : info.lineaBase,
                cod: info.codigo
            };

            const espesorDe = pieza => {
                if (pieza === "RESP") return op.grosorRespaldo;
                // Repisas, maletera, zapateras y frisos de gaveta van en el grosor de repisas (18).
                if (/^REP|^MALE|^ZAP|^ZPIN|^FRI-/.test(pieza)) return op.grosorRepisas;
                if (/^(PT|FC)$/.test(pieza)) return op.grosorFrentes;
                if (/^(FON|POS|FRI)-/.test(pieza)) return op.grosorCasco;
                return op.grosorCasco;
            };

            const piezas = [];
            receta.forEach(item => {
                // Puertas: 1 o 2 segun el motor (ancho > 619 = 2 puertas; abatible = 1).
                let cant = item.cant;
                if (item.puertas) {
                    const regla = validarMedidasPieza("PT", 1, 1, modulo);
                    const anchoPuerta = regla.objetivos && regla.objetivos[1];
                    cant = anchoPuerta && anchoPuerta < info.dims.ancho / 2 ? 2 : 1;
                }

                const medidas = calcularMedidasGeneradas(item, modulo);
                if (!medidas) {
                    avisos.push(`No hay regla de medida para ${item.pieza}.`);
                    return;
                }

                // Lateral decorativo: LDD / LDI reemplazan al lateral de ese lado.
                let nombrePieza = item.pieza;
                if (/LATD$/.test(item.pieza) && tieneTokenCodigo(info.codigo, "LDD")) nombrePieza = "LDD";
                if (/LATI$/.test(item.pieza) && tieneTokenCodigo(info.codigo, "LDI")) nombrePieza = "LDI";

                piezas.push({
                    pieza: nombrePieza,
                    descripcion: DESCRIPCION_PIEZAS[nombrePieza] || descripcionPiezaSistema(nombrePieza),
                    cant: cant * op.cantidad,
                    largo: Math.round(medidas.largo * 10) / 10,
                    ancho: Math.round(medidas.ancho * 10) / 10,
                    espesor: item.espesorFijo || espesorDe(item.pieza),
                    cantos: CANTOS_TIPICOS[item.pieza] || [0, 0, 0, 0],
                    formula: medidas.formula,
                    nota: item.nota || ""
                });
            });

            // Agrupa piezas iguales (mismo codigo y medidas).
            const agrupadas = [];
            piezas.forEach(p => {
                const igual = agrupadas.find(x => x.pieza === p.pieza && x.largo === p.largo && x.ancho === p.ancho);
                if (igual) igual.cant += p.cant;
                else agrupadas.push({ ...p });
            });

            return { codigo: info.codigo, info, modulo, piezas: agrupadas, avisos };
        }

function descripcionPiezaSistema(pieza) {
            const match = String(pieza).match(/^(FON|POS|FRI)-(\w+)$/);
            if (!match) return pieza;
            const nombres = { FON: "Fondo de gaveta", POS: "Posicion de gaveta", FRI: "Friso de gaveta" };
            return `${nombres[match[1]]} ${NOMBRE_SISTEMA[match[2]] || match[2]}`;
        }

// Revisa el despiece generado con las mismas reglas del validador.
function verificarDespieceGenerado(resultado) {
            if (!resultado.modulo) return { ok: false, fallas: [] };
            const fallas = [];
            resultado.piezas.forEach(p => {
                const regla = validarMedidasPieza(p.pieza, p.largo, p.ancho, resultado.modulo);
                if (regla.valida && !regla.ok) fallas.push(`${p.pieza}: ${regla.mensaje}`);
            });
            return { ok: fallas.length === 0, fallas };
        }
