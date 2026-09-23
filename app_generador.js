// app_generador.js
// Pantalla de la pagina para las pestanas Consultar codigo y Generar despiece.
// El calculo del despiece vive en generador_despiece.js; aqui solo se arma la vista.

// Ultimo despiece generado (para exportar o mandarlo al validador).
let ULTIMO_GENERADO = [];

// Vista activa: consultar, validar o generar.
const VISTAS = ["consultar", "validar", "generar"];

// Cambia de pestana y recuerda la eleccion en este navegador.
function cambiarVista(nombre) {
            if (!VISTAS.includes(nombre)) nombre = "validar";
            VISTAS.forEach(vista => {
                const seccion = document.getElementById(`vista-${vista}`);
                const boton = document.getElementById(`tab-${vista}`);
                if (seccion) seccion.hidden = vista !== nombre;
                if (boton) boton.setAttribute("aria-selected", String(vista === nombre));
            });
            try { localStorage.setItem("vistaActiva", nombre); } catch (e) { /* sin almacenamiento */ }
            ajustarAltoHeader();
        }

// Mantiene los filtros pegados justo debajo del encabezado aunque cambie de alto.
function ajustarAltoHeader() {
            const header = document.querySelector(".header");
            if (header) document.documentElement.style.setProperty("--alto-header", `${header.offsetHeight}px`);
        }

// Formatea milimetros sin decimales innecesarios.
function mm(valor) {
            if (!valor) return "-";
            return `${Math.round(valor * 10) / 10} mm`;
        }

// Crea un elemento con clase y texto en una sola linea.
function crearElemento(etiqueta, clase = "", texto = "") {
            const el = document.createElement(etiqueta);
            if (clase) el.className = clase;
            if (texto) el.textContent = texto;
            return el;
        }

// ---------- Consultar codigo ----------

// Dibuja la ficha detallada del codigo escrito en el consultor.
function mostrarFichaCodigo() {
            const contenedor = document.getElementById("ficha-codigo");
            if (!contenedor) return;
            contenedor.textContent = "";

            const codigo = document.getElementById("codigo-consulta").value.trim().toUpperCase().replace(/\s+/g, "-");
            if (!codigo) return;

            const info = analizarCodigoParaDespiece(codigo);
            const dims = info.dims;
            const coleccion = typeof detectarColeccion === "function" ? detectarColeccion(codigo) : "";
            const apertura = /APERTURA IZQUIERDA/.test(info.lectura) ? "Izquierda"
                : /APERTURA DERECHA/.test(info.lectura) ? "Derecha" : "-";

            const datos = [
                ["Tipo", info.tipo ? `${info.tipo} - ${traducirTipoModulo(info.tipo) || ""}` : "-"],
                ["Ancho", mm(dims.ancho)],
                ["Alto", mm(dims.alto)],
                ["Profundidad total", mm(dims.profundidad)],
                ["Profundidad estructura", mm(dims.profundidadEstructura)],
                ["Apertura", apertura],
                ["Gavetas", info.gavetas ? `${info.gavetas}${info.gavetaInterna ? " (internas)" : ""}` : "No"],
                ["Sistema de gaveta", info.sistema ? `${info.sistema} - ${NOMBRE_SISTEMA[info.sistema] || ""}` : (info.gavetas ? "No indicado" : "-")],
                ["Coleccion", coleccion || "Estandar"],
                ["Fregadero", info.fregadero ? "Si (sin respaldo)" : "No"],
                ["Puertas", info.sinPuertas ? "Sin puertas" : "Segun ancho"]
            ];

            const grid = crearElemento("div", "ficha-grid");
            datos.forEach(([etiqueta, valor]) => {
                const celda = crearElemento("div", "ficha-dato");
                celda.appendChild(crearElemento("span", "ficha-etiqueta", etiqueta));
                celda.appendChild(crearElemento("strong", "", valor));
                grid.appendChild(celda);
            });
            contenedor.appendChild(grid);

            // Partes del codigo, una por linea.
            const partes = interpretarCodigoModulo(codigo);
            if (partes.length > 1) {
                const lista = crearElemento("ul", "ficha-partes");
                partes.forEach(parte => lista.appendChild(crearElemento("li", "", parte)));
                contenedor.appendChild(crearElemento("h3", "ficha-subtitulo", "Como se lee"));
                contenedor.appendChild(lista);
            }

            // Vista previa rapida de lo que generaria.
            const previa = generarDespiece(codigo, {});
            if (previa.piezas.length) {
                const resumen = previa.piezas.map(p => `${p.cant} ${p.pieza}`).join(" · ");
                contenedor.appendChild(crearElemento("h3", "ficha-subtitulo", `Piezas que genera (casco ${previa.modulo ? previa.modulo.grosor : 18}, respaldo 6)`));
                contenedor.appendChild(crearElemento("p", "ficha-resumen", resumen));
            } else if (previa.avisos.length) {
                contenedor.appendChild(crearElemento("p", "ficha-resumen", previa.avisos[0]));
            }

            const boton = crearElemento("button", "btn btn-primary", "Generar despiece de este codigo");
            boton.type = "button";
            boton.addEventListener("click", () => {
                document.getElementById("gen-codigos").value = codigo;
                cambiarVista("generar");
                generarDesdeFormulario();
            });
            contenedor.appendChild(boton);
        }

