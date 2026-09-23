// app_lote.js
// Carga del lote completo: despiece de MELAMINA, de LACAS y de HERRAJES del mismo lote.
// Enlaza los tres archivos por OP + codigo de mueble y revisa que cuadren entre si.
// Los tipos se detectan solos por las columnas de cada archivo.

// Archivos cargados por tipo: { nombre, filas }.
const LOTE = { melamina: null, lacas: null, herrajes: null };

// Herrajes agrupados por OP|codigo de mueble.
let HERRAJES_POR_MUEBLE = {};

// Resultado del ultimo cruce entre archivos (para el panel de resumen).
let ENLACE_LOTE = null;

// Columnas canonicas con las que se juntan melamina y lacas en una sola tabla.
const COLUMNAS_CANONICAS = ["op", "Tipo", "cod_mueble", "jov", "cod_pieza", "cant_piezas", "medida1", "medida2", "l1", "l2", "c1", "c2", "nomueble", "material_nombre", "ubicacion", "ubi", "linea"];

// Acabados de frente que van en el despiece de lacas.
const ACABADOS_LACA = /^(LM|LZ|LB|EV|TM|LMZ|EH|MA)$/;

// Tipos de modulo que llevan estructura y frentes.
const TIPOS_CON_FRENTES = ["B", "A", "MB", "MBS", "S", "X", "EB", "EA", "BS", "BSX", "CL", "CM", "ECL", "ES"];

// Palabras que identifican el herraje de cada sistema de gaveta.
const HERRAJE_SISTEMA = { MRV: /MERIVOBOX/i, SS: /SLIM/i, SM: /METABOX/i, SL: /LEGRABOX/i };

// Bisagras por puerta segun el alto de la puerta (38 semanas de produccion).
function bisagrasEsperadas(altoPuerta) {
            if (altoPuerta <= 900) return [2, 2];
            if (altoPuerta <= 1600) return [2, 3];
            if (altoPuerta <= 2000) return [3, 4];
            return [4, 5];
        }

