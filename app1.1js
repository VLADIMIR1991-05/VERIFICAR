// app.js
// Logica general de pantalla, carga de Excel/CSV, filtros, render y comparacion.
// Las reglas de medidas estan en reglas_validacion.js.
// La lectura de nomenclatura esta en lector_codigos.js.

// Columnas que el sistema intenta leer del archivo.
        const COLS_DESEADAS = ["op", "Tipo", "cod_mueble", "jov", "cod_pieza", "cant_piezas", "medida1", "medida2", "l1", "l2", "c1", "c2", "nomueble", "material_nombre", "ubicacion", "ubi"];

        // Columnas que se muestran en la tabla; op, cod_mueble, Tipo, material y ubicacion se usan fuera de la tabla.
        const COLS_TABLA = COLS_DESEADAS.filter(col => !["op", "cod_mueble", "Tipo", "material_nombre", "ubicacion", "ubi"].includes(col));

        // Etiquetas visibles para columnas internas.
        const LABEL_COLUMNAS = {
            jov: "job"
        };

        // Posicion de la columna L en Excel, usando indice base cero.
        const INDICE_COLUMNA_L = 11;

        // Clave interna donde se guarda siempre el contenido real de la columna L.
        const CLAVE_COLUMNA_L = "__material_nombre_columna_L";

        // Posicion de la columna J en Excel, usando indice base cero.
        const INDICE_COLUMNA_J = 9;

        // Clave interna donde se guarda siempre el contenido real de la columna J.
        const CLAVE_COLUMNA_J = "__material_nombre_columna_J";

        // Posicion de la columna B en Excel, usando indice base cero.
        const INDICE_COLUMNA_B = 1;

        // Clave interna donde se guarda siempre el contenido real de la columna B.
        const CLAVE_COLUMNA_B = "__tipo_columna_B";

        // Posicion de la columna M en Excel, usando indice base cero.
        const INDICE_COLUMNA_M = 12;

        // Clave interna donde se guarda siempre el contenido real de la columna M.
        const CLAVE_COLUMNA_M = "__tipo_columna_M";

        // Posicion de la columna E en Excel, usando indice base cero.
        const INDICE_COLUMNA_E = 4;

        // Clave interna donde se guarda siempre el contenido real de la columna E.
        const CLAVE_COLUMNA_E = "__cod_pieza_columna_E";

        // Posicion de la columna G en Excel, usando indice base cero.
        const INDICE_COLUMNA_G = 6;

        // Clave interna donde se guarda siempre el contenido real de la columna G.
        const CLAVE_COLUMNA_G = "__cod_pieza_columna_G";

        // Posicion de la columna AI en Excel, usando indice base cero.
        const INDICE_COLUMNA_AI = 34;

        // Clave interna donde se guarda siempre el contenido real de la columna AI.
        const CLAVE_COLUMNA_AI = "__jov_columna_AI";

        // Posicion de la columna AJ en Excel, usando indice base cero.
        const INDICE_COLUMNA_AJ = 35;

        // Clave interna donde se guarda siempre el contenido real de la columna AJ.
        const CLAVE_COLUMNA_AJ = "__jov_columna_AJ";

        // Clave interna que combina el JOB/JOV cuando viene entre AI y AJ.
        const CLAVE_COLUMNA_JOB = "__job_columna_AI_AJ";

        // Prefijo interno para conservar cada columna fisica del archivo aunque el encabezado venga raro.
        const PREFIJO_COLUMNA_FISICA = "__col_";

        // Columnas que se consideran numericas para alinearlas y validarlas.
        const COLS_NUMERICAS = new Set(["cant_piezas", "medida1", "medida2", "l1", "l2", "c1", "c2"]);

        // Columnas minimas para que la validacion tenga sentido.
        const COLS_REQUERIDAS = ["op", "cod_mueble", "cod_pieza", "medida1", "medida2"];

        // Alias aceptados para encontrar encabezados aunque cambie el texto visible.
        const ALIAS_COLUMNAS = {
            op: ["op", "orden_produccion", "ordenproduccion", "orden_de_produccion", "orden", "ordenprod", "noop", "numop"],
            Tipo: ["tipo", "material_tipo", "tipomaterial", "materialtipo", "tipo_material", "lacas", "melaminico", "lacas_melaminico", "lacasymelaminico", "lacas_melaminicos", "tipo_lacas_melaminico", "tipolacasmelaminico", "tipo_laca_melaminico", "tipolacamelaminico", "acabado", "tipoacabado", "tipo_acabado"],
            cod_mueble: ["cod_mueble", "codmueble", "codigo_mueble", "codigomueble", "codigo_muebles", "codigomuebles", "cod_modulo", "codmodulo", "cod_mod", "codmod", "mueble", "modulo"],
            jov: ["jov", "job"],
            cod_pieza: ["cod_pieza", "codpieza", "cod pieza", "codigo_pieza", "codigopieza", "codigo pieza", "codigo_de_pieza", "codigodepieza", "codigo_piezas", "codigopiezas", "codigo piezas", "codigo_de_piezas", "codigodepiezas", "codigo_pza", "codigopza", "codigo pza", "codigo_pzas", "codigopzas", "codigo pzas", "cod_pza", "codpza", "cod pza", "cod_pzas", "codpzas", "cod pzas", "cod_piezas", "codpiezas", "cod piezas", "cod_de_piezas", "coddepiezas", "pieza", "piezas", "pza", "pzas", "cod"],
            cant_piezas: ["cant_piezas", "cantpiezas", "cant piezas", "cantidad", "antidad", "cant", "cantidad_piezas", "cantidadpiezas", "cantidad piezas", "antidad_piezas", "antidadpiezas", "antidad piezas", "cantidad_de_piezas", "cantidaddepiezas", "cantidad de piezas", "antidad_de_piezas", "antidaddepiezas", "antidad de piezas", "cant_pieza", "cantpieza", "cant pieza", "cant_de_pieza", "cantdepieza", "cant de pieza", "cant_pza", "cantpza", "cant pza", "cant_pzas", "cantpzas", "cant pzas", "cantidad_pza", "cantidadpza", "cantidad pza", "cantidad_pzas", "cantidadpzas", "cantidad pzas", "cantidad_de_pza", "cantidaddepza", "cantidad de pza", "cantidad_de_pzas", "cantidaddepzas", "cantidad de pzas", "num_piezas", "numpiezas", "num piezas", "numero_piezas", "numeropiezas", "numero piezas", "numero_de_piezas", "numerodepiezas", "numero de piezas", "unidades", "unidad", "und"],
            medida1: ["medida1", "medida_1", "medida 1", "m1", "largo", "alto", "dimension1", "dimension_1"],
            medida2: ["medida2", "medida_2", "medida 2", "m2", "ancho", "fondo", "dimension2", "dimension_2"],
            l1: ["l1", "lado1", "lado_1", "lat1", "lateral1"],
            l2: ["l2", "lado2", "lado_2", "lat2", "lateral2"],
            c1: ["c1", "canto1", "canto_1"],
            c2: ["c2", "canto2", "canto_2"],
            nomueble: ["nomueble", "no_mueble", "numueble", "no mueble", "numero_mueble", "numeromueble", "nro_mueble", "nromueble", "ubicacion", "ubi"],
            material_nombre: ["material_nombre", "materialnombre", "nombre_material", "nombrematerial", "descripcion_material", "descripcionmaterial", "material", "tablero"],
            ubicacion: ["ubicacion", "ubi"],
            ubi: ["ubi", "ubicacion"]
        };

        // Margen permitido en milimetros al comparar medidas.
        const TOLERANCIA_MM = 2;

        // Descuento usado para ancho de base/techo: 18mm x 2 laterales + 1mm fuga.
        const DESCUENTO_ANCHO = 37;

        // Guarda todas las filas originales cargadas desde el archivo.
        let DATA_GLOBAL = [];

        // Guarda el archivo base cuando se usa el modo comparar.
        let DATA_BASE_COMPARACION = [];

        // Guarda el archivo secundario cuando se usa el modo comparar.
        let DATA_ARCHIVO_COMPARAR = [];

        // Mapa de columnas del archivo base de comparacion.
        let MAPA_BASE_COMPARACION = {};

        // Mapa de columnas del archivo secundario de comparacion.
        let MAPA_ARCHIVO_COMPARAR = {};

        // Relaciona el nombre esperado de columna con el nombre real encontrado en el archivo.
        let MAPA_COLUMNAS = {};

        // Guarda si ya se ejecuto la validacion para revalidar al cambiar filtros o archivo.
        let VALIDADO = false;

        // Guarda la posicion del navegador de errores.
        let INDICE_ERROR_ACTUAL = -1;

        // Referencias a elementos principales para no buscarlos repetidamente.
        const uploadEl = document.getElementById("upload");
        const listaEl = document.getElementById("lista");
        const avisosEl = document.getElementById("avisos");
        const statsEl = document.getElementById("stats-bar");
        const chipOkEl = document.getElementById("chip-ok");
        const chipErrEl = document.getElementById("chip-err");
        const chipWarnEl = document.getElementById("chip-warn");
        const comparePanelEl = document.getElementById("compare-panel");
        const compareResultEl = document.getElementById("compare-result");
        const uploadBaseEl = document.getElementById("upload-base");
        const uploadCompararEl = document.getElementById("upload-comparar");
        const labelUploadCompararEl = document.getElementById("label-upload-comparar");
        const documentNameEl = document.getElementById("document-name");

        // Conecta el evento de carga de archivo con su funcion.
        uploadEl.addEventListener("change", manejarArchivoSeleccionado);

        // Conecta cada filtro con la funcion de filtrado.
        ["f1", "f2", "f3", "f4"].forEach(id => {
            document.getElementById(id).addEventListener("input", filtrarUniversal);
        });

        // Conecta el boton de validacion.
        document.getElementById("btn-validar").addEventListener("click", validarTodo);

        // Permite saltar de error en error al hacer click en el contador.
        chipErrEl.addEventListener("click", irAlSiguienteError);

        // Conecta el boton de limpieza.
        document.getElementById("btn-limpiar").addEventListener("click", limpiarFiltros);

        // Permite consultar el codigo tambien al escribir.
        document.getElementById("codigo-consulta").addEventListener("input", consultarCodigoMueble);

        // Activa o desactiva el panel de comparacion.
        document.getElementById("btn-modo-comparar").addEventListener("click", alternarModoComparacion);

        // Carga el archivo base de comparacion.
        uploadBaseEl.addEventListener("change", manejarArchivoBaseComparacion);

        // Carga el archivo secundario y ejecuta la comparacion.
        uploadCompararEl.addEventListener("change", manejarArchivoComparar);

        // Lee el archivo seleccionado por el usuario.
        function manejarArchivoSeleccionado(event) {
            // Toma el primer archivo seleccionado.
            const file = event.target.files[0];

            // Si no hay archivo, termina sin hacer nada.
            if (!file) return;

            // Reinicia el estado de validacion.
            VALIDADO = false;

            // Limpia avisos anteriores.
            limpiarAvisos();

            // Muestra el nombre del documento cargado en la cabecera.
            actualizarNombreDocumento(file.name);

            // Detecta si el archivo es CSV por extension.
            const esCsv = file.name.toLowerCase().endsWith(".csv");

            // Lee y procesa el archivo seleccionado.
            leerArchivoComoData(file)
                .then(data => {
                    DATA_GLOBAL = data;

                    // Valida que el archivo tenga datos.
                    if (DATA_GLOBAL.length === 0) {
                        mostrarEstadoVacio("Archivo vacio", "No se encontraron filas con datos.");
                        actualizarStats(0, 0, 0, 0);
                        return;
                    }

                    // Detecta columnas reales del archivo.
                    mapearColumnas(Object.keys(DATA_GLOBAL[0]), DATA_GLOBAL);

                    // Muestra avisos si faltan columnas importantes.
                    mostrarAvisosDeColumnas();

                    // Dibuja los datos en pantalla.
                    renderizar(DATA_GLOBAL);
                })
                .catch(error => {
                    // Muestra un mensaje claro si el archivo no se pudo interpretar.
                    mostrarErrorGeneral("No se pudo procesar el archivo. Verifica que sea un Excel o CSV valido.");
                    console.error(error);
                });
        }

        // Lee un archivo Excel o CSV y devuelve sus filas como objetos.
        function leerArchivoComoData(file) {
            // Devuelve una promesa porque FileReader trabaja de forma asincronica.
            return new Promise((resolve, reject) => {
                // Detecta si el archivo es CSV por extension.
                const esCsv = file.name.toLowerCase().endsWith(".csv");

                // Crea el lector local del navegador.
                const reader = new FileReader();

                // Rechaza la promesa si no puede leer.
                reader.onerror = () => reject(new Error("No se pudo leer el archivo seleccionado."));

                // Procesa el archivo cuando termina la lectura.
                reader.onload = ev => {
                    try {
                        resolve(esCsv ? leerCsv(ev.target.result) : leerExcel(ev.target.result));
                    } catch (error) {
                        reject(error);
                    }
                };

                // Lee CSV como texto para respetar separadores.
                if (esCsv) {
                    reader.readAsText(file, "UTF-8");
                    return;
                }

                // Lee Excel como arreglo binario.
                reader.readAsArrayBuffer(file);
            });
        }

        // Convierte un archivo Excel a objetos JSON.
        function leerExcel(arrayBuffer) {
            // Verifica que la libreria XLSX este disponible.
            if (!window.XLSX) {
                throw new Error("La libreria XLSX no esta cargada.");
            }

            // Lee el libro de Excel.
            const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });

            // Busca la hoja que tenga los encabezados mas parecidos al formato esperado.
            const rows = seleccionarMatrizDeDatos(workbook);

            // Si la hoja no tiene filas, devuelve lista vacia.
            if (rows.length === 0) return [];

            // Convierte la matriz a objetos detectando automaticamente la fila real de encabezados.
            return convertirMatrizAObjetos(rows);
        }

        // Selecciona la hoja mas probable de datos dentro de un libro Excel.
        function seleccionarMatrizDeDatos(workbook) {
            // Mejor candidata encontrada.
            let mejor = { rows: [], puntaje: -1, filasUtiles: 0 };

            // Recorre todas las hojas porque algunos XLS antiguos no traen los datos en la primera.
            workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" });
                const info = puntuarMatriz(rows);

                if (
                    info.puntaje > mejor.puntaje ||
                    (info.puntaje === mejor.puntaje && info.filasUtiles > mejor.filasUtiles)
                ) {
                    mejor = { rows, puntaje: info.puntaje, filasUtiles: info.filasUtiles };
                }
            });

            // Devuelve la hoja mas probable.
            return mejor.rows;
        }

        // Convierte un CSV simple a objetos usando la primera fila como encabezados.
        function leerCsv(texto) {
            // Divide el CSV en filas respetando comillas.
            const filas = parsearCsv(texto);

            // Si no hay filas, devuelve lista vacia.
            if (filas.length === 0) return [];

            // Convierte la matriz a objetos detectando automaticamente la fila real de encabezados.
            return convertirMatrizAObjetos(filas);
        }

        // Convierte filas tipo matriz a objetos usando la fila de encabezados mas probable.
        function convertirMatrizAObjetos(rows) {
            // Busca la fila real de encabezados dentro de las primeras filas.
            const headerIndex = detectarFilaEncabezados(rows);

            // Calcula el ancho real de la matriz para no perder columnas aunque el encabezado venga incompleto.
            const totalColumnas = rows.slice(headerIndex).reduce((max, row) => Math.max(max, (row || []).length), INDICE_COLUMNA_AJ + 1);

            // Toma la fila detectada como encabezado y completa columnas sin nombre.
            const headers = Array.from({ length: totalColumnas }, (_, index) => String((rows[headerIndex] || [])[index] || `__col_${index}`).trim());

            // Convierte las filas posteriores a objetos.
            return rows.slice(headerIndex + 1)
                .filter(row => row.some(value => String(value).trim() !== ""))
                .map(row => {
                    const obj = {};

                    headers.forEach((header, index) => {
                        obj[header] = row[index] ?? "";
                        obj[`${PREFIJO_COLUMNA_FISICA}${index}`] = row[index] ?? "";
                    });

                    obj[CLAVE_COLUMNA_B] = row[INDICE_COLUMNA_B] ?? "";
                    obj[CLAVE_COLUMNA_E] = row[INDICE_COLUMNA_E] ?? "";
                    obj[CLAVE_COLUMNA_G] = row[INDICE_COLUMNA_G] ?? "";
                    obj[CLAVE_COLUMNA_AI] = row[INDICE_COLUMNA_AI] ?? "";
                    obj[CLAVE_COLUMNA_AJ] = row[INDICE_COLUMNA_AJ] ?? "";
                    obj[CLAVE_COLUMNA_JOB] = obtenerJobDesdeAiAj(row, headers);
                    obj[CLAVE_COLUMNA_J] = row[INDICE_COLUMNA_J] ?? "";
                    obj[CLAVE_COLUMNA_L] = row[INDICE_COLUMNA_L] ?? "";
                    obj[CLAVE_COLUMNA_M] = row[INDICE_COLUMNA_M] ?? "";

                    return obj;
                });
        }

        // Detecta que fila contiene los encabezados reales.
        function detectarFilaEncabezados(rows) {
            // Revisa solo una ventana inicial razonable.
            const limite = Math.min(rows.length, 60);

            // Guarda la mejor fila encontrada.
            let mejorIndice = 0;
            let mejorPuntaje = -1;

            // Evalua cada fila por coincidencias con encabezados esperados.
            for (let i = 0; i < limite; i++) {
                const fila = rows[i] || [];
                const puntaje = puntuarFilaEncabezado(fila);

                if (puntaje > mejorPuntaje) {
                    mejorPuntaje = puntaje;
                    mejorIndice = i;
                }
            }

            // Si no encuentra nada util, conserva la primera fila para no bloquear archivos viejos.
            return mejorPuntaje >= 2 ? mejorIndice : 0;
        }

        // Puntua una matriz completa para elegir la hoja mas probable.
        function puntuarMatriz(rows) {
            // Detecta mejor fila de encabezados.
            const headerIndex = detectarFilaEncabezados(rows);

            // Calcula puntaje de esa fila.
            const puntaje = puntuarFilaEncabezado(rows[headerIndex] || []);

            // Cuenta filas con contenido despues del encabezado.
            const filasUtiles = rows.slice(headerIndex + 1).filter(row => row.some(value => String(value).trim() !== "")).length;

            // Devuelve resumen.
            return { puntaje, filasUtiles };
        }

        // Puntua una fila segun coincidencias con encabezados requeridos y deseados.
        function puntuarFilaEncabezado(fila) {
            // Normaliza celdas de la fila.
            const normalizados = (fila || []).map(normalizarHeader);

            // Puntos fuertes por columnas requeridas.
            const requeridas = COLS_REQUERIDAS.reduce((total, col) => {
                return total + (normalizados.some(header => coincideHeader(header, col)) ? 3 : 0);
            }, 0);

            // Puntos suaves por otras columnas deseadas.
            const deseadas = COLS_DESEADAS.reduce((total, col) => {
                return total + (normalizados.some(header => coincideHeader(header, col)) ? 1 : 0);
            }, 0);

            // Devuelve puntaje combinado.
            return requeridas + deseadas;
        }

        // Parser CSV basico que soporta comas, punto y coma, saltos de linea y comillas.
        function parsearCsv(texto) {
            // Normaliza saltos de linea.
            const limpio = String(texto || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

            // Detecta separador usando la primera linea.
            const primeraLinea = limpio.split("\n")[0] || "";
            const separador = (primeraLinea.match(/;/g) || []).length > (primeraLinea.match(/,/g) || []).length ? ";" : ",";

            // Guarda todas las filas parseadas.
            const filas = [];

            // Guarda la fila actual.
            let fila = [];

            // Guarda el valor actual.
            let valor = "";

            // Indica si el cursor esta dentro de comillas.
            let enComillas = false;

            // Recorre caracter por caracter para respetar comillas.
            for (let i = 0; i < limpio.length; i++) {
                const char = limpio[i];
                const next = limpio[i + 1];

                if (char === '"' && enComillas && next === '"') {
                    valor += '"';
                    i++;
                } else if (char === '"') {
                    enComillas = !enComillas;
                } else if (char === separador && !enComillas) {
                    fila.push(valor);
                    valor = "";
                } else if (char === "\n" && !enComillas) {
                    fila.push(valor);
                    filas.push(fila);
                    fila = [];
                    valor = "";
                } else {
                    valor += char;
                }
            }

            // Agrega el ultimo valor si existe contenido pendiente.
            if (valor !== "" || fila.length > 0) {
                fila.push(valor);
                filas.push(fila);
            }

            // Devuelve filas sin lineas totalmente vacias.
            return filas.filter(f => f.some(v => String(v).trim() !== ""));
        }

        // Relaciona columnas esperadas con columnas reales del archivo.
        function mapearColumnas(headers, data = []) {
            // Guarda el mapa global usando el helper reutilizable.
            MAPA_COLUMNAS = crearMapaColumnas(headers, data);
        }

        // Crea un mapa de columnas para un archivo especifico.
        function crearMapaColumnas(headers, data = []) {
            // Mapa local de columnas.
            const mapa = {};

            // Recorre cada columna esperada.
            COLS_DESEADAS.forEach(col => {
                // Busca coincidencia exacta.
                const exacta = headers.find(h => h === col);

                // Busca coincidencia flexible usando alias.
                const flexible = headers.find(h => coincideHeader(normalizarHeader(h), col));

                // Guarda el mejor resultado encontrado.
                mapa[col] = exacta || flexible || null;
            });

            // Completa columnas faltantes usando el contenido real de las filas.
            aplicarInferenciaPorContenido(mapa, headers, data);

            // Refuerza columnas criticas por contenido aunque el encabezado exista pero venga movido.
            reforzarMapaPorContenido(mapa, headers, data);

            // Para Tipo elige una sola columna global entre B y M, tomando el nombre mas largo.
            const columnaTipo = elegirColumnaTipo(headers, data);
            if (columnaTipo) mapa.Tipo = columnaTipo;

            // Para cod_pieza elige una sola columna global entre E y G, descartando columnas solo numericas.
            const columnaCodPieza = elegirColumnaCodPieza(headers, data);
            if (columnaCodPieza) {
                const actual = mapa.cod_pieza ? evaluarColumnaCodPiezaUniversal(data, mapa.cod_pieza) : { score: 0, promedio: Infinity };
                const preferida = evaluarColumnaCodPiezaUniversal(data, columnaCodPieza);
                if (!mapa.cod_pieza || preferida.score >= actual.score * 0.9 || preferida.promedio < actual.promedio) {
                    mapa.cod_pieza = columnaCodPieza;
                }
            }

            // Para JOB/JOV usa siempre el contenido fisico entre AI y AJ del archivo cargado.
            if (headers.includes(CLAVE_COLUMNA_JOB)) {
                mapa.jov = CLAVE_COLUMNA_JOB;
            }

            // Para material_nombre elige una sola columna global entre J y L, tomando el nombre mas largo.
            const columnaMaterial = elegirColumnaMaterialNombre(headers, data);
            if (columnaMaterial) mapa.material_nombre = columnaMaterial;

            // Devuelve mapa local listo.
            return mapa;
        }

        // Revisa todas las columnas fisicas y corrige las claves principales si otra columna parece mas confiable.
        function reforzarMapaPorContenido(mapa, headers, data) {
            if (!Array.isArray(data) || data.length === 0) return;

            const columnasFisicas = obtenerColumnasFisicas(headers);
            const codMueble = elegirMejorColumnaPorContenido(columnasFisicas, data, evaluarColumnaCodMueble, 0.45, "max");
            if (codMueble) mapa.cod_mueble = codMueble;

            const codPieza = elegirMejorColumnaPorContenido(columnasFisicas, data, evaluarColumnaCodPiezaUniversal, 0.45, "pieza");
            if (codPieza) mapa.cod_pieza = codPieza;

            const cantidad = elegirMejorColumnaPorContenido(columnasFisicas, data, evaluarColumnaCantidadUniversal, 0.65, "max");
            if (cantidad && (!mapa.cant_piezas || puntuarColumna(data, mapa.cant_piezas, puntuarCantidadPorContenido) < 0.6)) mapa.cant_piezas = cantidad;

            const medidas = elegirColumnasMedidas(columnasFisicas, data, mapa);
            if (medidas.medida1) mapa.medida1 = medidas.medida1;
            if (medidas.medida2) mapa.medida2 = medidas.medida2;
        }

        // Devuelve columnas fisicas conservadas como __col_0, __col_1, etc.
        function obtenerColumnasFisicas(headers) {
            return headers
                .filter(header => String(header).startsWith(PREFIJO_COLUMNA_FISICA))
                .sort((a, b) => Number(a.replace(PREFIJO_COLUMNA_FISICA, "")) - Number(b.replace(PREFIJO_COLUMNA_FISICA, "")));
        }

        // Escoge la mejor columna por contenido usando una evaluacion estructurada.
        function elegirMejorColumnaPorContenido(columnas, data, evaluar, minimo, modo = "max") {
            const evaluadas = columnas
                .map(key => evaluar(data, key))
                .filter(info => info.valida && info.score >= minimo);

            if (evaluadas.length === 0) return "";

            if (modo === "pieza") {
                evaluadas.sort((a, b) => b.score - a.score || a.promedio - b.promedio || b.validos - a.validos);
            } else {
                evaluadas.sort((a, b) => b.score - a.score || b.validos - a.validos || b.promedio - a.promedio);
            }

            return evaluadas[0].key;
        }

        // Evalua columnas que parecen cod_mueble, evitando ambientes, materiales, jobs y piezas cortas.
        function evaluarColumnaCodMueble(data, key) {
            const valores = obtenerValoresColumna(data, key, 500);
            const codigos = valores.filter(esCodigoMuebleValido);
            const validos = codigos.length;
            const proporcion = valores.length > 0 ? validos / valores.length : 0;
            const promedio = validos > 0 ? codigos.reduce((total, value) => total + value.length, 0) / validos : 0;
            const score = proporcion * Math.min(1.2, promedio / 10);

            return { key, validos, promedio, proporcion, score, valida: validos >= 8 && proporcion >= 0.35 && promedio >= 5 };
        }

        // Evalua columnas que parecen cod_pieza, privilegiando codigos cortos y descartando material/job.
        function evaluarColumnaCodPiezaUniversal(data, key) {
            const valores = obtenerValoresColumna(data, key, 500);
            const codigos = valores.filter(esCodigoPiezaValido);
            const validos = codigos.length;
            const proporcion = valores.length > 0 ? validos / valores.length : 0;
            const promedio = validos > 0 ? codigos.reduce((total, value) => total + value.length, 0) / validos : Infinity;
            const score = proporcion * (promedio <= 10 ? 1 : Math.max(0.25, 12 / promedio));

            return { key, validos, promedio, proporcion, score, valida: validos >= 8 && proporcion >= 0.35 && promedio <= 18 };
        }

        // Evalua columnas numericas de cantidad de piezas.
        function evaluarColumnaCantidadUniversal(data, key) {
            const valores = obtenerValoresColumna(data, key, 500);
            const numeros = valores
                .map(value => Number(String(value).replace(",", ".")))
                .filter(value => Number.isFinite(value));
            const enterosPequenos = numeros.filter(value => Number.isInteger(value) && value >= 1 && value <= 50);
            const validos = enterosPequenos.length;
            const proporcion = valores.length > 0 ? validos / valores.length : 0;
            const promedio = validos > 0 ? enterosPequenos.reduce((total, value) => total + value, 0) / validos : 0;

            return { key, validos, promedio, proporcion, score: proporcion, valida: validos >= 8 && proporcion >= 0.65 };
        }

        // Elige las dos columnas numericas mas probables para medida1 y medida2.
        function elegirColumnasMedidas(columnas, data, mapa) {
            const usadas = new Set([mapa.cod_mueble, mapa.cod_pieza, mapa.cant_piezas, mapa.op, mapa.Tipo, mapa.material_nombre].filter(Boolean));
            const evaluadas = columnas
                .filter(key => !usadas.has(key))
                .map(key => evaluarColumnaMedida(data, key))
                .filter(info => info.valida)
                .sort((a, b) => b.score - a.score || b.promedio - a.promedio);

            if (evaluadas.length < 2) return {};

            const ordenadas = evaluadas.slice(0, 2).sort((a, b) => indiceColumnaFisica(a.key) - indiceColumnaFisica(b.key));
            return { medida1: ordenadas[0].key, medida2: ordenadas[1].key };
        }

        // Evalua columnas numericas que parecen medidas en mm.
        function evaluarColumnaMedida(data, key) {
            const valores = obtenerValoresColumna(data, key, 500);
            const numeros = valores
                .map(value => Number(String(value).replace(",", ".")))
                .filter(value => Number.isFinite(value));
            const medidas = numeros.filter(value => value >= 20 && value <= 3000);
            const validos = medidas.length;
            const proporcion = valores.length > 0 ? validos / valores.length : 0;
            const promedio = validos > 0 ? medidas.reduce((total, value) => total + value, 0) / validos : 0;

            return { key, validos, promedio, proporcion, score: proporcion * Math.min(1.2, promedio / 200), valida: validos >= 8 && proporcion >= 0.55 };
        }

        // Devuelve valores utiles de una columna.
        function obtenerValoresColumna(data, key, limite = 300) {
            return (data || [])
                .slice(0, limite)
                .map(row => String(row[key] ?? "").trim())
                .filter(Boolean);
        }

        // Obtiene indice numerico de __col_N.
        function indiceColumnaFisica(key) {
            const match = String(key || "").match(/__col_(\d+)/);
            return match ? Number(match[1]) : 9999;
        }

        // Elige cod_pieza entre columnas E y G para todo el archivo.
        function elegirColumnaCodPieza(headers, data) {
            const candidatas = [CLAVE_COLUMNA_E, CLAVE_COLUMNA_G].filter(key => headers.includes(key));
            const evaluadas = candidatas
                .map(key => evaluarColumnaCodPieza(data, key))
                .filter(info => info.valida);

            if (evaluadas.length === 0) return "";

            evaluadas.sort((a, b) => a.promedio - b.promedio || b.validos - a.validos);
            return evaluadas[0].key;
        }

        // Evalua si una columna parece contener codigos de pieza y su largo promedio.
        function evaluarColumnaCodPieza(data, key) {
            const valores = (data || [])
                .slice(0, 500)
                .map(row => String(row[key] ?? "").trim())
                .filter(Boolean);

            const codigos = valores.filter(esCodigoPiezaValido);
            const validos = codigos.length;
            const proporcion = valores.length > 0 ? validos / valores.length : 0;
            const promedio = validos > 0 ? codigos.reduce((total, value) => total + value.length, 0) / validos : Infinity;

            return {
                key,
                validos,
                promedio,
                valida: validos > 0 && proporcion >= 0.55
            };
        }

        // Un codigo de pieza valido debe tener letras y no ser solo numerico.
        function esCodigoPiezaValido(value) {
            const texto = String(value || "").trim().toUpperCase();
            if (!texto) return false;
            if (texto.length > 32) return false;
            if (/^\d+(?:[.,]\d+)?$/.test(texto)) return false;
            if (/^(LACAS|MELAMINICO|MELAMINICOS|MELAMINICA|TRUE|FALSE|YES|NO)$/.test(texto)) return false;
            return /[A-Z]/.test(texto) && /^[A-Z0-9/_+.* -]+$/.test(texto);
        }

        // Un codigo de mueble suele tener prefijo de letras y una medida, con accesorios opcionales.
        function esCodigoMuebleValido(value) {
            const texto = String(value || "").trim().toUpperCase();
            if (!texto || texto.length < 3 || texto.length > 70) return false;
            if (/^\d+(?:[.,]\d+)?$/.test(texto)) return false;
            if (/^(LACAS|MELAMINICO|MELAMINICOS|MELAMINICA|TRUE|FALSE|YES|NO)$/.test(texto)) return false;
            if (texto.includes("*") || texto.includes("DURAPLAC") || texto.includes("NOVOKOR") || texto.includes("TROPIKOR") || texto.includes("DURAFIBRA")) return false;
            return /^[A-Z][A-Z0-9.+/,-]*\d[A-Z0-9.+/,-]*$/.test(texto) && /[A-Z]{1,}/.test(texto);
        }

        // Elige material_nombre entre columnas J y L para todo el archivo.
        function elegirColumnaMaterialNombre(headers, data) {
            const candidatas = [CLAVE_COLUMNA_J, CLAVE_COLUMNA_L].filter(key => headers.includes(key));
            const evaluadas = candidatas
                .map(key => evaluarColumnaMaterialNombre(data, key))
                .filter(info => info.valida);

            if (evaluadas.length === 0) return "";

            evaluadas.sort((a, b) => b.promedio - a.promedio || b.validos - a.validos);
            return evaluadas[0].key;
        }

        // Evalua si una columna parece contener nombres/materiales descriptivos.
        function evaluarColumnaMaterialNombre(data, key) {
            const valores = (data || [])
                .slice(0, 500)
                .map(row => String(row[key] ?? "").trim())
                .filter(Boolean)
                .filter(value => !/^\d+(?:[.,]\d+)?$/.test(value));

            const validos = valores.length;
            const promedio = validos > 0 ? valores.reduce((total, value) => total + value.length, 0) / validos : 0;

            return {
                key,
                validos,
                promedio,
                valida: validos > 0 && promedio >= 3
            };
        }

        // Elige Tipo entre columnas B y M para todo el archivo.
        function elegirColumnaTipo(headers, data) {
            const candidatas = [CLAVE_COLUMNA_B, CLAVE_COLUMNA_M].filter(key => headers.includes(key));
            const evaluadas = candidatas
                .map(key => evaluarColumnaMaterialNombre(data, key))
                .filter(info => info.valida);

            if (evaluadas.length === 0) return "";

            evaluadas.sort((a, b) => b.promedio - a.promedio || b.validos - a.validos);
            return evaluadas[0].key;
        }

        // Normaliza nombres de columnas para comparar con mas tolerancia.
        function normalizarHeader(header) {
            // Convierte a texto comparable: sin tildes, espacios, guiones ni simbolos.
            return String(header || "")
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]/g, "");
        }

        // Verifica si un encabezado normalizado corresponde a una columna logica.
        function coincideHeader(headerNormalizado, col) {
            // Normaliza el nombre logico.
            const objetivo = normalizarHeader(col);

            // Compara contra el nombre logico.
            if (headerNormalizado === objetivo) return true;

            // Compara contra alias conocidos.
            if ((ALIAS_COLUMNAS[col] || []).some(alias => headerNormalizado === normalizarHeader(alias))) return true;

            // Compara por palabras clave para soportar encabezados exportados con textos nuevos.
            return coincideHeaderPorPalabras(headerNormalizado, col);
        }

        // Reconoce encabezados nuevos combinando palabras clave, no solo textos exactos.
        function coincideHeaderPorPalabras(header, col) {
            if (!header) return false;

            const tieneCodigo = header.includes("cod") || header.includes("codigo");
            const tieneCantidad = header.includes("cant") || header.includes("cantidad") || header.includes("antidad") || header.includes("num") || header.includes("numero") || header.includes("und") || header.includes("unidad");
            const tienePieza = header.includes("pieza") || header.includes("piezas") || header.includes("pza") || header.includes("pzas");
            const tieneMueble = header.includes("mueble") || header.includes("modulo") || header.includes("mod");

            if (col === "op") return header === "op" || header.includes("ordenproduccion") || header.includes("ordenprod") || header.includes("produccion");
            if (col === "Tipo") return header.includes("tipo") || header.includes("laca") || header.includes("melamin") || header.includes("acabado");
            if (col === "cod_mueble") return (tieneCodigo && tieneMueble) || header === "mueble" || header === "modulo";
            if (col === "cod_pieza") return (tieneCodigo && tienePieza) || header === "pieza" || header === "pza" || header === "pzas";
            if (col === "cant_piezas") return tieneCantidad && (tienePieza || header === "cant" || header === "cantidad" || header === "und" || header === "unidad");
            if (col === "material_nombre") return header.includes("material") || header.includes("tablero") || header.includes("descripcionmaterial");
            if (col === "nomueble" || col === "ubicacion" || col === "ubi") return header.includes("ubicacion") || header === "ubi" || header.includes("nomueble") || header.includes("numeromueble") || header.includes("nromueble");
            if (col === "medida1") return header === "m1" || header.includes("medida1") || header.includes("dimension1");
            if (col === "medida2") return header === "m2" || header.includes("medida2") || header.includes("dimension2");

            return false;
        }

        // Completa columnas no encontradas revisando patrones dentro de las filas.
        function aplicarInferenciaPorContenido(mapa, headers, data) {
            if (!Array.isArray(data) || data.length === 0) return;

            const columnasFisicas = obtenerColumnasFisicas(headers);

            const usadas = new Set(Object.values(mapa).filter(Boolean));
            marcarColumnasFisicasEquivalentes(usadas, columnasFisicas, data);

            completarPorContenido(mapa, "Tipo", columnasFisicas, data, usadas, puntuarTipoPorContenido, 0.45);
            completarPorContenido(mapa, "cod_mueble", columnasFisicas, data, usadas, puntuarCodigoMueblePorContenido, 0.6);
            completarPorContenido(mapa, "cod_pieza", columnasFisicas, data, usadas, puntuarCodigoPiezaPorContenido, 0.65);
            completarPorContenido(mapa, "cant_piezas", columnasFisicas, data, usadas, puntuarCantidadPorContenido, 0.75);
        }

        // Asigna una columna faltante si su contenido supera un puntaje minimo.
        function completarPorContenido(mapa, col, columnas, data, usadas, puntuar, minimo) {
            if (mapa[col]) return;

            let mejor = { key: "", score: 0 };

            columnas.forEach(key => {
                if (usadas.has(key)) return;

                const score = puntuarColumna(data, key, puntuar);
                if (score > mejor.score) mejor = { key, score };
            });

            if (mejor.key && mejor.score >= minimo) {
                mapa[col] = mejor.key;
                usadas.add(mejor.key);
            }
        }

        // Marca como usadas las columnas fisicas que duplican una columna ya detectada por encabezado.
        function marcarColumnasFisicasEquivalentes(usadas, columnasFisicas, data) {
            const columnasUsadas = Array.from(usadas).filter(key => !String(key).startsWith(PREFIJO_COLUMNA_FISICA));

            columnasUsadas.forEach(keyUsada => {
                columnasFisicas.forEach(keyFisica => {
                    if (usadas.has(keyFisica)) return;
                    if (columnasTienenMismosValores(data, keyUsada, keyFisica)) usadas.add(keyFisica);
                });
            });
        }

        // Comprueba si dos columnas tienen los mismos primeros valores utiles.
        function columnasTienenMismosValores(data, keyA, keyB) {
            let comparados = 0;
            let iguales = 0;

            data.slice(0, 80).forEach(row => {
                const a = String(row[keyA] ?? "").trim();
                const b = String(row[keyB] ?? "").trim();
                if (!a && !b) return;

                comparados++;
                if (a === b) iguales++;
            });

            return comparados > 0 && iguales / comparados >= 0.95;
        }

        // Calcula que tan parecida es una columna a un tipo de dato esperado.
        function puntuarColumna(data, key, puntuar) {
            const valores = data
                .slice(0, 120)
                .map(row => row[key])
                .map(value => String(value ?? "").trim())
                .filter(Boolean);

            if (valores.length === 0) return 0;

            const puntos = valores.reduce((total, value) => total + puntuar(value), 0);
            return puntos / valores.length;
        }

        // Puntua columnas que contienen LACAS, MELAMINICO u otro acabado.
        function puntuarTipoPorContenido(value) {
            const texto = normalizarHeader(value);
            if (texto.includes("laca") || texto.includes("melamin") || texto.includes("laminado")) return 1;
            if (texto.includes("crudo") || texto.includes("pintura") || texto.includes("acabado")) return 0.6;
            return 0;
        }

        // Puntua columnas con codigos de mueble como B60, A40DH5-TI-LBA-BF o BAR63H12P6.7.
        function puntuarCodigoMueblePorContenido(value) {
            const texto = String(value || "").trim().toUpperCase();
            if (/^[A-Z]{1,8}\d+(?:[A-Z0-9.+/-]*)$/.test(texto)) return texto.includes("-") || texto.includes("H") || texto.includes("P") ? 1 : 0.85;
            if (/^[A-Z]{1,8}\d/.test(texto)) return 0.7;
            return 0;
        }

        // Puntua columnas con codigos de pieza, normalmente textos cortos como PT, ESP1PT, BASE o LATRH1.
        function puntuarCodigoPiezaPorContenido(value) {
            const texto = String(value || "").trim().toUpperCase();
            if (!texto || texto.length > 24) return 0;
            if (/^\d+(?:[.,]\d+)?$/.test(texto)) return 0;
            if (/^(LACAS|MELAMINICO|MELAMINICOS|MELAMINICA)$/.test(texto)) return 0;
            if (/^[A-Z]{1,8}\d+(?:[A-Z0-9.+/-]*)$/.test(texto)) return 0.45;
            if (/^[A-Z0-9.+/-]{1,16}$/.test(texto) && /[A-Z]/.test(texto)) return 1;
            return 0.15;
        }

        // Puntua columnas de cantidad de piezas: enteros positivos pequenos y repetidos.
        function puntuarCantidadPorContenido(value) {
            const texto = String(value || "").trim().replace(",", ".");
            if (!/^\d+(?:\.\d+)?$/.test(texto)) return 0;

            const numero = Number(texto);
            if (!Number.isFinite(numero)) return 0;
            if (!Number.isInteger(numero)) return 0.15;
            if (numero >= 1 && numero <= 20) return 1;
            if (numero >= 0 && numero <= 50) return 0.45;
            return 0;
        }

        // Obtiene un valor desde una fila usando el nombre logico de columna.
        function val(row, col) {
            // Devuelve el valor usando el mapa global activo.
            return valConMapa(row, col, MAPA_COLUMNAS);
        }

        // Obtiene un valor usando un mapa de columnas especifico.
        function valConMapa(row, col, mapa) {
            // Busca el nombre real de la columna.
            const key = mapa[col];

            // Si no existe esa columna, devuelve vacio.
            if (!key) return "";

            // Toma el valor real desde la fila.
            const value = row[key];

            // Para JOB/JOV muestra el contenido real leido entre AI y AJ.
            if (col === "jov") return limpiarTextoJob(value);

            // Convierte null o undefined a texto vacio.
            return value !== undefined && value !== null ? String(value).trim() : "";
        }

        // Obtiene el JOB/JOV desde AI o AJ segun donde este la columna real del archivo.
        function obtenerJobDesdeAiAj(row, headers) {
            const headerAi = normalizarHeader(headers[INDICE_COLUMNA_AI] || "");
            const headerAj = normalizarHeader(headers[INDICE_COLUMNA_AJ] || "");
            const valorAi = row[INDICE_COLUMNA_AI] ?? "";
            const valorAj = row[INDICE_COLUMNA_AJ] ?? "";

            if (headerAi === "job" || headerAi === "jov") return limpiarTextoJob(valorAi) || limpiarTextoJob(valorAj);
            if (headerAj === "job" || headerAj === "jov") return limpiarTextoJob(valorAj) || limpiarTextoJob(valorAi);

            return limpiarTextoJob(valorAi) || limpiarTextoJob(valorAj);
        }

        // Limpia el texto JOB/JOV sin quitarle contenido.
        function limpiarTextoJob(value) {
            return value !== undefined && value !== null ? String(value).trim() : "";
        }

        // Devuelve el nombre descriptivo de un codigo.