// ---------- Generar despiece ----------

// Lee "CODIGO", "CODIGO x2" o "CODIGO *2" por linea.
function leerCodigosDelFormulario() {
            const texto = document.getElementById("gen-codigos").value;
            const cantidadGeneral = Math.max(1, Number(document.getElementById("gen-cantidad").value) || 1);
            return texto.split(/[\n,;]+/)
                .map(linea => linea.trim().toUpperCase())
                .filter(Boolean)
                .map(linea => {
                    const match = linea.match(/^(.+?)\s*[X*]\s*(\d+)$/);
                    // Los espacios dentro del codigo se toman como guion ("B60G3 MRV" = "B60G3-MRV").
                    const limpiar = texto => texto.trim().replace(/\s+/g, "-");
                    if (match && /\s|\*/.test(linea.slice(match[1].length))) {
                        return { codigo: limpiar(match[1]), cantidad: Number(match[2]) * cantidadGeneral };
                    }
                    return { codigo: limpiar(linea), cantidad: cantidadGeneral };
                });
        }

// Opciones del formulario para el generador.
function leerOpcionesGenerador() {
            const frentes = document.getElementById("gen-frentes").value;
            const opciones = {
                // Vacio = automatico: closets 15, cocina y bano 18.
                grosorCasco: Number(document.getElementById("gen-casco").value) || 0,
                grosorRespaldo: Number(document.getElementById("gen-respaldo").value) || 6,
                grosorRepisas: Number(document.getElementById("gen-repisas").value) || 18,
                grosorFrentes: Number(document.getElementById("gen-frentes-grosor").value) || 18,
                linea: document.getElementById("gen-linea").value.trim().toUpperCase()
            };
            if (frentes === "si") opciones.incluirFrentes = true;
            if (frentes === "no") opciones.incluirFrentes = false;
            return opciones;
        }

// Genera todos los codigos del formulario y los dibuja.
function generarDesdeFormulario() {
            const resultadoEl = document.getElementById("gen-resultado");
            resultadoEl.textContent = "";
            ULTIMO_GENERADO = [];

            const codigos = leerCodigosDelFormulario();
            if (codigos.length === 0) {
                resultadoEl.appendChild(crearElemento("p", "gen-vacio", "Escribe al menos un codigo de modulo."));
                actualizarBotonesGenerador();
                return;
            }

            const opciones = leerOpcionesGenerador();
            let totalPiezas = 0;
            let totalArea = 0;

            codigos.forEach(({ codigo, cantidad }) => {
                const resultado = generarDespiece(codigo, { ...opciones, cantidad });
                const verificacion = verificarDespieceGenerado(resultado);
                ULTIMO_GENERADO.push({ ...resultado, cantidad, opciones });
                resultadoEl.appendChild(crearTarjetaGenerada(resultado, cantidad, verificacion));

                resultado.piezas.forEach(p => {
                    totalPiezas += p.cant;
                    totalArea += p.cant * p.largo * p.ancho / 1e6;
                });
            });

            const resumen = crearElemento("div", "gen-totales");
            resumen.textContent = `${codigos.length} modulo(s) · ${totalPiezas} piezas · ${totalArea.toFixed(2)} m² de tablero (sin desperdicio)`;
            resultadoEl.prepend(resumen);
            actualizarBotonesGenerador();
        }

// Tarjeta con la tabla de un modulo generado.
function crearTarjetaGenerada(resultado, cantidad, verificacion) {
            const tarjeta = crearElemento("section", "gen-tarjeta");
            const cabecera = crearElemento("div", "gen-cabecera");
            cabecera.appendChild(crearElemento("span", "cod-mueble", resultado.codigo));
            if (cantidad > 1) cabecera.appendChild(crearElemento("span", "badge", `x${cantidad}`));
            if (resultado.piezas.length) {
                cabecera.appendChild(crearElemento("span", verificacion.ok ? "badge badge-ok" : "badge badge-err",
                    verificacion.ok ? "Pasa el validador" : "Revisar medidas"));
            }
            tarjeta.appendChild(cabecera);
            tarjeta.appendChild(crearElemento("p", "desc-tag", obtenerNombre(resultado.codigo)));

            const avisos = [...resultado.avisos, ...verificacion.fallas];
            if (avisos.length) {
                const lista = crearElemento("ul", "gen-avisos");
                avisos.forEach(aviso => lista.appendChild(crearElemento("li", "", aviso)));
                tarjeta.appendChild(lista);
            }

            if (!resultado.piezas.length) return tarjeta;

            const envoltura = crearElemento("div", "table-wrap");
            const tabla = document.createElement("table");
            const encabezados = ["Pieza", "Descripcion", "Cant", "Largo", "Ancho", "Esp.", "L1", "L2", "C1", "C2", "Formula"];
            const thead = document.createElement("thead");
            const filaEnc = document.createElement("tr");
            encabezados.forEach(texto => filaEnc.appendChild(crearElemento("th", "", texto)));
            thead.appendChild(filaEnc);
            tabla.appendChild(thead);

            const tbody = document.createElement("tbody");
            resultado.piezas.forEach(p => {
                const fila = document.createElement("tr");
                const celdas = [p.pieza, p.descripcion, p.cant, p.largo, p.ancho, p.espesor, ...p.cantos, p.formula + (p.nota ? ` (${p.nota})` : "")];
                celdas.forEach((valor, i) => {
                    const td = crearElemento("td", i === 10 ? "gen-formula" : "", String(valor));
                    if (i === 0) td.className = "gen-pieza";
                    fila.appendChild(td);
                });
                tbody.appendChild(fila);
            });
            tabla.appendChild(tbody);
            envoltura.appendChild(tabla);
            tarjeta.appendChild(envoltura);
            return tarjeta;
        }

