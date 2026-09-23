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
    LDD: "Lateral decorativo derecho (18 mm)", LID: "Lateral decorativo izquierdo (18 mm)",
    "FRI-SLIM": "Friso frente interno Slim", "FRI-ZAP-SI": "Friso zapatero sistema invisible", "COS-SI": "Costado cajon sistema invisible",
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
    // Reparto mas frecuente en produccion real (38 semanas).
    MRV: { 1: [184], 2: [184, 184], 3: [83, 83, 184], 4: [83, 83, 83, 184], "2IN": [83, 300], "3IN": [83, 83, 184] },
    SM: { 1: [103], 2: [71, 199], 3: [71, 103, 199], 4: [71, 71, 103, 103], "2IN": [71, 199], "3IN": [71, 103, 199] },
    SB: { 1: [199], 2: [199, 199], 3: [70, 100, 199], 4: [100, 100, 100, 100], "2IN": [70, 199], "3IN": [70, 100, 199] },
    SL: { 1: [148], 2: [148, 148], 3: [63, 63, 148], 4: [63, 63, 63, 148], "2IN": [63, 148], "3IN": [63, 63, 148] },
    SI: { 1: [65], 2: [65, 65], 3: [105, 105, 185], 4: [105, 105, 105, 105] }
};
// Alto del fondo por sistema cuando no es el primero de la tabla del validador.
const FONDO_METABOX = { 1: [498], 2: [483, 498], 3: [483, 498, 498], 4: [483, 483, 498, 498] };
const FONDO_MERIVOBOX = { 1: [474], 2: [474, 474], 3: [474, 474, 474], 4: [474, 474, 474, 474] };

// Comodin de closet (CM) por sistema: altura de posicion, friso del frente interno,
// alto del frente de cajon y laterales de torre LTE3 (aprendido de produccion).
const COMODIN_POR_SISTEMA = {
    // posicionMcu: lineas MCU/MCUV; posicion: resto de lineas.
    SS: { posicionMcu: 63, posicion: 101, lte3: true },
    SB: { posicionMcu: 100, posicion: 100, lte3: false },
    SI: { posicionMcu: 105, posicion: 105, lte3: true }
};