// Clave comun de un mueble entre archivos: OP sin ceros a la izquierda + codigo.
function claveMueble(op, cod) {
            const opTexto = String(op || "").trim();
            const opNormal = /^\d+$/.test(opTexto) ? String(Number(opTexto)) : opTexto;
            // Los especiales vienen como "@ESP#1 CL90R-BF" en herrajes y "CL90R-BF" en el despiece.
            const codigo = String(cod || "").toUpperCase().trim().replace(/^@?ESP#?\d*\s+/, "").replace(/S-P(?=$|-)/g, "S/P");
            return `${opNormal}|${codigo}`;
        }

// Normaliza un encabezado para comparar (sin tildes, espacios ni simbolos).
function normalizarEncabezado(texto) {
            return String(texto || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
        }

// Lee todas las hojas de un archivo como matrices (para detectar herrajes).
function leerHojasComoMatrices(file) {
            return new Promise((resolve, reject) => {
                const esCsv = file.name.toLowerCase().endsWith(".csv");
                const reader = new FileReader();
                reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
                reader.onload = ev => {
                    try {
                        if (esCsv) return resolve([parsearCsv(ev.target.result)]);
                        const libro = XLSX.read(new Uint8Array(ev.target.result), { type: "array" });
                        resolve(libro.SheetNames.map(n => XLSX.utils.sheet_to_json(libro.Sheets[n], { header: 1, raw: true, defval: "" })));
                    } catch (error) {
                        reject(error);
                    }
                };
                if (esCsv) reader.readAsText(file, "UTF-8");
                else reader.readAsArrayBuffer(file);
            });
        }

// Si el archivo es de herrajes devuelve sus filas; si no, null.
function extraerHerrajes(matrices) {
            for (const filas of matrices) {
                const indice = filas.slice(0, 15).findIndex(fila => {
                    const cols = fila.map(normalizarEncabezado);
                    return cols.includes("codstock") && (cols.includes("cantreal") || cols.includes("cantidad"));
                });
                if (indice < 0) continue;

                const cols = filas[indice].map(normalizarEncabezado);
                const col = nombres => nombres.map(n => cols.indexOf(n)).find(i => i >= 0);
                const iCod = col(["codmueblenue", "codmueble", "codigomueble"]);
                const iOp = col(["numordent", "op", "ordenproduccion"]);
                return filas.slice(indice + 1)
                    .filter(fila => String(fila[iCod] || "").trim())
                    .map(fila => ({
                        op: String(fila[iOp] || "").trim(),
                        cod: String(fila[iCod] || "").trim(),
                        linea: String(fila[col(["linea"])] || "").trim(),
                        codigo: String(fila[col(["codstock"])] || "").trim(),
                        descripcion: String(fila[col(["descripcio", "descripcion"])] || "").trim(),
                        unidad: String(fila[col(["siglas", "unidad"])] || "").trim(),
                        cantidad: Number(fila[col(["cantreal", "cantidad"])]) || 0,
                        ruta: String(fila[col(["descriruta", "ruta"])] || "").trim(),
                        nomueble: String(fila[col(["nomueble"])] || "").trim(),
                        lote: String(fila[col(["lote"])] || "").trim()
                    }));
            }
            return null;
        }

// Lacas: columnas propias (colorlaca, enchapado...), nombre "Despiece L" o tableros DURAFIBRA.
function esDespieceLacas(file, data) {
            const cols = Object.keys(data[0] || {}).map(normalizarEncabezado);
            if (cols.some(c => ["colorlaca", "enchapado", "codigoot", "rutaot"].includes(c))) return true;
            if (/^despiece\s+l\b/i.test(file.name)) return true;
            const materiales = data.slice(0, 200).map(fila => Object.values(fila).join(" ").toUpperCase());
            return materiales.filter(t => t.includes("DURAFIBRA")).length > materiales.length * 0.6;
        }

// Convierte las filas de un despiece a columnas canonicas y marca el origen.
function filasCanonicas(data, origen) {
            const mapa = crearMapaColumnas(Object.keys(data[0] || {}), data);
            return data
                .map(fila => {
                    const canonica = {};
                    COLUMNAS_CANONICAS.forEach(col => { canonica[col] = valConMapa(fila, col, mapa); });
                    canonica.origen = origen;
                    return canonica;
                })
                .filter(fila => fila.cod_mueble && fila.cod_mueble.toUpperCase() !== "PIEZA");
        }

// Carga uno o varios archivos (melamina, lacas, herrajes) y rearma la vista.
async function cargarArchivosLote(files) {
            const lista = Array.from(files || []).filter(Boolean);
            if (!lista.length) return;

            limpiarAvisos();
            const errores = [];
            for (const file of lista) {
                try {
                    const matrices = await leerHojasComoMatrices(file);
                    const herrajes = extraerHerrajes(matrices);
                    if (herrajes) {
                        LOTE.herrajes = { nombre: file.name, filas: herrajes };
                        continue;
                    }
                    const data = await leerArchivoComoData(file);
                    if (!data.length) {
                        errores.push(`${file.name}: sin filas con datos.`);
                        continue;
                    }
                    const tipo = esDespieceLacas(file, data) ? "lacas" : "melamina";
                    LOTE[tipo] = { nombre: file.name, filas: filasCanonicas(data, tipo === "lacas" ? "LACAS" : "MELAMINA") };
                } catch (error) {
                    console.error(error);
                    errores.push(`${file.name}: no se pudo leer.`);
                }
            }
            reconstruirVistaLote();
            errores.forEach(texto => mostrarErrorGeneral(texto));
        }

// Quita los archivos cargados.
function limpiarLote() {
            LOTE.melamina = null;
            LOTE.lacas = null;
            LOTE.herrajes = null;
            reconstruirVistaLote();
        }

// Junta melamina + lacas en la tabla, valida y agrega herrajes y cruces.
function reconstruirVistaLote() {
            VALIDADO = false;
            SOLO_ERRORES = false;
            limpiarAvisos();

            const nombres = [];
            if (LOTE.melamina) nombres.push(`Melamina: ${LOTE.melamina.nombre}`);
            if (LOTE.lacas) nombres.push(`Lacas: ${LOTE.lacas.nombre}`);
            if (LOTE.herrajes) nombres.push(`Herrajes: ${LOTE.herrajes.nombre}`);
            documentNameEl.textContent = nombres.length ? nombres.join(" · ") : "Carga un archivo Excel o CSV para comenzar.";

            HERRAJES_POR_MUEBLE = {};
            (LOTE.herrajes ? LOTE.herrajes.filas : []).forEach(h => {
                (HERRAJES_POR_MUEBLE[claveMueble(h.op, h.cod)] = HERRAJES_POR_MUEBLE[claveMueble(h.op, h.cod)] || []).push(h);
            });

            DATA_GLOBAL = [...(LOTE.melamina ? LOTE.melamina.filas : []), ...(LOTE.lacas ? LOTE.lacas.filas : [])];
            if (!DATA_GLOBAL.length) {
                mostrarEstadoVacio(LOTE.herrajes ? "Solo herrajes cargados" : "Sin datos cargados",
                    LOTE.herrajes ? "Carga tambien el despiece de melamina y/o lacas del mismo lote para enlazarlos." : "Haz click en Cargar archivos o arrastra los Excel del lote.");
                actualizarStats(0, 0, 0, 0);
                mostrarResumenLote();
                return;
            }

            mapearColumnas([...COLUMNAS_CANONICAS, "origen"], DATA_GLOBAL);
            mostrarAvisosDeColumnas();
            renderizar(DATA_GLOBAL);
            validarTodo();
            actualizarBotonSoloErrores();
            filtrarUniversal();
            cruzarArchivosLote();
            mostrarResumenLote();
        }

// Cruza los tres archivos mueble por mueble y deja los avisos en cada tarjeta.
function cruzarArchivosLote() {
            const hayMelamina = !!LOTE.melamina;
            const hayLacas = !!LOTE.lacas;
            const hayHerrajes = !!LOTE.herrajes;
            const resumen = { enlazados: 0, faltanFrentes: [], duplicados: [], soloLacas: [], sinHerrajes: [], herrajesSinMueble: [], avisosHerrajes: 0, opsFuera: [] };
            const clavesDespiece = new Set();

            // Solo se cruzan las OP que estan en ambos archivos (un archivo puede traer varios sublotes).
            const opDe = clave => clave.split("|")[0];
            const opsDe = filas => new Set((filas || []).map(f => claveMueble(f.op, "").split("|")[0]));
            const opsMel = opsDe(LOTE.melamina && LOTE.melamina.filas);
            const opsLac = opsDe(LOTE.lacas && LOTE.lacas.filas);
            const opsHer = new Set(Object.keys(HERRAJES_POR_MUEBLE).map(opDe));
            const opsDespiece = new Set([...opsMel, ...opsLac]);
            const cargados = [[hayMelamina, opsMel, "melamina"], [hayLacas, opsLac, "lacas"], [hayHerrajes, opsHer, "herrajes"]].filter(x => x[0]);
            if (cargados.length > 1) {
                const todas = new Set(cargados.flatMap(x => [...x[1]]));
                todas.forEach(op => {
                    const faltaEn = cargados.filter(x => !x[1].has(op)).map(x => x[2]);
                    if (faltaEn.length) resumen.opsFuera.push(`${op} (no esta en ${faltaEn.join(" ni ")})`);
                });
            }

            document.querySelectorAll("article.mueble-container").forEach(card => {
                const cod = card.dataset.codpuro || "";
                const clave = claveMueble(card.dataset.op, cod);
                const op = opDe(clave);
                clavesDespiece.add(clave);
                const filas = Array.from(card.querySelectorAll("tbody tr")).map(tr => ({
                    origen: textoCelda(tr, "origen"),
                    pieza: normalizarPieza(textoCelda(tr, "cod_pieza"))
                }));
                const mel = filas.filter(f => f.origen === "MELAMINA");
                const lac = filas.filter(f => f.origen === "LACAS");
                const linea = card.dataset.linea || "";
                const acabado = linea.split("+")[1] || "";
                const info = analizarCodigoParaDespiece(cod, linea);
                const conFrentes = TIPOS_CON_FRENTES.includes(info.tipo) && !info.sinPuertas;
                const esFrente = f => /^(PT|FC|FV|OTP|FF)$/.test(f.pieza);
                const notas = [];

                if (hayMelamina && hayLacas && mel.length && lac.length) resumen.enlazados++;
                if (hayMelamina && hayLacas && opsLac.has(op) && conFrentes && ACABADOS_LACA.test(acabado) && mel.length && !lac.length && !mel.some(esFrente)) {
                    notas.push(`Linea ${linea}: los frentes van en lacas y no aparecen en el despiece de lacas.`);
                    resumen.faltanFrentes.push(`${card.dataset.op} ${cod}`);
                }
                if (mel.some(esFrente) && lac.some(esFrente)) {
                    notas.push("Frente duplicado: hay puertas o frentes en melamina y en lacas.");
                    resumen.duplicados.push(`${card.dataset.op} ${cod}`);
                }
                if (hayMelamina && hayLacas && opsMel.has(op) && lac.length && !mel.length && TIPOS_CON_FRENTES.includes(info.tipo)) {
                    notas.push("Este modulo esta en lacas pero no tiene estructura en el despiece de melamina.");
                    resumen.soloLacas.push(`${card.dataset.op} ${cod}`);
                }

                const herrajes = HERRAJES_POR_MUEBLE[clave] || [];
                if (hayHerrajes && opsHer.has(op) && !herrajes.length && TIPOS_CON_FRENTES.includes(info.tipo)) {
                    notas.push("No tiene herrajes en el archivo de herrajes.");
                    resumen.sinHerrajes.push(`${card.dataset.op} ${cod}`);
                }
                if (herrajes.length) {
                    const avisos = revisarHerrajesMueble(cod, linea, herrajes);
                    resumen.avisosHerrajes += avisos.length;
                    notas.push(...avisos);
                }

                pintarEnlaceEnTarjeta(card, notas, herrajes);
            });

            if (hayHerrajes && (hayMelamina || hayLacas)) {
                Object.keys(HERRAJES_POR_MUEBLE).forEach(clave => {
                    // Solo modulos: los accesorios sueltos (zocalos de aluminio, LED, laca) no van en los despieces.
                    const tipoHerraje = obtenerDimensionesModulo(clave.split("|")[1]).tipo;
                    if (!clavesDespiece.has(clave) && opsDespiece.has(opDe(clave)) && TIPOS_CON_FRENTES.includes(tipoHerraje)) {
                        resumen.herrajesSinMueble.push(clave.replace("|", " "));
                    }
                });
            }
            ENLACE_LOTE = resumen;
        }

// Reglas de herrajes aprendidas de produccion: sistema de gaveta, PUSH y bisagras por puerta.
function revisarHerrajesMueble(cod, linea, herrajes) {
            const avisos = [];
            const texto = herrajes.map(h => h.descripcion).join(" | ");
            const info = analizarCodigoParaDespiece(cod, linea);

            if (info.gavetas && info.sistema && HERRAJE_SISTEMA[info.sistema]) {
                const propio = HERRAJE_SISTEMA[info.sistema].test(texto);
                const otros = Object.entries(HERRAJE_SISTEMA).filter(([clave, re]) => clave !== info.sistema && re.test(texto)).map(([clave]) => clave);
                if (!propio && otros.length) {
                    avisos.push(`El codigo pide gavetas ${NOMBRE_SISTEMA[info.sistema] || info.sistema} pero los herrajes son de ${otros.map(o => NOMBRE_SISTEMA[o] || o).join(", ")}.`);
                }
            }

            if (/(^|-)PUSH(-|$)/.test(cod.toUpperCase()) && !/TIP[\s-]?ON|PUSH/i.test(texto)) {
                avisos.push("El codigo es PUSH y no tiene TIP-ON en los herrajes.");
            }

            const bisagras = herrajes.filter(h => /BISAGRA/i.test(h.descripcion) && !/BASE|TAPA|PLACA|CRUZ/i.test(h.descripcion)).reduce((a, h) => a + h.cantidad, 0);
            if (bisagras && info.dims.ancho && info.dims.alto && TIPOS_CON_FRENTES.includes(info.tipo) && !info.gavetas) {
                const modulo = { ancho: info.dims.ancho, alto: info.dims.alto, grosor: 18, cod: info.codigo, tipo: info.tipo, linea, contextoFrenteFalso: {} };
                const regla = validarMedidasPieza("PT", 1, 1, modulo);
                const [altoPuerta, anchoPuerta] = regla.objetivos || [];
                if (altoPuerta && anchoPuerta) {
                    const puertas = Math.max(1, Math.round(info.dims.ancho / (anchoPuerta + 3)));
                    const unidades = Math.max(1, new Set(herrajes.map(h => h.nomueble)).size);
                    const [min, max] = bisagrasEsperadas(altoPuerta);
                    const porPuerta = bisagras / (puertas * unidades);
                    if (porPuerta < min || porPuerta > max) {
                        avisos.push(`Bisagras: ${bisagras} para ${puertas * unidades} puerta(s) de ${altoPuerta} mm; lo normal es ${min === max ? min : `${min}-${max}`} por puerta.`);
                    }
                }
            }
            return avisos;
        }

// Descripcion extra del herraje desde la base de datos (proveedor).
function proveedorHerraje(codigo) {
            const texto = typeof DB !== "undefined" ? DB[codigo] : "";
            if (!texto) return "";
            const parte = String(texto).split(" | ").find(p => /^Proveedor:/i.test(p.trim()));
            return parte ? parte.replace(/^Proveedor:\s*/i, "").trim() : "";
        }

// Agrega a la tarjeta los avisos del cruce y la lista de herrajes.
function pintarEnlaceEnTarjeta(card, notas, herrajes) {
            card.querySelectorAll(".enlace-lote").forEach(el => el.remove());
            if (!notas.length && !herrajes.length) return;

            const caja = document.createElement("div");
            caja.className = "enlace-lote";

            if (notas.length) {
                const lista = document.createElement("ul");
                lista.className = "enlace-avisos";
                notas.forEach(nota => {
                    const li = document.createElement("li");
                    li.textContent = nota;
                    lista.appendChild(li);
                });
                caja.appendChild(lista);
                card.dataset.avisoLote = "1";
            }

            if (herrajes.length) {
                const detalles = document.createElement("details");
                detalles.className = "herrajes-mueble";
                const resumen = document.createElement("summary");
                const total = herrajes.reduce((a, h) => a + h.cantidad, 0);
                resumen.textContent = `Herrajes (${herrajes.length} lineas, ${Math.round(total * 100) / 100} unidades)`;
                detalles.appendChild(resumen);

                const tabla = document.createElement("table");
                const thead = document.createElement("thead");
                const filaEnc = document.createElement("tr");
                ["Codigo", "Descripcion", "Proveedor", "Cant", "Unidad", "Ruta", "Mueble"].forEach(texto => {
                    const th = document.createElement("th");
                    th.textContent = texto;
                    filaEnc.appendChild(th);
                });
                thead.appendChild(filaEnc);
                tabla.appendChild(thead);
                const tbody = document.createElement("tbody");
                herrajes.forEach(h => {
                    const tr = document.createElement("tr");
                    [h.codigo, h.descripcion, proveedorHerraje(h.codigo), h.cantidad, h.unidad, h.ruta, h.nomueble].forEach((valor, i) => {
                        const td = document.createElement("td");
                        td.textContent = String(valor);
                        if (i === 3) td.className = "num";
                        tr.appendChild(td);
                    });
                    tbody.appendChild(tr);
                });
                tabla.appendChild(tbody);
                const envoltura = document.createElement("div");
                envoltura.className = "table-wrap";
                envoltura.appendChild(tabla);
                detalles.appendChild(envoltura);
                caja.appendChild(detalles);
            }
            card.appendChild(caja);
        }

// Panel de resumen del lote arriba de la lista.
function mostrarResumenLote() {
            document.querySelectorAll(".resumen-lote").forEach(el => el.remove());
            const cargados = ["melamina", "lacas", "herrajes"].filter(t => LOTE[t]);
            if (!cargados.length) return;

            const panel = document.createElement("section");
            panel.className = "resumen-lote";
            const titulo = document.createElement("div");
            titulo.className = "resumen-lote-titulo";
            titulo.innerHTML = "";
            ["melamina", "lacas", "herrajes"].forEach(tipo => {
                const chip = document.createElement("span");
                chip.className = `chip-lote ${LOTE[tipo] ? "cargado" : "falta"}`;
                chip.textContent = `${tipo[0].toUpperCase()}${tipo.slice(1)}: ${LOTE[tipo] ? LOTE[tipo].nombre : "sin cargar"}`;
                titulo.appendChild(chip);
            });
            const quitar = document.createElement("button");
            quitar.type = "button";
            quitar.className = "btn btn-secondary btn-small";
            quitar.textContent = "Quitar archivos";
            quitar.addEventListener("click", limpiarLote);
            titulo.appendChild(quitar);
            panel.appendChild(titulo);

            const r = ENLACE_LOTE;
            if (r && cargados.length > 1) {
                const items = [
                    ["Modulos con melamina y lacas enlazados", r.enlazados, null],
                    ["Faltan frentes en lacas", r.faltanFrentes.length, r.faltanFrentes],
                    ["Frentes duplicados (melamina y lacas)", r.duplicados.length, r.duplicados],
                    ["En lacas sin estructura en melamina", r.soloLacas.length, r.soloLacas],
                    ["Modulos sin herrajes", r.sinHerrajes.length, r.sinHerrajes],
                    ["Herrajes de muebles que no estan en los despieces", r.herrajesSinMueble.length, r.herrajesSinMueble],
                    ["Avisos de herrajes (sistema, PUSH, bisagras)", r.avisosHerrajes, null],
                    ["OP que no estan en todos los archivos (no se cruzan)", r.opsFuera.length, r.opsFuera]
                ];
                const lista = document.createElement("ul");
                lista.className = "resumen-lote-lista";
                items.forEach(([texto, n, detalle]) => {
                    const li = document.createElement("li");
                    li.className = n && !/enlazados|no se cruzan/.test(texto) ? "con-aviso" : "";
                    li.textContent = `${texto}: ${n}`;
                    if (detalle && detalle.length) {
                        const det = document.createElement("div");
                        det.className = "resumen-lote-detalle";
                        det.textContent = detalle.slice(0, 30).join(" · ") + (detalle.length > 30 ? ` · y ${detalle.length - 30} mas` : "");
                        li.appendChild(det);
                    }
                    lista.appendChild(li);
                });
                panel.appendChild(lista);
            } else {
                const ayuda = document.createElement("p");
                ayuda.className = "resumen-lote-ayuda";
                ayuda.textContent = "Carga tambien los otros despieces del mismo lote (melamina, lacas, herrajes) para cruzarlos. Puedes seleccionar los 3 a la vez.";
                panel.appendChild(ayuda);
            }
            avisosEl.prepend(panel);
        }