// Material (columna job/jov) con el grosor para que el validador lo lea.
function materialGenerado(pieza, espesor) {
            if (pieza === "RESP") return `RESP${espesor}`;
            if (/^REP|^MALE/.test(pieza)) return `REPISA${espesor}`;
            if (/^(PT|FC)$/.test(pieza)) return `FRENTE${espesor}`;
            return `CASCO${espesor}`;
        }

// Convierte lo generado a filas con las mismas columnas del despiece real.
function filasDelGenerado() {
            const op = document.getElementById("gen-op").value.trim() || "GENERADO";
            const filas = [];
            ULTIMO_GENERADO.forEach((resultado, indice) => {
                const linea = resultado.opciones.linea || "";
                resultado.piezas.forEach(p => {
                    filas.push({
                        op,
                        linea,
                        cod_mueble: resultado.codigo,
                        nomueble: indice + 1,
                        cod_pieza: p.pieza,
                        cant_piezas: p.cant,
                        medida1: p.largo,
                        medida2: p.ancho,
                        jov: materialGenerado(p.pieza, p.espesor),
                        material_nombre: `${p.descripcion} ${p.espesor} mm`,
                        l1: p.cantos[0],
                        l2: p.cantos[1],
                        c1: p.cantos[2],
                        c2: p.cantos[3]
                    });
                });
            });
            return filas;
        }

// Descarga lo generado como Excel con las columnas del validador.
function exportarGenerado() {
            const filas = filasDelGenerado();
            if (!filas.length || !window.XLSX) return;
            const hoja = XLSX.utils.json_to_sheet(filas);
            const libro = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(libro, hoja, "Despiece");
            const fecha = new Date().toISOString().slice(0, 10);
            XLSX.writeFile(libro, `despiece_generado_${fecha}.xlsx`);
        }

// Carga lo generado en la pestana Validar como si fuera un archivo.
function validarGenerado() {
            const filas = filasDelGenerado();
            if (!filas.length) return;

            VALIDADO = false;
            SOLO_ERRORES = false;
            limpiarAvisos();
            if (typeof LOTE !== "undefined") { LOTE.melamina = null; LOTE.lacas = null; LOTE.herrajes = null; }
            actualizarNombreDocumento("Despiece generado desde codigo");
            DATA_GLOBAL = filas;
            mapearColumnas(Object.keys(filas[0]), DATA_GLOBAL);
            renderizar(DATA_GLOBAL);
            validarTodo();
            actualizarBotonSoloErrores();
            filtrarUniversal();
            cambiarVista("validar");
        }

// Activa exportar/validar solo cuando hay piezas.
function actualizarBotonesGenerador() {
            const hayPiezas = ULTIMO_GENERADO.some(r => r.piezas.length);
            document.getElementById("gen-exportar").disabled = !hayPiezas;
            document.getElementById("gen-validar").disabled = !hayPiezas;
        }

// ---------- Conexiones ----------

document.querySelectorAll(".tab").forEach(boton => {
    boton.addEventListener("click", () => cambiarVista(boton.dataset.vista));
});
document.getElementById("codigo-consulta").addEventListener("input", mostrarFichaCodigo);
document.getElementById("gen-generar").addEventListener("click", generarDesdeFormulario);
document.getElementById("gen-exportar").addEventListener("click", exportarGenerado);
document.getElementById("gen-validar").addEventListener("click", validarGenerado);
document.getElementById("gen-codigos").addEventListener("keydown", event => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) generarDesdeFormulario();
});
// Al cargar un archivo desde cualquier pestana se pasa a Validar.
document.getElementById("upload").addEventListener("change", () => cambiarVista("validar"));
document.addEventListener("drop", () => cambiarVista("validar"));
window.addEventListener("resize", ajustarAltoHeader);

(function iniciarVistas() {
    let inicial = "validar";
    try { inicial = localStorage.getItem("vistaActiva") || "validar"; } catch (e) { /* sin almacenamiento */ }
    cambiarVista(inicial);
    actualizarBotonesGenerador();
})();