// Comodin (CM): repisa fija sobre la cajonera.
// Con frente interno (FI, lleva puerta) va un engrosado LTE3 de 36 mm al lado de los cajones:
// ancho para cajones = ancho - 15 - 15 - 36 - 1 (desde 800 mm, dos engrosados).
function agregarComodin(info, opciones, agregar) {
            const { dims } = info;
            const sistema = COMODIN_POR_SISTEMA[info.sistema] ? info.sistema : "SS";
            const regla = COMODIN_POR_SISTEMA[sistema];
            const lineaMcu = /^MCU/.test(info.lineaBase);
            const cajonesZapato = Number((info.codigo.match(/G\dZ(\d)/) || [])[1] || 0);
            const cajones = info.gavetas === 6 ? 6 : cajonesZapato ? info.gavetas : 4;
            const engrosados = info.frenteInterno && regla.lte3 ? (dims.ancho >= 800 ? 2 : 1) : 0;

            agregar("REPF", 1);

            // Posiciones: G6 sin FI lleva 2 cajones bajos (63) y 4 normales.
            const alturaPos = lineaMcu ? regla.posicionMcu : regla.posicion;
            const alturasPos = sistema === "SS" && cajones === 6 && !info.frenteInterno && !lineaMcu
                ? [63, 63, 101, 101, 101, 101]
                : Array(cajones).fill(alturaPos);
            alturasPos.forEach(altura => {
                agregar(`FON-${sistema}`, 1);
                agregar(`POS-${sistema}`, 1, { alturaSistema: altura });
                if (sistema === "SI") agregar("COS-SI", 2, { medidaFija: [490, 120] });
            });
            for (let i = 0; i < cajonesZapato; i++) {
                agregar(`FON-${sistema}`, 1);
                agregar(`POS-${sistema}`, 1, { medidaFija: null, alturaSistema: 60 });
                if (sistema === "SI") agregar("COS-SI", 2, { medidaFija: [490, 60] });
            }

            if (info.frenteInterno) {
                // Friso del frente interno: MCU lo nombra FRI-SB; las demas lineas FRI-SLIM (3 mm mas ancho).
                const nombreFriso = sistema === "SI" ? "FRI-SI" : sistema === "SB" || lineaMcu ? "FRI-SB" : "FRI-SLIM";
                const extraFriso = nombreFriso === "FRI-SB" ? 0 : 3;
                const altosFriso = cajones === 6 ? [116, 116, 135, 135, 135, 135] : Array(cajones).fill(135);
                altosFriso.forEach(alto => agregar(nombreFriso, 1, { alturaSistema: alto, medidaComo: `FRI-${sistema === "SI" ? "SS" : sistema}`, extraAncho: extraFriso }));
                if (cajonesZapato) agregar("FRI-ZAP-SI", 1, { alturaSistema: 150, medidaComo: "FRI-SS", extraAncho: 3 });

                if (engrosados) {
                    const nota = "engrosado 36 mm junto a los cajones (lado segun apertura)";
                    const alto = cajones === 6 ? 1027 : 727;
                    if (lineaMcu) agregar("LTE3", engrosados, { medidaFija: [alto, 472], espesorFijo: 36, nota });
                    else if (dims.alto >= 2310) agregar("LTE3", engrosados, { medidaFija: [alto, 488], espesorFijo: 36, nota });
                    else agregar("LTE3", engrosados * 2, { medidaFija: [760, 518], espesorFijo: 18, nota: `${nota}: 2 piezas de 18 pegadas` });
                }
            } else if (opciones.incluirFrentes) {
                // Frentes de cajon: 187 normal, 143 con -ST (140 con -TC-NE), 175 en sistema SB.
                const nota = "altura aprendida de produccion";
                const frente = sistema === "SB" ? 175 : /-ST\b|-ST-/.test(info.codigo + "-") ? (/TC-NE/.test(info.codigo) ? 140 : 143) : 187;
                if (cajones === 6) {
                    agregar("FC", 2, { alturaFrente: 143, nota });
                    agregar("FC", 4, { alturaFrente: 187, nota });
                } else {
                    agregar("FC", cajones, { alturaFrente: frente, nota });
                }
            }
        }

// Altura de frentes de cajon para bajos H4 (760).
const FRENTES_CAJON_H4 = { G1: [757], G2: [342, 342], G3: [170, 170, 342], G4: [187, 187, 187, 187], G2IN: [722], G3IN: [342, 342] };