// Recompone tokens que contienen guion pero deben leerse como una sola regla.
// Normaliza S-P como S/P porque siempre significa Sin Puerta.
// Separa el codigo principal aunque el tipo tenga guiones, como IS-CUB126H85P6-SI.
// Interpreta el codigo tecnico principal y sus accesorios.
// Separa casos como LATRH1 o LX2LH243.6P8, donde H/P marca altura/profundidad.
// Interpreta detalles pegados despues del ancho, como IH36 o H12P6.7S/P.
// Traduce el tipo inicial del modulo.
// Traduce apertura I/D.
// Traduce codigos compactos de repisas como 1RP.
// Traduce codigos compactos de gavetas como G6.
// Devuelve altura por defecto segun la familia del modulo.
// Traduce codigos de profundidad como P6.7 en milimetros.
// Obtiene dimensiones compactas desde el codigo, como 625X950X600.
// Obtiene dimensiones numericas del modulo desde el codigo.
// Convierte numeros de nomenclatura a milimetros: 50 -> 500, 62.5 -> 625.
// Extrae altura en milimetros desde un texto que contenga Hnumero.
// Extrae profundidad en milimetros desde un texto que contenga Pnumero.
// Convierte el numero despues de P a profundidad total.
// Convierte profundidad total de codigo a profundidad de estructura para validar piezas.
// Devuelve profundidad de estructura cuando el codigo no trae P explicita.
// Alturas por defecto para piezas compactas que no tienen ancho de modulo, como LATRH1 o LXTRP7.
// Profundidades por defecto para laterales decorativos y piezas compactas.
// Traduce codigos de altura como H4, H5 o H36.
// Traduce un token usando primero el diccionario completo.
// Detecta Tiradera Interna como token separado o al final del codigo.
// Detecta un token separado por guion o signo mas dentro del codigo.
// Devuelve una descripcion de DB sin repetir partes separadas por slash.
// Devuelve solo la descripcion de altura cuando la DB incluye tambien el numero suelto.
// Busca el token mas largo conocido al inicio de un texto compacto.
// Renderiza todos los muebles agrupados por OP.
        function renderizar(data) {
            // Limpia la lista anterior.
            listaEl.textContent = "";

            // Si no hay resultados, muestra estado vacio.
            if (data.length === 0) {
                mostrarEstadoVacio("Sin resultados", "No hay muebles que coincidan con los filtros.");
                actualizarStats(0, 0);
                return;
            }

            // Agrupa las filas por OP y luego por codigo de mueble.
            const porOP = agruparPorOpYMueble(data);

            // Cuenta cuantos muebles se van creando.
            let totalMuebles = 0;

            // Crea un fragmento para insertar todo de una sola vez.
            const fragment = document.createDocumentFragment();

            // Recorre OP ordenadas alfabeticamente.
            Object.keys(porOP).sort(compararNatural).forEach(op => {
                // Crea el bloque visual de la OP.
                const opBlock = crearElemento("section", "op-block");

                // Crea el titulo de la OP.
                const opTitle = crearElemento("div", "op-title", `OP: ${op}`);

                // Agrega el titulo al bloque.
                opBlock.appendChild(opTitle);

                // Recorre los muebles dentro de la OP, mostrando primero los especiales.
                Object.keys(porOP[op]).sort((a, b) => compararMueblesPorEspecial(porOP[op], a, b)).forEach(cod => {
                    // Toma las piezas del mueble.
                    const items = porOP[op][cod];

                    // Crea la tarjeta visual.
                    const tarjeta = crearTarjetaMueble(op, cod, items);

                    // Agrega la tarjeta al bloque de OP.
                    opBlock.appendChild(tarjeta);

                    // Suma un mueble al total.
                    totalMuebles++;
                });

                // Agrega el bloque al fragmento.
                fragment.appendChild(opBlock);
            });

            // Inserta todo en pantalla.
            listaEl.appendChild(fragment);

            // Muestra barra de estadisticas.
            statsEl.style.display = "flex";

            // Actualiza contadores.
            actualizarStats(totalMuebles, totalMuebles);

            // Aplica filtros activos si existian.
            filtrarUniversal();

            // Si ya se habia validado, vuelve a validar la vista nueva.
            if (VALIDADO) validarTodo();
        }

        // Agrupa filas por OP y codigo de mueble.
        function agruparPorOpYMueble(data) {
            // Objeto final de grupos.
            const grupos = {};

            // Recorre cada fila original.
            data.forEach(row => {
                // Obtiene OP o asigna valor por defecto.
                const op = val(row, "op") || "Sin OP";

                // Crea grupo de OP si no existe.
                if (!grupos[op]) grupos[op] = {};

                // Obtiene codigo de mueble o asigna valor por defecto.
                const cod = val(row, "cod_mueble") || "Sin codigo";

                // Crea grupo de mueble si no existe.
                if (!grupos[op][cod]) grupos[op][cod] = [];

                // Agrega la fila al grupo.
                grupos[op][cod].push(row);
            });

            // Devuelve la estructura agrupada.
            return grupos;
        }

        // Ordena primero muebles con piezas especiales y luego los normales.
        function compararMueblesPorEspecial(grupoOP, codA, codB) {
            // Detecta especiales en cada mueble.
            const especialesA = obtenerEspecialesDesdeItems(grupoOP[codA]);
            const especialesB = obtenerEspecialesDesdeItems(grupoOP[codB]);

            // Prioriza cualquier mueble con especiales.
            if (especialesA.length && !especialesB.length) return -1;
            if (!especialesA.length && especialesB.length) return 1;

            // Si ambos tienen especiales, ordena por el numero especial mas bajo.
            if (especialesA.length && especialesB.length) {
                const minA = Math.min(...especialesA);
                const minB = Math.min(...especialesB);
                if (minA !== minB) return minA - minB;
            }

            // Mantiene el orden natural para el resto.
            return compararNatural(codA, codB);
        }

        // Extrae numeros especiales desde COD_PIEZA, por ejemplo ESP3PT => 3.
        function obtenerEspecialesDesdeItems(items) {
            // Evita repetidos y permite ordenar por numero.
            const especiales = new Set();

            // Revisa todas las piezas del mueble.
            items.forEach(row => {
                // Toma el codigo de pieza normalizado.
                const pieza = String(val(row, "cod_pieza") || "").toUpperCase();

                // Busca cualquier ESP seguido de numero.
                const matches = pieza.matchAll(/\bESP\s*[-_]*\s*(\d+)/g);

                // Agrega los numeros encontrados.
                for (const match of matches) especiales.add(Number(match[1]));
            });

            // Devuelve lista unica ordenada.
            return Array.from(especiales).filter(Number.isFinite).sort((a, b) => a - b);
        }

        // Crea la tarjeta de un mueble con encabezado, tabla y zona de validacion.
        function crearTarjetaMueble(op, cod, items) {
            // Calcula descripcion del codigo.
            const nombre = obtenerNombre(cod);

            // Calcula dimensiones completas interpretadas desde el codigo.
            const dimensionesModulo = obtenerDimensionesModulo(cod);

            // Detecta ancho desde el codigo, usando primero la lectura estructurada.
            const anchoCalculado = dimensionesModulo.ancho || detectarAncho(cod);

            // Obtiene el primer tipo no vacio.
            const tipoVal = items.map(r => val(r, "Tipo")).find(t => t.trim() !== "") || "";

            // Obtiene el primer material no vacio desde la columna L.
            const materialNombre = obtenerPrimerValor(items, ["material_nombre"]);

            // Obtiene la ubicacion desde columnas posibles del archivo.
            const ubicacion = obtenerPrimerValor(items, ["ubicacion", "ubi", "nomueble"]);

            // Obtiene el grosor desde materiales de piezas estructurales.
            const grosorMaterial = obtenerGrosorMaterialDesdeItems(items);

            // Detecta piezas especiales del mueble, por ejemplo ESP3PT.
            const especiales = obtenerEspecialesDesdeItems(items);

            // Genera texto universal para filtros.
            const textoUniversal = construirTextoUniversal(op, cod, nombre, items);

            // Crea contenedor principal del mueble.
            const card = crearElemento("article", "mueble-container");

            // Guarda datos seguros en dataset.
            card.dataset.ancho = String(anchoCalculado);
            card.dataset.alto = String(dimensionesModulo.alto || 0);
            card.dataset.profundidad = String(dimensionesModulo.profundidad || 0);
            card.dataset.profundidadEstructura = String(dimensionesModulo.profundidadEstructura || dimensionesModulo.profundidad || 0);
            card.dataset.grosorMaterial = String(grosorMaterial);
            card.dataset.tiraderaInterna = tieneTiraderaInterna(cod) ? "1" : "0";
            card.dataset.tpm = tieneTokenCodigo(cod, "TPM") ? "1" : "0";
            card.dataset.tipoModulo = dimensionesModulo.tipo || "";
            card.dataset.codpuro = cod;
            card.dataset.tipo = tipoVal.toUpperCase();
            card.dataset.op = op;
            card.dataset.universal = textoUniversal;
            card.dataset.piezas = String(items.length);
            card.dataset.especial = especiales.length ? "1" : "0";

            // Crea encabezado visual.
            card.appendChild(crearEncabezadoMueble(op, cod, nombre, tipoVal, materialNombre, ubicacion, grosorMaterial, especiales));

            // Crea contenedor para errores de validacion.
            const validationList = crearElemento("div", "validation-list");
            validationList.setAttribute("aria-live", "polite");
            card.appendChild(validationList);

            // Crea tabla de piezas.
            card.appendChild(crearTabla(items));

            // Devuelve tarjeta completa.
            return card;
        }

        // Crea el encabezado de una tarjeta.
        function crearEncabezadoMueble(op, cod, nombre, tipoVal, materialNombre, ubicacion, grosorMaterial, especiales = []) {
            // Crea contenedor de encabezado.
            const header = crearElemento("div", "mueble-header");

            // Crea columna izquierda.
            const titleWrap = crearElemento("div", "mueble-title");

            // Crea linea de codigo y ubicacion.
            const codLine = crearElemento("div", "cod-line");

            // Crea codigo visible.
            codLine.appendChild(crearElemento("div", "cod-mueble", cod));

            // Agrega dimensiones interpretadas al lado del codigo si existen.
            const dimensiones = obtenerDimensionesCodigo(cod);
            if (dimensiones) codLine.appendChild(crearElemento("span", "dim-tag", dimensiones));

            // Agrega grosor usado para calculos al lado de las dimensiones.
            if (grosorMaterial) codLine.appendChild(crearElemento("span", "thickness-tag", `(${grosorMaterial})`));

            // Agrega ubicacion al lado del codigo si existe.
            if (ubicacion) codLine.appendChild(crearElemento("span", "ubi-tag", formatearUbicacion(ubicacion)));

            // Agrega linea de codigo a la columna izquierda.
            titleWrap.appendChild(codLine);

            // Crea linea de descripcion visible con especiales antes del subtitulo.
            const descLine = crearElemento("div", "desc-line");

            // Agrega etiquetas especiales si existen.
            especiales.forEach(numero => {
                descLine.appendChild(crearElemento("span", "special-tag", `Especial ${numero}`));
            });

            // Agrega la descripcion del codigo.
            descLine.appendChild(crearElemento("span", "desc-tag", nombre));

            // Inserta subtitulo en la columna izquierda.
            titleWrap.appendChild(descLine);

            // Crea columna derecha del encabezado.
            const headerMeta = crearElemento("div", "header-meta");

            // Crea contenedor de badges.
            const badges = crearElemento("div", "badges");

            // Agrega badge de OP.
            badges.appendChild(crearElemento("span", "badge badge-op", `OP: ${op}`));

            // Agrega badge de tipo si existe.
            if (tipoVal) badges.appendChild(crearElemento("span", "badge badge-tipo", tipoVal));

            // Agrega badges a la columna derecha.
            headerMeta.appendChild(badges);

            // Agrega material debajo de OP y Tipo si existe.
            if (materialNombre) headerMeta.appendChild(crearElemento("div", "material-tag", materialNombre));

            // Une titulo y columna derecha.
            header.appendChild(titleWrap);
            header.appendChild(headerMeta);

            // Devuelve encabezado.
            return header;
        }

        // Crea la tabla de piezas del mueble.
        function crearTabla(items) {
            // Crea contenedor con desplazamiento horizontal.
            const wrap = crearElemento("div", "table-wrap");

            // Crea tabla.
            const table = document.createElement("table");

            // Crea encabezado.
            const thead = document.createElement("thead");

            // Crea fila de encabezado.
            const headRow = document.createElement("tr");

            // Agrega una columna minima para marcar filas validadas.
            const checkHead = document.createElement("th");
            checkHead.className = "check-col";
            checkHead.setAttribute("aria-label", "Validada");
            headRow.appendChild(checkHead);

            // Agrega solo las columnas visibles de la tabla.
            COLS_TABLA.forEach(col => {
                const th = document.createElement("th");
                th.textContent = LABEL_COLUMNAS[col] || col;
                headRow.appendChild(th);
            });

            // Inserta fila al encabezado.
            thead.appendChild(headRow);

            // Crea cuerpo de tabla.
            const tbody = document.createElement("tbody");

            // Crea filas de datos.
            items.forEach(row => {
                const tr = document.createElement("tr");

                // Celda compacta donde se marcara si esta fila fue comparada.
                const checkTd = document.createElement("td");
                checkTd.className = "check-cell";
                checkTd.dataset.col = "__check";
                tr.appendChild(checkTd);

                COLS_TABLA.forEach(col => {
                    const td = document.createElement("td");
                    td.textContent = val(row, col);
                    td.dataset.col = col;
                    if (COLS_NUMERICAS.has(col)) td.classList.add("num");
                    tr.appendChild(td);
                });

                tbody.appendChild(tr);
            });

            // Une partes de tabla.
            table.appendChild(thead);
            table.appendChild(tbody);
            wrap.appendChild(table);

            // Devuelve tabla envuelta.
            return wrap;
        }

        // Filtra todos los muebles usando los cuatro filtros como condiciones AND.
        function filtrarUniversal() {
            // Lee filtros activos en mayusculas.
            const filtros = ["f1", "f2", "f3", "f4"]
                .map(id => document.getElementById(id).value.toUpperCase().trim())
                .filter(Boolean);

            // Busca todas las tarjetas de muebles.
            const contenedores = document.querySelectorAll(".mueble-container");

            // Inicializa contador visible.
            let visibles = 0;

            // Inicializa contador de piezas visibles.
            let piezasVisibles = 0;

            // Inicializa contador de piezas totales.
            let piezasTotal = 0;

            // Recorre cada tarjeta y decide si mostrarla.
            contenedores.forEach(div => {
                const texto = div.dataset.universal || "";
                const mostrar = filtros.every(filtro => texto.includes(filtro));
                const piezas = Number.parseInt(div.dataset.piezas, 10) || 0;
                piezasTotal += piezas;
                div.style.display = mostrar ? "" : "none";
                if (mostrar) {
                    visibles++;
                    piezasVisibles += piezas;
                }
            });

            // Oculta bloques de OP que quedaron sin muebles visibles.
            document.querySelectorAll(".op-block").forEach(block => {
                const hayVisible = [...block.querySelectorAll(".mueble-container")].some(card => card.style.display !== "none");
                block.style.display = hayVisible ? "" : "none";
            });

            // Actualiza contadores.
            actualizarStats(visibles, contenedores.length, piezasVisibles, piezasTotal);
        }

        // Limpia los filtros y vuelve a mostrar todos los muebles.
        function limpiarFiltros() {
            // Vacia los cuatro campos de filtro.
            ["f1", "f2", "f3", "f4"].forEach(id => {
                document.getElementById(id).value = "";
            });

            // Reaplica el filtro sin condiciones.
            filtrarUniversal();
        }

        // Muestra el nombre del documento cargado bajo el titulo principal.
        function actualizarNombreDocumento(nombre) {
            documentNameEl.textContent = nombre ? `Documento: ${nombre}` : "Carga un archivo Excel o CSV para comenzar.";
        }

        // Activa o desactiva la franja para comparar dos archivos.
        function alternarModoComparacion() {
            // Alterna clase visible del panel.
            const activo = !comparePanelEl.classList.contains("show");
            comparePanelEl.classList.toggle("show", activo);

            // Actualiza texto del boton.
            document.getElementById("btn-modo-comparar").textContent = activo ? "Ocultar comparacion" : "Comparar archivos";

            // Mensaje inicial cuando se abre.
            if (activo && DATA_BASE_COMPARACION.length === 0) {
                compareResultEl.textContent = "Carga el archivo base. Luego se habilitara el segundo archivo para comparar.";
            }
        }

        // Maneja la carga del archivo base de comparacion.
        function manejarArchivoBaseComparacion(event) {
            // Toma el archivo seleccionado.
            const file = event.target.files[0];

            // Si no hay archivo, termina.
            if (!file) return;

            // Limpia estado previo de comparacion.
            DATA_ARCHIVO_COMPARAR = [];
            MAPA_ARCHIVO_COMPARAR = {};
            uploadCompararEl.value = "";
            uploadCompararEl.disabled = true;
            labelUploadCompararEl.classList.add("disabled");
            compareResultEl.textContent = "Leyendo archivo base...";

            // Lee archivo base.
            leerArchivoComoData(file)
                .then(data => {
                    DATA_BASE_COMPARACION = data;
                    MAPA_BASE_COMPARACION = data.length > 0 ? crearMapaColumnas(Object.keys(data[0]), data) : {};

                    // Muestra el archivo base en la vista principal para revisarlo.
                    DATA_GLOBAL = data;
                    MAPA_COLUMNAS = MAPA_BASE_COMPARACION;
                    limpiarAvisos();
                    actualizarNombreDocumento(file.name);
                    mostrarAvisosDeColumnas();
                    renderizar(DATA_GLOBAL);

                    // Habilita segundo archivo.
                    uploadCompararEl.disabled = false;
                    labelUploadCompararEl.classList.remove("disabled");
                    compareResultEl.textContent = `Archivo base cargado: ${file.name}. Ahora carga el archivo a comparar.`;
                })
                .catch(error => {
                    compareResultEl.textContent = "No se pudo leer el archivo base.";
                    console.error(error);
                });
        }

        // Maneja la carga del segundo archivo y ejecuta la comparacion.
        function manejarArchivoComparar(event) {
            // Toma el archivo seleccionado.
            const file = event.target.files[0];

            // Si no hay archivo o falta base, termina.
            if (!file || DATA_BASE_COMPARACION.length === 0) return;

            // Mensaje de espera.
            compareResultEl.textContent = "Comparando archivos...";

            // Lee segundo archivo.
            leerArchivoComoData(file)
                .then(data => {
                    DATA_ARCHIVO_COMPARAR = data;
                    MAPA_ARCHIVO_COMPARAR = data.length > 0 ? crearMapaColumnas(Object.keys(data[0]), data) : {};
                    const resultado = compararArchivos(DATA_BASE_COMPARACION, MAPA_BASE_COMPARACION, DATA_ARCHIVO_COMPARAR, MAPA_ARCHIVO_COMPARAR);
                    mostrarResultadoComparacion(resultado, file.name);
                })
                .catch(error => {
                    compareResultEl.textContent = "No se pudo leer el archivo a comparar.";
                    console.error(error);
                });
        }

        // Compara dos archivos por piezas y medidas principales.
        function compararArchivos(baseRows, baseMap, compareRows, compareMap) {
            // Crea indices de ambos archivos.
            const baseIndex = crearIndiceComparacion(baseRows, baseMap);
            const compareIndex = crearIndiceComparacion(compareRows, compareMap);

            // Listas de resultado.
            const faltan = [];
            const sobran = [];
            const cambiadas = [];

            // Revisa piezas del archivo base contra el segundo.
            baseIndex.forEach((baseItem, key) => {
                const compareItem = compareIndex.get(key);
                if (!compareItem) {
                    faltan.push(baseItem);
                    return;
                }
                if (baseItem.firma !== compareItem.firma) {
                    cambiadas.push({ base: baseItem, comparar: compareItem });
                }
            });

            // Revisa piezas nuevas del segundo archivo.
            compareIndex.forEach((compareItem, key) => {
                if (!baseIndex.has(key)) sobran.push(compareItem);
            });

            // Devuelve resumen.
            return {
                baseTotal: baseRows.length,
                compararTotal: compareRows.length,
                faltan,
                sobran,
                cambiadas
            };
        }

        // Crea indice para comparar piezas.
        function crearIndiceComparacion(rows, mapa) {
            // Mapa final.
            const index = new Map();

            // Cuenta repeticiones por clave para manejar piezas duplicadas.
            const repetidos = new Map();

            // Recorre cada fila.
            rows.forEach((row, idx) => {
                const item = crearItemComparacion(row, mapa, idx + 1);
                const key = item.key;

                // Agrega sufijo por repeticion para no pisar filas duplicadas.
                const repeticion = (repetidos.get(key) || 0) + 1;
                repetidos.set(key, repeticion);
                const finalKey = repeticion > 1 ? `${key}#${repeticion}` : key;
                index.set(finalKey, item);
            });

            // Devuelve indice.
            return index;
        }

        // Crea una fila normalizada para comparar.
        function crearItemComparacion(row, mapa, fila) {
            // Identidad de pieza.
            const op = valConMapa(row, "op", mapa) || "Sin OP";
            const codMueble = valConMapa(row, "cod_mueble", mapa) || "Sin codigo";
            const codPieza = valConMapa(row, "cod_pieza", mapa) || "Sin pieza";
            const nomueble = valConMapa(row, "nomueble", mapa);
            const jov = valConMapa(row, "jov", mapa);

            // Valores que deben coincidir.
            const valores = ["cant_piezas", "medida1", "medida2", "l1", "l2", "c1", "c2"]
                .map(col => `${col}:${valConMapa(row, col, mapa)}`)
                .join("|");

            // Devuelve objeto comparativo.
            return {
                fila,
                key: [op, codMueble, codPieza, nomueble, jov].map(normalizarComparacion).join("|"),
                firma: valores,
                etiqueta: `OP ${op} - ${codMueble} - ${codPieza}${nomueble ? ` - ${formatearUbicacion(nomueble)}` : ""}`
            };
        }

        // Normaliza texto para comparar.
        function normalizarComparacion(value) {
            // Convierte a texto uniforme.
            return String(value || "").toUpperCase().trim().replace(/\s+/g, " ");
        }

        // Muestra resumen y detalles de comparacion.
        function mostrarResultadoComparacion(resultado, nombreArchivo) {
            // Crea texto resumen.
            compareResultEl.textContent = `Comparado con ${nombreArchivo}: ${resultado.faltan.length} faltan, ${resultado.sobran.length} sobran, ${resultado.cambiadas.length} cambiadas. Piezas base: ${resultado.baseTotal}. Piezas comparadas: ${resultado.compararTotal}.`;

            // Limpia avisos anteriores.
            limpiarAvisos();

            // Crea detalle breve en la zona superior de resultados.
            const detalle = crearElemento("div", "notice");
            const partes = [];
            partes.push(`Comparacion: ${resultado.faltan.length} faltan, ${resultado.sobran.length} sobran, ${resultado.cambiadas.length} cambiadas.`);
            partes.push(...resultado.faltan.slice(0, 8).map(item => `Falta: ${item.etiqueta}`));
            partes.push(...resultado.sobran.slice(0, 8).map(item => `Sobra: ${item.etiqueta}`));
            partes.push(...resultado.cambiadas.slice(0, 8).map(item => `Cambia: ${item.base.etiqueta}`));

            // Agrega nota si hay mas detalles.
            const totalDetalles = resultado.faltan.length + resultado.sobran.length + resultado.cambiadas.length;
            if (totalDetalles > 24) partes.push(`Hay ${totalDetalles - 24} diferencias adicionales no mostradas en este resumen.`);

            // Inserta detalle como texto.
            detalle.textContent = partes.join(" | ");
            avisosEl.appendChild(detalle);
        }

        // Descifra el codigo escrito en el consultor independiente.
        function consultarCodigoMueble() {
            // Lee el codigo escrito.
            const codigo = document.getElementById("codigo-consulta").value.trim();

            // Busca el contenedor de resultado.
            const resultado = document.getElementById("resultado-codigo");

            // Si no hay codigo, muestra mensaje inicial.
            if (!codigo) {
                resultado.textContent = "Escribe un codigo para ver como se lee.";
                return;
            }

            // Muestra la lectura usando el mismo traductor de las tarjetas.
            resultado.textContent = obtenerNombre(codigo);
        }

        // Obtiene el primer valor no vacio de una lista de columnas posibles.
        function obtenerPrimerValor(items, columnas) {
            // Recorre filas del mueble.
            for (const row of items) {
                // Recorre columnas candidatas.
                for (const col of columnas) {
                    // Lee el valor con el mapeo normal.
                    const value = val(row, col);

                    // Devuelve el primer valor util.
                    if (value) return value;
                }
            }

            // Si no encuentra nada, devuelve vacio.
            return "";
        }

        // Da formato uniforme a la ubicacion junto al codigo del mueble.
        function formatearUbicacion(ubicacion) {
            // Convierte a texto limpio.
            let texto = String(ubicacion || "").trim();

            // Quita la palabra Ubi si venia en el archivo.
            texto = texto.replace(/^ubi\s*/i, "").trim();

            // Si viene solo numero, lo muestra como referencia de columna C.
            if (/^\d+$/.test(texto)) texto = `C${texto}`;

            // Muestra solo la ubicacion entre parentesis.
            return texto ? `(${texto})` : "";
        }

        // Valida la estructura de todos los muebles renderizados.