// Lee del codigo lo que necesita la receta.
// linea: columna "linea" del despiece (KUHZ+MV, MCU+LM...), opcional.
function analizarCodigoParaDespiece(cod, linea = "") {
            // Espacios se toman como guion: "B60H4G3 mrv" = "B60H4G3-MRV".
            const codigo = normalizarSinPuerta(String(cod || "").toUpperCase().trim().replace(/\s+/g, "-"));
            const dims = obtenerDimensionesModulo(codigo);
            const partes = codigo.split(/[-+]/).filter(Boolean);
            const principal = separarCodigoPrincipalYAccesorios(codigo).principal;
            const lectura = interpretarCodigoModulo(codigo).join(" + ").toUpperCase();
            // Gavetas en el codigo principal (B60G3) o como accesorio (B60H4-G3).
            const tokenGavetas = partes.find(p => /^G\d(IN|Z\d)?(H[\d.]+)?S?(SLIM|MRV|SIAL|SI|SB|SM|SL|SS)?$/.test(p)) || "";
            const gavetas = Number((principal.match(/G(\d)/) || tokenGavetas.match(/G(\d)/) || [])[1] || 0);
            // Sistema como accesorio (-SLIM, -MRV) o pegado a la gaveta (G2SLIM, G1H26SMRV, G3SI).
            const sistemaToken = partes.find(p => ["SS", "SLIM", "SM", "MRV", "SL", "SI", "SIAL", "SB"].includes(p))
                || (codigo.match(/G\d(?:IN)?(?:H[\d.]+)?S?(SLIM|MRV|SIAL|SI|SB|SM|SL|SS)(?![A-Z])/) || [])[1]
                || "";
            // SIAL = sistema invisible con frente de aluminio.
            const sistema = sistemaToken === "SLIM" ? "SS" : sistemaToken === "SIAL" ? "SI" : sistemaToken;
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
                lateralVestidor: codigo.includes("S/P") && !/^MOU/.test(lineaBase),
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
                // "+R158" / "+R202" al final del codigo: 3 repisas adicionales.
                else if (info.repisero) agregar("REPMP", (tipo === "CM" ? 2 : 4) + (/\+R\d+/.test(info.codigo) ? 3 : 0));
                else if (info.colgadorSimple && tipo !== "CM") agregar("ZAPAP", 1);
                if (tipo === "CM") agregarComodin(info, opciones, agregar);
            } else {
                return null;
            }

            // Piezas del sistema de gavetas (el comodin CM ya las agrego arriba).
            if (info.gavetas && info.sistema && tipo !== "CM") {
                const tabla = POSICIONES_GAVETA[info.sistema] || {};
                const alturas = (info.gavetaInterna && tabla[`${info.gavetas}IN`]) || tabla[info.gavetas] || [];
                alturas.forEach((altura, i) => {
                    const fondo = info.sistema === "SM" ? (FONDO_METABOX[alturas.length] || [])[i]
                        : info.sistema === "MRV" ? (FONDO_MERIVOBOX[alturas.length] || [])[i]
                        // Legrabox en modulos P3: fondo de 260.
                        : info.sistema === "SL" && dims.profundidad && dims.profundidad <= 350 ? 260 : null;
                    agregar(`FON-${info.sistema}`, 1, { alturaSistema: fondo });
                    agregar(`POS-${info.sistema}`, 1, { alturaSistema: altura });
                    // Sistema invisible: 2 costados por cajon, 15 mm mas altos que la posicion.
                    if (info.sistema === "SI") agregar("COS-SI", 2, { medidaFija: [490, altura + 15] });
                });
                // Gaveta interna: friso frontal (Metabox FRI-SM, SB FRI-SB).
                if (info.gavetaInterna && info.sistema === "SM") agregar("FRI-SM", 1);
                if (info.gavetaInterna && info.sistema === "SB") agregar("FRI-SB", 1, { alturaSistema: 100 });
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
                return { largo: sistema.anchos[0] + (item.extraAncho || 0), ancho: item.alturaSistema || sistema.alturas[0], formula: `ancho interno - ${sistema.anchos.length > 1 ? sistema.descuento.split(" o ")[0] : sistema.descuento}${item.extraAncho ? ` + ${item.extraAncho}` : ""}` };
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

            // Laterales decorativos (LDD/LID) de 18: el despiece interno es igual que con 15,
            // pero el modulo terminado crece 3 mm por cada uno.
            const decorativos = ["LDD", "LID", "LDI"].filter(t => tieneTokenCodigo(info.codigo, t)).length;
            if (decorativos && info.dims.ancho) {
                avisos.push(`Lateral decorativo de 18 mm: despiece igual que con 15; medida final del modulo ${info.dims.ancho + 3 * decorativos} mm (${info.dims.ancho} + ${3 * decorativos}).`);
            }
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
                // Fondos, posiciones y costados de cajon van siempre en 15 (produccion real).
                if (/^(FON|POS|COS)-/.test(pieza)) return 15;
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
                if (/LATI$/.test(item.pieza) && (tieneTokenCodigo(info.codigo, "LID") || tieneTokenCodigo(info.codigo, "LDI"))) nombrePieza = "LID";

                piezas.push({
                    pieza: nombrePieza,
                    descripcion: DESCRIPCION_PIEZAS[nombrePieza] || descripcionPiezaSistema(nombrePieza),
                    cant: cant * op.cantidad,
                    largo: Math.round(medidas.largo * 10) / 10,
                    ancho: Math.round(medidas.ancho * 10) / 10,
                    // Laterales decorativos de closet van en 18 mm.
                    espesor: item.espesorFijo || (/^(LDD|LID)$/.test(nombrePieza) ? 18 : espesorDe(item.pieza)),
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