// Salta al siguiente mueble con falla cada vez que se pulsa el contador de errores.
// Valida un solo mueble y devuelve lista de errores.
// Limpia clases y mensajes de una validacion anterior.
// Muestra errores dentro de la tarjeta.
// Actualiza el badge OK/Error de una tarjeta.
// Agrega un check pequeno a la primera celda de una fila validada.
// Agrega checks junto a MEDIDA1/MEDIDA2 cuando coinciden con valores esperados.
// Devuelve profundidad esperada segun tipo de mueble.
// Valida una pieza contra las medidas esperadas del modulo.
// Extrae el grosor desde JOB/JOV en filas de base, techo o ajustes.
// Extrae el grosor del material guardado en la tarjeta.
// Profundidad por defecto para repisas moviles segun la estructura del modulo.
// Detecta codigos donde solo se pudo leer ancho y una segunda dimension.
// Extrae un numero de grosor desde codigos/materiales como CPCP18CO.
// Piezas cuyo JOB/JOV define el grosor general del modulo.
// Normaliza nombres de piezas para detectar familias.
// Detecta bases y techos.
// Detecta puertas principales PT sin confundir piezas especiales de puerta abatible.
// Detecta frentes de cajon, incluso cuando vienen con prefijo especial como ESP4FC.
// Detecta zocalos de melamina o laca.
// Detecta orejas tipo puerta OTP.
// Detecta repisas portacopas, que manejan profundidad propia de 280 mm.
// Detecta maleteras.
// Detecta repisas tapa, REPT, REPTA y variantes.
// Detecta bases con codigos completos o abreviados, como BAS, BA o E-BAS-DEC-TI.
// Detecta techos con codigos completos o abreviados.
// Detecta bases con tiradera interna, como BAS-TI o E-BAS-DEC-TI.
// Detecta ajustes AJ.
// Detecta laterales principales.
// Detecta respaldos.
// Detecta repisas moviles, que descuentan 1 mm adicional de ancho.
// Detecta repisas normales o fijas sin confundirlas con repisas moviles.
// Detecta piezas planas que solo necesitan ancho y alto, como forramientos FXTR.
// Detecta la pieza TPM, que tiene descuento propio de profundidad.
// Compara un par de medidas sin importar el orden en la tabla.
// Muestra una medida o guion si no es numerica.
// Detecta si una pieza debe validar ancho.
// Detecta si una pieza debe validar profundidad.
// Compara una medida con una esperada usando tolerancia.
// Obtiene texto de una celda segun su columna.
// Obtiene numero de una celda segun su columna.
// Detecta ancho desde el codigo del mueble.
// Construye texto de busqueda para los filtros universales.
        function construirTextoUniversal(op, cod, nombre, items) {
            // Une datos principales.
            const base = [op, cod, nombre].join(" ");

            // Une todos los valores de las filas.
            const filas = items.map(row => Object.values(row).join(" ")).join(" ");

            // Devuelve todo en mayusculas para comparar facil.
            return `${base} ${filas}`.toUpperCase();
        }

        // Actualiza contadores visibles.
        function actualizarStats(visibles, total, piezasVisibles = null, piezasTotal = null) {
            // Actualiza contador visible.
            document.getElementById("vis-count").textContent = String(visibles);

            // Actualiza contador total.
            document.getElementById("total-count").textContent = String(total);

            // Calcula piezas desde las tarjetas si no se enviaron valores.
            if (piezasVisibles === null || piezasTotal === null) {
                const contenedores = document.querySelectorAll(".mueble-container");
                piezasVisibles = 0;
                piezasTotal = 0;
                contenedores.forEach(div => {
                    const piezas = Number.parseInt(div.dataset.piezas, 10) || 0;
                    piezasTotal += piezas;
                    if (div.style.display !== "none") piezasVisibles += piezas;
                });
            }

            // Actualiza contador de piezas visible.
            document.getElementById("vis-piece-count").textContent = String(piezasVisibles);

            // Actualiza contador de piezas total.
            document.getElementById("total-piece-count").textContent = String(piezasTotal);
        }

        // Muestra avisos sobre columnas faltantes.
        function mostrarAvisosDeColumnas() {
            // Busca columnas requeridas que no se encontraron.
            const faltantes = COLS_REQUERIDAS.filter(col => !MAPA_COLUMNAS[col]);

            // Si no falta nada, oculta chip y termina.
            if (faltantes.length === 0) {
                chipWarnEl.style.display = "none";
                return;
            }

            // Muestra chip de advertencia.
            chipWarnEl.textContent = `Faltan columnas: ${faltantes.join(", ")}`;
            chipWarnEl.style.display = "";

            // Crea aviso completo.
            const notice = crearElemento("div", "notice", `Advertencia: no se encontraron estas columnas requeridas: ${faltantes.join(", ")}. La tabla se mostrara, pero la validacion puede quedar incompleta.`);

            // Inserta aviso.
            avisosEl.appendChild(notice);
        }

        // Limpia todos los avisos generales.
        function limpiarAvisos() {
            // Borra avisos.
            avisosEl.textContent = "";

            // Oculta chip de advertencia.
            chipWarnEl.style.display = "none";
        }

        // Muestra un error general en la zona de lista.
        function mostrarErrorGeneral(mensaje) {
            // Limpia la lista.
            listaEl.textContent = "";

            // Crea aviso visible.
            const errorBox = crearElemento("div", "notice", mensaje);

            // Inserta aviso.
            listaEl.appendChild(errorBox);
        }

        // Muestra estado vacio reutilizable.
        function mostrarEstadoVacio(titulo, texto) {
            // Limpia la lista.
            listaEl.textContent = "";

            // Crea contenedor vacio.
            const empty = crearElemento("div", "empty");

            // Crea titulo.
            const h3 = document.createElement("h3");
            h3.textContent = titulo;

            // Crea parrafo.
            const p = document.createElement("p");
            p.textContent = texto;

            // Une elementos.
            empty.appendChild(h3);
            empty.appendChild(p);
            listaEl.appendChild(empty);
        }

        // Crea un elemento HTML seguro con clase y texto opcionales.
        function crearElemento(tag, className = "", text = "") {
            // Crea el elemento indicado.
            const el = document.createElement(tag);

            // Agrega clases si existen.
            if (className) el.className = className;

            // Agrega texto seguro si existe.
            if (text) el.textContent = text;

            // Devuelve elemento listo.
            return el;
        }

        // Orden natural para mezclar texto y numeros de forma mas humana.
        function compararNatural(a, b) {
            // Usa comparacion local con sensibilidad numerica.
            return String(a).localeCompare(String(b), "es", { numeric: true, sensitivity: "base" });
        }
