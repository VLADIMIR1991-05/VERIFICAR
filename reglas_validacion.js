// reglas_validacion.js
// Reglas de validacion de medidas por tipo de pieza.
// Para agregar una condicion nueva, normalmente se edita validarMedidasPieza()
// y se agrega un detector pequeno debajo, como esPuerta(), esZocalo(), etc.

function validarTodo() {
            // Marca que la vista ya fue validada.
            VALIDADO = true;
            INDICE_ERROR_ACTUAL = -1;

            // Contadores de resultado.
            let countOk = 0;
            let countErr = 0;
            let countSinRegla = 0;

            // Recorre cada tarjeta de mueble.
            document.querySelectorAll(".mueble-container").forEach(card => {
                // Limpia estado anterior.
                limpiarEstadoValidacion(card);

                // Ejecuta validacion de una tarjeta.
                const errores = validarMueble(card);

                // Aplica estado visual segun resultado.
                if (errores.length > 0) {
                    card.classList.add("err");
                    mostrarErroresEnTarjeta(card, errores);
                    countErr++;
                } else if (card.dataset.sinRegla === "1") {
                    card.classList.add("sinregla");
                    countSinRegla++;
                } else {
                    card.classList.add("ok");
                    countOk++;
                }

                // Actualiza badge de estado.
                actualizarBadgeEstado(card, errores.length === 0, card.dataset.sinRegla === "1" && errores.length === 0);

                // Agrega avisos de coleccion (amarillos, no cuentan como error).
                if (typeof mostrarAvisosColeccion === "function") mostrarAvisosColeccion(card);
            });

            // Actualiza chips de resumen.
            chipOkEl.textContent = countSinRegla ? `${countOk} OK · ${countSinRegla} sin regla` : `${countOk} OK`;
            chipErrEl.textContent = `${countErr} con errores`;
            chipOkEl.style.display = countOk > 0 ? "" : "none";
            chipErrEl.style.display = countErr > 0 ? "" : "none";
            chipErrEl.style.cursor = countErr > 0 ? "pointer" : "";
            chipErrEl.title = countErr > 0 ? "Click para ir al siguiente mueble con falla" : "";
        }

function irAlSiguienteError() {
            const errores = Array.from(document.querySelectorAll(".mueble-container.err"))
                .filter(card => card.offsetParent !== null);

            if (errores.length === 0) return;

            INDICE_ERROR_ACTUAL = (INDICE_ERROR_ACTUAL + 1) % errores.length;
            const destino = errores[INDICE_ERROR_ACTUAL];

            destino.scrollIntoView({ behavior: "smooth", block: "center" });
            destino.classList.add("pulse-error");
            window.setTimeout(() => destino.classList.remove("pulse-error"), 900);
        }

function validarMueble(card) {
            // Guarda errores encontrados.
            const errores = [];

            // Lee codigo del mueble.
            const cod = (card.dataset.codpuro || "").toUpperCase();

            // Lee ancho detectado desde el codigo.
            const ancho = Number.parseInt(card.dataset.ancho, 10) || 0;

            // Lee alto y profundidad interpretadas desde el codigo.
            const linea = card.dataset.linea || "";

            // Ajustes por linea: MOU (closets 70 mm mas bajos si no hay H) y Cubik (bajos 690 x 540).
            const dimsLinea = ajustarDimensionesPorLinea({
                tipo: card.dataset.tipoModulo || "",
                alto: Number.parseInt(card.dataset.alto, 10) || 0,
                profundidad: Number.parseInt(card.dataset.profundidad, 10) || 0,
                profundidadEstructura: Number.parseInt(card.dataset.profundidadEstructura, 10) || 0
            }, cod, linea);
            const alto = dimsLinea.alto;
            const profundidadTotal = dimsLinea.profundidad;
            const profundidadBase = dimsLinea.profundidadEstructura || dimsLinea.profundidad;
            const tieneTpm = card.dataset.tpm === "1";
            const profundidad = profundidadBase;

            // Lee el grosor del material definido desde piezas estructurales.
            const grosor = obtenerGrosorMaterialDesdeCard(card, card.dataset.tipoModulo === "BAR");

            // Lee el grosor real del respaldo desde filas RESP cuando existe.
            const grosorRespaldo = obtenerGrosorRespaldoDesdeCard(card);

            // Calcula ancho interno de base/techo/ajustes.
            const anchoInterno = ancho > 0 ? ancho - (grosor * 2) - 1 : 0;

            // Analiza OTP/OA como pareja de piezas antes de validar fila por fila.
            const contextoOrejas = analizarParejaOtpOa(card, alto, cod);

            // Analiza si el modulo tiene frente falso FF.
            const contextoFrenteFalso = analizarFrenteFalso(card, cod);

            // Cuenta filas que si entraron en una regla de validacion.
            let filasValidadas = 0;

            // Tableros sueltos: el codigo del mueble es un codigo de material (TRBLBL18, LNLN18).
            if (/^[A-Z]{4,8}\d{2}$/.test(cod)) {
                card.dataset.sinRegla = "1";
                return errores;
            }

            // Recorre filas de piezas.
            card.querySelectorAll("tbody tr").forEach((tr, index) => {
                // Toma los valores principales de la fila.
                const pieza = textoCelda(tr, "cod_pieza").toUpperCase();
                const medida1 = numeroCelda(tr, "medida1");
                const medida2 = numeroCelda(tr, "medida2");
                const numeroFila = index + 1;

                // Si no hay codigo de pieza, no valida esa fila.
                if (!pieza) return;

                // Indica si esta fila tiene error.
                let filaConError = false;

                // Valida medidas principales segun pieza y descripcion del modulo.
                const validacion = validarMedidasPieza(pieza, medida1, medida2, {
                    ancho,
                    alto,
                    profundidad,
                    profundidadTotal,
                    altoFrente: dimsLinea.altoFrente || 0,
                    grosor,
                    grosorRespaldo,
                    anchoInterno,
                    tieneTpm,
                    contextoOrejas,
                    contextoFrenteFalso,
                    tipo: card.dataset.tipoModulo || "",
                    linea,
                    cod
                });

                if (!validacion.ok) {
                    errores.push(`Fila ${numeroFila}: ${pieza} ${validacion.mensaje} Medidas encontradas: ${formatearMedida(medida1)} x ${formatearMedida(medida2)} mm.`);
                    filaConError = true;
                }

                // Marca con check pequeno las filas y medidas que realmente fueron comparadas.
                if (validacion.valida) {
                    filasValidadas++;
                    marcarFilaValidada(tr);
                    marcarMedidasValidas(tr, validacion.objetivos || []);
                }

                // Marca visualmente la fila si fallo alguna regla.
                if (filaConError) tr.classList.add("row-error");
                else tr.classList.add("row-ok");
            });

            // Si ninguna pieza pudo compararse, marca la tabla como error.
            // Si ninguna pieza tiene regla, no es un error: se marca como "sin regla".
            card.dataset.sinRegla = filasValidadas === 0 ? "1" : "0";

            if (contextoOrejas.emparejadas && !contextoOrejas.descuentoEn) {
                errores.push(`OTP/OA deben trabajar en pareja: si estan en la misma cantidad, el descuento de 3 mm debe aplicarse completo en todas las OTP o completo en todas las OA.`);
            }

            // Devuelve todos los errores encontrados.
            return errores;
        }

function limpiarEstadoValidacion(card) {
            // Quita clases de estado.
            card.classList.remove("err", "ok", "sinregla");

            // Quita marcas de filas con error.
            card.querySelectorAll(".row-error").forEach(row => row.classList.remove("row-error"));

            // Quita marcas de filas validadas correctamente.
            card.querySelectorAll(".row-ok").forEach(row => row.classList.remove("row-ok"));

            // Quita checks de comparacion anterior.
            card.querySelectorAll(".row-check").forEach(check => check.remove());

            // Quita checks de medidas coincidentes anteriores.
            card.querySelectorAll(".measure-check").forEach(check => check.remove());

            // Limpia lista de errores.
            const validationList = card.querySelector(".validation-list");
            validationList.textContent = "";
            validationList.classList.remove("show");

            // Quita badge de estado anterior.
            const existingBadge = card.querySelector(".badge-status");
            if (existingBadge) existingBadge.remove();

            // Quita avisos y badge de coleccion anteriores.
            card.querySelectorAll(".avisos-coleccion, .badge-coleccion").forEach(el => el.remove());
        }

function mostrarErroresEnTarjeta(card, errores) {
            // Busca la caja de validacion.
            const validationList = card.querySelector(".validation-list");

            // Crea una lista para los errores.
            const ul = document.createElement("ul");

            // Agrega cada error como item.
            errores.forEach(error => {
                const li = document.createElement("li");
                li.textContent = error;
                ul.appendChild(li);
            });

            // Inserta lista en la caja.
            validationList.appendChild(ul);

            // Muestra la caja.
            validationList.classList.add("show");
        }

function mostrarAvisosColeccion(card) {
            const resultado = obtenerAvisosColeccion(card.dataset.codpuro || "", { linea: card.dataset.linea || "" });
            if (card.dataset.sinRegla === "1") resultado.notas.push("Sin regla de medidas para este codigo: no se comparo ninguna pieza.");

            if (resultado.coleccion) {
                const badge = document.createElement("span");
                badge.className = "badge badge-coleccion";
                badge.textContent = resultado.coleccion;
                card.querySelector(".badges").appendChild(badge);
            }

            const mensajes = [...resultado.avisos, ...resultado.notas];
            if (mensajes.length === 0) return;

            const box = document.createElement("div");
            box.className = "avisos-coleccion";
            const ul = document.createElement("ul");
            mensajes.forEach(mensaje => {
                const li = document.createElement("li");
                li.textContent = mensaje;
                ul.appendChild(li);
            });
            box.appendChild(ul);
            card.querySelector(".validation-list").insertAdjacentElement("afterend", box);
        }

function actualizarBadgeEstado(card, ok, sinRegla = false) {
            // Busca contenedor de badges.
            const badgesEl = card.querySelector(".badges");

            // Crea badge nuevo.
            const badge = document.createElement("span");

            // Asigna clases segun estado.
            badge.className = `badge ${sinRegla ? "badge-sinregla" : ok ? "badge-ok" : "badge-err"} badge-status`;
            badge.title = sinRegla ? "Ninguna pieza de este codigo tiene regla de medidas todavia" : "";

            // Asigna texto visible.
            badge.textContent = sinRegla ? "Sin regla" : ok ? "OK" : "Error";

            // Agrega badge a la tarjeta.
            badgesEl.appendChild(badge);
        }

function marcarFilaValidada(tr) {
            const cell = tr.querySelector('[data-col="__check"]');
            if (!cell || cell.querySelector(".row-check")) return;

            const check = document.createElement("span");
            check.className = "row-check";
            check.title = "Fila comparada";
            cell.appendChild(check);
        }

function marcarMedidasValidas(tr, objetivos) {
            const valores = objetivos.filter(valor => Number.isFinite(valor) && valor > 0);
            if (valores.length === 0) return;

            ["medida1", "medida2"].forEach(col => {
                const cell = tr.querySelector(`[data-col="${col}"]`);
                if (!cell || cell.querySelector(".measure-check")) return;

                const numero = numeroCelda(tr, col);
                if (!Number.isFinite(numero)) return;
                if (!valores.some(esperado => coincideMedida(numero, esperado))) return;

                const check = document.createElement("span");
                check.className = "measure-check";
                check.title = "Medida coincidente";
                cell.appendChild(check);
            });
        }

// Envoltura: piezas engrosadas E3 (TAPAE3, LBE3, REPE3...) van en 2 piezas de 18 mm
// pedidas 30 mm mas grandes por lado para refilar despues de pegar (o 1 pieza de 36 exacta).
function validarMedidasPieza(pieza, medida1, medida2, modulo) {
            const resultado = validarMedidasPiezaBase(pieza, medida1, medida2, modulo);
            const nombre = normalizarPieza(pieza);

            // Frentes con marco (lacas): Cuatro (QU) piezas de 130 y ancho - 38; Shaker (CO) de 160 y ancho - 156.
            if (resultado.valida && !resultado.ok && /^(PT|FC|FV)$/.test(nombre)) {
                const marco = validarPiezaDeMarco(nombre, medida1, medida2, modulo, resultado);
                if (marco) return marco;
            }

            if (!/E3/.test(nombre) || /^LTE3/.test(nombre) || !resultado.valida || resultado.ok) return resultado;

            const conRefilado = validarMedidasPiezaBase(pieza, medida1 - 30, medida2 - 30, modulo);
            if (conRefilado.ok) {
                return { ...conRefilado, mensaje: `${conRefilado.mensaje} Engrosado E3: 2 piezas de 18 con 30 mm extra por lado para refilar.` };
            }
            return {
                ...resultado,
                mensaje: `${resultado.mensaje} Si es engrosado E3 en 2 piezas de 18, cada medida lleva 30 mm mas para refilar.`
            };
        }

// Reglas de piezas puntuales aprendidas de produccion. Devuelve null si no aplica.
function validarPiezaAprendida(nombre, medida1, medida2, modulo) {
            const cod = String(modulo.cod || "").toUpperCase();
            const ai = modulo.anchoInterno || 0;
            const opciones = [];
            let texto = "";

            if (/^TP-PM/.test(nombre) && ai && modulo.profundidad) {
                // Tapa de panel medio: ancho interno x (profundidad - 41).
                opciones.push([ai, modulo.profundidad - 41], [ai, modulo.profundidad - 52], [ai, modulo.profundidad - 26]);
                texto = "tapa TP-PM (ancho interno x profundidad - 41)";
            } else if (nombre === "PM" && TIPOS_MODULO_ANCHO_DECIMAL.includes(modulo.tipo) && ai && modulo.profundidad) {
                // Panel medio dentro de un modulo: ancho interno x profundidad.
                opciones.push([ai, modulo.profundidad]);
                texto = "panel medio PM dentro del modulo (ancho interno x profundidad)";
            } else if (nombre === "FF" && /(^|-)US(-|$)/.test(cod) && ai) {
                // Frente falso interno en modulos US: ancho interno x 60.
                opciones.push([ai, 60]);
                texto = "frente falso interno FF (ancho interno x 60)";
            } else if (/^(FON|POS)-SBB/.test(nombre) && ai) {
                // Sistema SBB: ancho interno - 31; fondo 448, posicion 200.
                opciones.push(nombre.startsWith("FON") ? [ai - 31, 448] : [ai - 31, 200]);
                texto = `${nombre.startsWith("FON") ? "fondo" : "posicion"} SBB (ancho interno - 31)`;
            } else if (nombre === "FRE" && modulo.ancho) {
                // Tira frontal FRE: 100 x (ancho - 3).
                opciones.push([100, modulo.ancho - 3]);
                texto = "tira frontal FRE (100 x ancho - 3)";
            } else if (/^RES-[IMD]$/.test(nombre) && modulo.ancho && modulo.alto) {
                // Respaldo de vestidor VLI/VLM: alto x (ancho + 10) o (ancho + 25).
                opciones.push([modulo.alto, modulo.ancho + 10], [modulo.alto, modulo.ancho + 25]);
                texto = "respaldo de vestidor (alto x ancho + 10 / + 25)";
            }

            if (!opciones.length) return null;
            const ok = opciones.some(([a, b]) => coincideParMedidas(medida1, medida2, a, b));
            return { ok, mensaje: `deberia medir ${opciones.map(o => o.join(" x ")).join(" o ")} mm como ${texto}.`, valida: true, objetivos: opciones[0] };
        }

// Coleccion con frentes de marco segun la linea (KUQU, MCUQU... = Cuatro; KUCO... = Shaker) o la columna "lado".
const MARCOS_FRENTE = {
    QU: { nombre: "Cuatro", ancho: 130, descuento: 38 },
    CO: { nombre: "Shaker", ancho: 160, descuento: 156 }
};

function coleccionMarco(modulo) {
            const lado = String(modulo && modulo.lado || "").toUpperCase();
            if (MARCOS_FRENTE[lado]) return lado;
            const lineaBase = String(modulo && modulo.linea || "").toUpperCase().split("+")[0];
            const match = lineaBase.match(/^[A-Z]{1,3}U(QU|CO)/);
            return match ? match[1] : "";
        }

// Pieza de marco de una puerta o frente: el largo (alto del frente) o el travesano (ancho del frente - descuento).
function validarPiezaDeMarco(nombre, medida1, medida2, modulo, resultado) {
            const clave = coleccionMarco(modulo);
            if (!clave) return null;
            const marco = MARCOS_FRENTE[clave];
            const [m1, m2] = [medida1, medida2];
            const otro = coincideMedida(m1, marco.ancho) ? m2 : coincideMedida(m2, marco.ancho) ? m1 : null;
            if (otro === null) return null;

            const objetivos = resultado.objetivos || [];
            let largos;
            if (nombre === "FC") {
                // Frente de cajon: travesano = ancho del frente - descuento; el largo es el alto del frente (hasta el alto del modulo).
                const anchoFrente = objetivos[0] || 0;
                if (coincideMedida(otro, anchoFrente - marco.descuento)) largos = [anchoFrente - marco.descuento];
                else if (otro > 0 && otro <= (modulo.alto || 0)) largos = [otro];
                else return null;
            } else {
                const [altoFrente, anchoFrente] = objetivos;
                largos = [altoFrente, anchoFrente - marco.descuento, 947, (modulo.alto || 0) - 953].filter(v => v > 0);
                if (!largos.some(largo => coincideMedida(otro, largo))) return null;
            }
            return {
                ok: true,
                mensaje: `pieza de marco ${marco.nombre}: ${marco.ancho} de ancho (largo = alto del frente o ancho del frente - ${marco.descuento}).`,
                valida: true,
                objetivos: [marco.ancho, ...largos]
            };
        }

function validarMedidasPiezaBase(pieza, medida1, medida2, modulo) {
            const nombre = normalizarPieza(pieza);

            if (!Number.isFinite(medida1) || !Number.isFinite(medida2)) {
                return { ok: true, mensaje: "", valida: false };
            }

            // Esquinero de closet en L (ECL110DP70, ECL80x80): piezas en L.
            const esquinero = medidasEsquineroL(modulo);
            if (esquinero && /^(TECL|BASL|RESP)/.test(nombre)) {
                const opciones = /^RESP/.test(nombre) ? esquinero.respaldos : esquinero.tapas;
                const ok = opciones.some(([a, b]) => coincideParMedidas(medida1, medida2, a, b));
                return {
                    ok,
                    mensaje: `deberia medir ${opciones.map(o => o.join(" x ")).join(" o ")} mm como pieza de esquinero en L (segundo lado ${esquinero.ladoB}).`,
                    valida: true,
                    objetivos: opciones[0]
                };
            }

            // Piezas aprendidas en 208 semanas de produccion (formulas fijas por pieza).
            const especial = validarPiezaAprendida(nombre, medida1, medida2, modulo);
            if (especial) return especial;

            // Friso del zapatero del sistema invisible: alto 150, ancho como el friso interno.
            if (/^FRI-ZAP/.test(nombre)) {
                const ok = coincideMedida(medida1, 150) || coincideMedida(medida2, 150);
                return { ok, mensaje: "deberia tener alto 150 mm como friso de zapatero.", valida: true, objetivos: [150] };
            }

            if (esZocalo(nombre)) {
                const alturaZocalo = 126;
                const ok = coincideMedida(medida1, alturaZocalo) || coincideMedida(medida2, alturaZocalo);

                return {
                    ok,
                    mensaje: `deberia tener altura ${alturaZocalo} mm como zocalo; el largo puede variar.`,
                    valida: true,
                    objetivos: [alturaZocalo]
                };
            }

            if (esTapaDecorativa(nombre)) {
                const medidaA = modulo.ancho || modulo.anchoInterno;
                // La tapa usa la profundidad total del codigo (TAPADEC130P10 = 100), sin descuento de estructura.
                const medidaB = modulo.profundidadTotal || modulo.profundidad || modulo.alto;
                if (!medidaA || !medidaB) return { ok: true, mensaje: "", valida: false };

                const ok = coincideParMedidas(medida1, medida2, medidaA, medidaB);

                return {
                    ok,
                    mensaje: `deberia medir ${medidaA} x ${medidaB} mm como tapa decorativa.`,
                    valida: true,
                    objetivos: [medidaA, medidaB]
                };
            }

            if (esCornisa(nombre)) {
                const medidaA = esCornisaBase(nombre) ? 100 : (modulo.alto || modulo.ancho);
                const medidaB = modulo.ancho || modulo.alto;
                if (!medidaA || !medidaB) return { ok: true, mensaje: "", valida: false };

                const ok = coincideParMedidas(medida1, medida2, medidaA, medidaB);

                return {
                    ok,
                    mensaje: esCornisaBase(nombre)
                        ? `deberia medir 100 x ${medidaB} mm como cornisa base.`
                        : `deberia medir ${medidaA} x ${medidaB} mm como cornisa.`,
                    valida: true,
                    objetivos: [medidaA, medidaB]
                };
            }

            if (esForramientoOLateralPlano(nombre)) {
                const usaProfundidadDelCodigo = typeof tipoUsaNumeroComoProfundidad === "function" && tipoUsaNumeroComoProfundidad(modulo.tipo);
                const medidaA = alturaUtilModulo(modulo) || modulo.profundidad;
                const profundidadPlano = modulo.profundidadTotal || modulo.profundidad;
                const medidaB = usaProfundidadDelCodigo ? profundidadPlano : (modulo.ancho || profundidadPlano);
                if (!medidaA || !medidaB) return { ok: true, mensaje: "", valida: false };

                // Panel LXTR: 20 mm mas profundo que la P del codigo (P67 -> 690).
                const extraPanel = /^LXTR/.test(modulo.tipo || "") && usaProfundidadDelCodigo ? [0, 20] : [0];
                const ok = extraPanel.some(extra => coincideParMedidas(medida1, medida2, medidaA, medidaB + extra));

                return {
                    ok,
                    mensaje: `deberia medir ${medidaA} x ${extraPanel.map(e => medidaB + e).join(" o ")} mm como pieza plana de dos dimensiones.`,
                    valida: true,
                    objetivos: [medidaA, medidaB]
                };
            }

            if (esPuerta(nombre)) {
                if (!modulo.ancho || !modulo.alto) return { ok: true, mensaje: "", valida: false };

                // Abatibles (AB-SIM, AB-DES...) llevan una sola puerta del ancho completo.
                const esAbatible = /(^|[-+])AB-|AB-(SIM|COM|GIR|PLE|DES)/.test(String(modulo.cod || "").toUpperCase());
                // Lavabos (LV, LAVABO) y el token 2P llevan 2 puertas aunque midan 50-60 cm.
                const codigoPuerta = String(modulo.cod || "").toUpperCase();
                // Con apertura I/D (MBS55DP6LAVABO) va una sola puerta.
                const conApertura = /^[A-Z]+[\d.]+[ID](?![A-Z]{2})|[ID](LV|LAVABO)/.test(codigoPuerta.split("-")[0]);
                const dosPuertasForzadas = (!conApertura && /\dLV|LAVABO/.test(codigoPuerta)) || /(?<![\d.])2P(?![A-Z\d.,])/.test(codigoPuerta);
                // Plegables: PLED/PLEI = 4 hojas; con apertura antes (BSX69DPLE) = 2 hojas.
                // Cada hoja = ancho total / hojas - 3.
                const hojasPlegable = !esAbatible && /PLE/.test(codigoPuerta) && modulo.tipo !== "EB"
                    ? (/PLE[DI](?=$|[-+HP\d])/.test(codigoPuerta) && !/[\d.][ID]PLE/.test(codigoPuerta) ? 4 : 2)
                    : 0;
                const cantidadPuertas = hojasPlegable || (esAbatible ? 1 : (modulo.ancho > 619 || dosPuertasForzadas) ? 2 : 1);
                const anchoPuertaCodigo = extraerAnchoPuertaDesdeCodigo(modulo.cod);
                const anchoPuerta = anchoPuertaCodigo ? anchoPuertaCodigo - 3 : Math.round(modulo.ancho / cantidadPuertas) - 3;
                const extraNovak = tieneNovak(modulo.cod) ? 110 : 0;
                const descuentoHenzo = tieneHenzo(modulo.cod, modulo.linea) ? 35 : 0;
                const contextoFF = modulo.contextoFrenteFalso || {};
                const descuentoFrenteFalso = contextoFF.tieneFF ? 152 : 0;
                const fugaFrenteFalso = contextoFF.tieneFF ? 38 : 0;
                // Novak: puerta = alto + 110, maximo 2420 (largo util del tablero).
                const altoPuerta = extraNovak
                    ? Math.min(modulo.alto + extraNovak, 2420)
                    : (modulo.altoFrente || modulo.alto) - descuentoHenzo - descuentoFrenteFalso - fugaFrenteFalso - 3;
                // Auxiliares y closets pueden llevar puertas fraccionadas: 947 abajo y el resto arriba.
                const altosPuerta = ["X", "CL", "CM"].includes(modulo.tipo) && !extraNovak
                    ? [altoPuerta, 947, modulo.alto - 953]
                    : [altoPuerta];
                // Bajo con 1 gaveta arriba y puerta abajo (B90G1): puerta = alto - 190 - 3.
                if (["B", "MB"].includes(modulo.tipo) && /G1(?!\d|IN)/.test(codigoPuerta.split("-")[0])) altosPuerta.push(modulo.alto - 193);
                // Puerta PTC en bastidor de closet y BSX de linea MCS: alto - 13.
                if (/(^|-)PTC(-|$)/.test(codigoPuerta) || modulo.tipo === "BSX") altosPuerta.push(modulo.alto - 13);
                // Columna de horno (X...HC): puerta superior = alto - 1363 (757 en H11, 947 en H12).
                if (modulo.tipo === "X" && /\dHC/.test(codigoPuerta)) altosPuerta.push(modulo.alto - 1363);
                const ok = altosPuerta.some(alto => coincideParMedidas(medida1, medida2, alto, anchoPuerta));

                return {
                    ok,
                    mensaje: hojasPlegable
                        ? `deberia medir ${altosPuerta[0]} x ${anchoPuerta} mm como puerta plegable de ${hojasPlegable} hojas (ancho / ${hojasPlegable} - 3).`
                        : ["X", "CL", "CM"].includes(modulo.tipo) && !extraNovak
                        ? `deberia medir ${altosPuerta.join(" o ")} x ${anchoPuerta} mm como puerta (entera o fraccionada 947 + resto).`
                        : extraNovak
                        ? `deberia medir ${altoPuerta} x ${anchoPuerta} mm como puerta Novak, sumando 110 mm solo a la altura.`
                        : descuentoFrenteFalso
                            ? `deberia medir ${altoPuerta} x ${anchoPuerta} mm como puerta con frente falso FF, descontando FF, fuga extra de 38 mm y 1.5 mm por lado.`
                        : descuentoHenzo
                            ? `deberia medir ${altoPuerta} x ${anchoPuerta} mm como puerta Henzo, descontando 35 mm y 1.5 mm por lado.`
                            : `deberia medir ${altosPuerta.join(" o ")} x ${anchoPuerta} mm como puerta, descontando 1.5 mm por lado.`,
                    valida: true,
                    objetivos: [altoPuerta, anchoPuerta]
                };
            }

            if (esCostadoInterno(nombre)) {
                if (!modulo.alto && !modulo.profundidad) return { ok: true, mensaje: "", valida: false };

                const altoCostado = 60;
                const largoCostado = modulo.anchoInterno || modulo.ancho || modulo.alto || modulo.profundidad;
                // Altos sobre refrigerador (A..RF): costado interno de 60 x (ancho + 97).
                const largosCostado = modulo.tipo === "A" && /\d(H[\d.]+)?RF/.test(String(modulo.cod || "").toUpperCase()) && modulo.ancho
                    ? [largoCostado, modulo.ancho + 97] : [largoCostado];
                const ok = largosCostado.some(largo => coincideParMedidas(medida1, medida2, altoCostado, largo));

                return {
                    ok,
                    mensaje: `deberia medir ${altoCostado} x ${largoCostado} mm como costado interno.`,
                    valida: true,
                    objetivos: [altoCostado, largoCostado]
                };
            }

            if (esFrenteVertical(nombre)) {
                if (!modulo.ancho || !modulo.alto) return { ok: true, mensaje: "", valida: false };

                const anchoPuertaCodigo = extraerAnchoPuertaDesdeCodigo(modulo.cod);
                const anchoFrenteBase = anchoPuertaCodigo
                    ? Math.min(anchoPuertaCodigo, Math.max(modulo.ancho - anchoPuertaCodigo, 0) || anchoPuertaCodigo)
                    : modulo.ancho;
                const anchoFrente = anchoFrenteBase - 3;
                // Henzo (por codigo o linea) descuenta 35 mm de alto, igual que las puertas.
                const descuentoHenzo = tieneHenzo(modulo.cod, modulo.linea) ? 35 : 0;
                const altoFrente = (modulo.altoFrente || modulo.alto) - 3 - descuentoHenzo;
                const ok = coincideParMedidas(medida1, medida2, altoFrente, anchoFrente);

                return {
                    ok,
                    mensaje: `deberia medir ${altoFrente} x ${anchoFrente} mm como frente vertical${descuentoHenzo ? " Henzo (-35 mm)" : ""}.`,
                    valida: true,
                    objetivos: [altoFrente, anchoFrente]
                };
            }

            if (esFrenteFalso(nombre)) {
                if (!modulo.ancho) return { ok: true, mensaje: "", valida: false };

                const altoFrenteFalso = 152;
                const anchoFrenteFalso = modulo.ancho - 3;
                const ok = coincideParMedidas(medida1, medida2, altoFrenteFalso, anchoFrenteFalso);

                return {
                    ok,
                    mensaje: `deberia medir ${altoFrenteFalso} x ${anchoFrenteFalso} mm como frente falso FF.`,
                    valida: true,
                    objetivos: [altoFrenteFalso, anchoFrenteFalso]
                };
            }

            if (esFrenteCajon(nombre)) {
                if (!modulo.ancho) return { ok: true, mensaje: "", valida: false };

                const anchoFrente = modulo.ancho - 3;
                // FLD (frente de cajon libre) va al ancho completo en produccion.
                const anchosFrente = modulo.tipo === "FLD" ? [anchoFrente, modulo.ancho] : [anchoFrente];
                const ok = anchosFrente.some(ancho => coincideMedida(medida1, ancho) || coincideMedida(medida2, ancho));

                return {
                    ok,
                    mensaje: `deberia tener ancho ${anchosFrente.join(" o ")} mm como frente de cajon, descontando 1.5 mm por lado.`,
                    valida: true,
                    objetivos: [anchoFrente]
                };
            }

            const reglaSistema = medidasSistemaGaveta(nombre, modulo);
            if (reglaSistema) {
                const ok = reglaSistema.anchos.some(ancho => reglaSistema.alturas.some(altura => coincideParMedidas(medida1, medida2, ancho, altura)));

                return {
                    ok,
                    mensaje: `deberia medir ${reglaSistema.ancho} x ${reglaSistema.alturas.join("/")} mm como ${reglaSistema.nombre} (ancho interno - ${reglaSistema.descuento}).`,
                    valida: true,
                    objetivos: [...reglaSistema.anchos, ...reglaSistema.alturas]
                };
            }

            if (esFondoMerivobox(nombre)) {
                if (!modulo.ancho) return { ok: true, mensaje: "", valida: false };

                const anchoMrv = modulo.ancho - 88;
                const profundidadMrv = 474;
                const ok = coincideParMedidas(medida1, medida2, anchoMrv, profundidadMrv);

                return {
                    ok,
                    mensaje: `deberia medir ${anchoMrv} x ${profundidadMrv} mm como fondo MRV.`,
                    valida: true,
                    objetivos: [anchoMrv, profundidadMrv]
                };
            }

            if (esPosicionMerivobox(nombre)) {
                if (!modulo.ancho) return { ok: true, mensaje: "", valida: false };

                const anchoMrv = modulo.ancho - 88;
                const alturasPosicionMrv = [83, 101, 184, 300];
                const ok = alturasPosicionMrv.some(altura => coincideParMedidas(medida1, medida2, anchoMrv, altura));

                return {
                    ok,
                    mensaje: `deberia medir ${anchoMrv} x 83/101/184/300 mm como posicion MRV.`,
                    valida: true,
                    objetivos: [anchoMrv, ...alturasPosicionMrv]
                };
            }

            if (esFondoSlim(nombre)) {
                if (!modulo.ancho) return { ok: true, mensaje: "", valida: false };

                const anchoSlim = modulo.ancho - 87;
                const profundidadSlim = 490;
                const ok = coincideParMedidas(medida1, medida2, anchoSlim, profundidadSlim);

                return {
                    ok,
                    mensaje: `deberia medir ${anchoSlim} x ${profundidadSlim} mm como fondo sistema Slim.`,
                    valida: true,
                    objetivos: [anchoSlim, profundidadSlim]
                };
            }

            if (esPosicionSlim(nombre)) {
                if (!modulo.ancho) return { ok: true, mensaje: "", valida: false };

                const anchoSlim = modulo.ancho - 108;
                const alturasPosicionSlim = [89, 101, 128];
                const ok = alturasPosicionSlim.some(altura => coincideParMedidas(medida1, medida2, anchoSlim, altura));

                return {
                    ok,
                    mensaje: `deberia medir ${anchoSlim} x 89/101/128 mm como posicion sistema Slim.`,
                    valida: true,
                    objetivos: [anchoSlim, ...alturasPosicionSlim]
                };
            }

            if (esFrisoSlim(nombre)) {
                const alturaFrenteInterno = 135;
                const ok = coincideMedida(medida1, alturaFrenteInterno) || coincideMedida(medida2, alturaFrenteInterno);

                return {
                    ok,
                    mensaje: `deberia tener altura ${alturaFrenteInterno} mm como frente interno Slim; el ancho queda variable por ahora.`,
                    valida: true,
                    objetivos: [alturaFrenteInterno]
                };
            }

            if (esFondoOPosicion(nombre)) {
                const medidaA = modulo.anchoInterno || modulo.ancho;
                const medidaB = modulo.profundidad || modulo.alto;
                if (!medidaA || !medidaB) return { ok: true, mensaje: "", valida: false };

                // Frentes FRE-PP de paneles PPX/PPA: ancho - 3 x alto - 3 (PPX hasta 16 mm menos de alto).
                const opcionesPanel = /^(PPX|PPA|PPB)$/.test(modulo.tipo || "") && nombre.startsWith("FRE") && modulo.ancho && modulo.alto
                    ? [[modulo.ancho - 3, modulo.alto - 3], [modulo.ancho - 3, modulo.alto - 16]]
                    : [];
                const ok = coincideParMedidas(medida1, medida2, medidaA, medidaB)
                    || opcionesPanel.some(([a, b]) => coincideParMedidas(medida1, medida2, a, b));

                return {
                    ok,
                    mensaje: opcionesPanel.length
                        ? `deberia medir ${opcionesPanel[0][0]} x ${opcionesPanel.map(o => o[1]).join(" o ")} mm como frente de panel.`
                        : `deberia medir ${medidaA} x ${medidaB} mm como fondo/posicion/friso.`,
                    valida: true,
                    objetivos: [medidaA, medidaB]
                };
            }

            if (esOrejaAuxiliar(nombre)) {
                const anchosOreja = anchosPermitidosOreja(modulo);
                const alturasOreja = alturasPermitidasOreja(modulo, "OA");
                const ok = alturasOreja.length
                    ? alturasOreja.some(altoOreja => anchosOreja.some(ancho => coincideParMedidas(medida1, medida2, altoOreja, ancho)))
                    : anchosOreja.some(ancho => coincideMedida(medida1, ancho) || coincideMedida(medida2, ancho));

                return {
                    ok,
                    mensaje: alturasOreja.length
                        ? `deberia medir ${alturasOreja.join(" o ")} x ${anchosOreja.join("/")} mm como oreja auxiliar segun pareja OTP/OA.`
                        : `deberia conservar ancho ${anchosOreja.join("/")} mm como oreja auxiliar.`,
                    valida: true,
                    objetivos: alturasOreja.length ? [...alturasOreja, ...anchosOreja] : anchosOreja
                };
            }

            if (esOrejaTipoPuerta(nombre)) {
                const anchoOreja = detectarAnchoOrejaDesdePieza(nombre);
                const anchosEstandarOreja = anchoOreja ? [anchoOreja] : anchosPermitidosOreja(modulo);
                const alturasOreja = alturasPermitidasOreja(modulo, "OTP");
                const ok = alturasOreja.length
                    ? alturasOreja.some(altoOreja => anchosEstandarOreja.some(ancho => coincideParMedidas(medida1, medida2, altoOreja, ancho)))
                    : anchosEstandarOreja.some(ancho => coincideMedida(medida1, ancho) || coincideMedida(medida2, ancho));

                return {
                    ok,
                    mensaje: alturasOreja.length
                        ? `deberia medir ${alturasOreja.join(" o ")} x ${anchosEstandarOreja.join("/")} mm como oreja tipo puerta segun pareja OTP/OA.`
                        : `deberia conservar ancho ${anchosEstandarOreja.join("/")} mm como oreja tipo puerta.`,
                    valida: true,
                    objetivos: alturasOreja.length ? [...alturasOreja, ...anchosEstandarOreja] : anchosEstandarOreja
                };
            }

            if (esRepisaPortacopas(nombre)) {
                if (!modulo.anchoInterno) return { ok: true, mensaje: "", valida: false };

                const profundidadPortacopas = 280;
                const ok = coincideParMedidas(medida1, medida2, modulo.anchoInterno, profundidadPortacopas);

                return {
                    ok,
                    mensaje: `deberia medir ${modulo.anchoInterno} x ${profundidadPortacopas} mm como repisa portacopas.`,
                    valida: true,
                    objetivos: [modulo.anchoInterno, profundidadPortacopas]
                };
            }

            if (esTpm(nombre)) {
                if (!modulo.anchoInterno || !modulo.profundidad) return { ok: true, mensaje: "", valida: false };

                const profundidadTpm = modulo.profundidad - 52;
                // En produccion tambien aparece con 26 mm de descuento.
                const ok = [profundidadTpm, modulo.profundidad - 26].some(prof => coincideParMedidas(medida1, medida2, modulo.anchoInterno, prof));

                return {
                    ok,
                    mensaje: `deberia medir ${modulo.anchoInterno} x ${profundidadTpm} mm porque TPM descuenta 52 mm solo en esa pieza.`,
                    valida: true,
                    objetivos: [modulo.anchoInterno, profundidadTpm]
                };
            }

            if (esBaseConTiraderaInterna(nombre)) {
                if (!modulo.anchoInterno || !modulo.profundidad) return { ok: true, mensaje: "", valida: false };

                const profundidadBaseTi = modulo.profundidad - 22;
                const ok = coincideParMedidas(medida1, medida2, modulo.anchoInterno, profundidadBaseTi);

                return {
                    ok,
                    mensaje: `deberia medir ${modulo.anchoInterno} x ${profundidadBaseTi} mm porque la base con TI descuenta 22 mm de profundidad.`,
                    valida: true,
                    objetivos: [modulo.anchoInterno, profundidadBaseTi]
                };
            }

            if (esTaco(nombre)) {
                if (!modulo.anchoInterno) return { ok: true, mensaje: "", valida: false };

                const altoTaco = 60;
                const ok = coincideParMedidas(medida1, medida2, modulo.anchoInterno, altoTaco);

                return {
                    ok,
                    mensaje: `deberia medir ${modulo.anchoInterno} x ${altoTaco} mm como tacos, usando ancho total menos 2 espesores laterales y 1 mm de fuga.`,
                    valida: true,
                    objetivos: [modulo.anchoInterno, altoTaco]
                };
            }

            if (esBaseOTecho(nombre)) {
                if (!modulo.anchoInterno) return { ok: true, mensaje: "", valida: false };

                if (!modulo.profundidad) {
                    // Complementos Henzo FVLB: base 100 mm mas corta, como sus ajustes.
                    const anchosBase = /^(FVLB|LB|LBD|LBI|FB)$/.test(modulo.tipo || "") ? [modulo.anchoInterno, modulo.anchoInterno - 100] : [modulo.anchoInterno];
                    const okAncho = anchosBase.some(ancho => coincideMedida(medida1, ancho) || coincideMedida(medida2, ancho));

                    return {
                        ok: okAncho,
                        mensaje: `deberia tener ancho interno ${modulo.anchoInterno} mm; no hay profundidad detectada para comparar la segunda medida.`,
                        valida: true,
                        objetivos: [modulo.anchoInterno]
                    };
                }

                // En modulos con tiradera interna (TI) la base puede ir 22 mm menos profunda.
                const profundidadesBase = tieneTiraderaInterna(modulo.cod) && esBase(nombre)
                    ? [modulo.profundidad, modulo.profundidad - 22]
                    : [modulo.profundidad];
                // Invertidos (INV): base y techo al ancho completo. BSX de linea MCS: 82 de fondo.
                if (tieneTokenCodigo(String(modulo.cod || "").toUpperCase(), "INV") && modulo.ancho) {
                    const anchoCompleto = modulo.ancho;
                    if (profundidadesBase.some(prof => coincideParMedidas(medida1, medida2, anchoCompleto, prof))) {
                        return { ok: true, mensaje: `deberia medir ${anchoCompleto} x ${profundidadesBase.join(" o ")} mm (invertido: al ancho completo).`, valida: true, objetivos: [anchoCompleto, modulo.profundidad] };
                    }
                }
                if (modulo.tipo === "BSX") profundidadesBase.push(82);
                // Complementos Henzo FB: techo 24 mm menos profundo. Bastidor BS: techo Henzo 11 mm menos.
                if (modulo.tipo === "FB" && !esBase(nombre)) profundidadesBase.push(modulo.profundidad - 24);
                if (modulo.tipo === "BS" && !esBase(nombre)) profundidadesBase.push(modulo.profundidad - 11, 64);
                const ok = profundidadesBase.some(prof => coincideParMedidas(medida1, medida2, modulo.anchoInterno, prof));
                return {
                    ok,
                    mensaje: `deberia medir ${modulo.anchoInterno} x ${profundidadesBase.join(" o ")} mm segun ancho interno y profundidad.`,
                    valida: true,
                    objetivos: [modulo.anchoInterno, modulo.profundidad]
                };
            }

            if (esRepisaMovil(nombre)) {
                if (!modulo.anchoInterno || !modulo.profundidad) return { ok: true, mensaje: "", valida: false };

                const anchoRepisaMovil = modulo.anchoInterno - 1;
                const profundidadRepisa = profundidadRepisaMovil(modulo);
                const ok = coincideParMedidas(medida1, medida2, anchoRepisaMovil, profundidadRepisa);

                return {
                    ok,
                    mensaje: `deberia medir ${anchoRepisaMovil} x ${profundidadRepisa} mm porque REPM/REPMM usa profundidad propia de repisa movil.`,
                    valida: true,
                    objetivos: [anchoRepisaMovil, profundidadRepisa]
                };
            }

            // LTE3: engrosado de 36 mm a un lado de los cajones del comodin (medidas de produccion).
            if (/^LTE3/.test(nombre)) {
                const opciones = [727, 757, 760, 1027].flatMap(alto => [472, 488, 502, 518].map(fondo => [alto, fondo]));
                const ok = opciones.some(([a, b]) => coincideParMedidas(medida1, medida2, a, b));
                return {
                    ok,
                    mensaje: "deberia medir 727 x 472/488 (36 mm) o 757 x 502 / 760 x 518 (2 de 18 mm) como engrosado LTE3.",
                    valida: true,
                    objetivos: [727, 472]
                };
            }

            // Costados del sistema invisible: 490 de largo x (alto de posicion + 15).
            if (/^COS-SI/.test(nombre)) {
                const altos = [120, 200, 80, 270, 90, 60];
                const ok = altos.some(alto => coincideParMedidas(medida1, medida2, 490, alto));
                return { ok, mensaje: "deberia medir 490 x 120/200/80/270/90/60 mm como costado de sistema invisible.", valida: true, objetivos: [490, ...altos] };
            }

            // Zapatera de closet (C1): ancho interno - 1 x 320 (esquineros ECL a veces al ancho interno).
            if (/^ZAPAP/.test(nombre)) {
                if (!modulo.anchoInterno) return { ok: true, mensaje: "", valida: false };

                const largos = [modulo.anchoInterno - 1, modulo.anchoInterno];
                const ok = largos.some(largo => coincideParMedidas(medida1, medida2, largo, 320));

                return {
                    ok,
                    mensaje: `deberia medir ${largos[0]} x 320 mm como zapatera, descontando laterales y 1 mm.`,
                    valida: true,
                    objetivos: [largos[0], 320]
                };
            }

            // Zapatero inclinado de closet (ZH): ancho interno x 300.
            if (/^ZPIN/.test(nombre)) {
                if (!modulo.anchoInterno) return { ok: true, mensaje: "", valida: false };

                const ok = coincideParMedidas(medida1, medida2, modulo.anchoInterno, 300);

                return {
                    ok,
                    mensaje: `deberia medir ${modulo.anchoInterno} x 300 mm como zapatero inclinado.`,
                    valida: true,
                    objetivos: [modulo.anchoInterno, 300]
                };
            }

            if (esMaletera(nombre)) {
                if (!modulo.anchoInterno) return { ok: true, mensaje: "", valida: false };

                const profundidadBase = Number(modulo.profundidad) || 0;
                // Closets P3 (hasta 350) descuentan 70; RAS (al filo frontal) descuenta 25.
                const profundidadMaletera = esRas(modulo) ? profundidadBase - 25
                    : profundidadBase > 110 && profundidadBase <= 350 && !esModuloAlto(modulo) ? profundidadBase - 70
                    : profundidadBase > 110 ? profundidadBase - 110 + (esModuloAlto(modulo) ? 40 : 0) : profundidadBase;
                const ok = [profundidadMaletera, profundidadMaletera + 2].some(prof => coincideParMedidas(medida1, medida2, modulo.anchoInterno, prof));

                return {
                    ok,
                    mensaje: `deberia medir ${modulo.anchoInterno} x ${profundidadMaletera} mm como maletera.`,
                    valida: true,
                    objetivos: [modulo.anchoInterno, profundidadMaletera]
                };
            }

            if (esRepisaTapa(nombre)) {
                const anchoRepisa = modulo.ancho || modulo.anchoInterno;
                const profundidadRepisa = modulo.profundidad || 470;
                if (!anchoRepisa || !profundidadRepisa) return { ok: true, mensaje: "", valida: false };

                const ok = coincideParMedidas(medida1, medida2, anchoRepisa, profundidadRepisa);

                return {
                    ok,
                    mensaje: `deberia medir ${anchoRepisa} x ${profundidadRepisa} mm como repisa tapa.`,
                    valida: true,
                    objetivos: [anchoRepisa, profundidadRepisa]
                };
            }

            if (esRepisaEspecialBar(nombre) && esModuloBar(modulo)) {
                if (!modulo.anchoInterno) return { ok: true, mensaje: "", valida: false };

                const profundidadesBar = [270, 400];
                const ok = profundidadesBar.some(profundidad => coincideParMedidas(medida1, medida2, modulo.anchoInterno, profundidad));

                return {
                    ok,
                    mensaje: `deberia medir ${modulo.anchoInterno} x 270/400 mm como repisa especial de bar.`,
                    valida: true,
                    objetivos: [modulo.anchoInterno, ...profundidadesBar]
                };
            }

            if (esRepisaFija(nombre)) {
                if (!modulo.anchoInterno || !modulo.profundidad) return { ok: true, mensaje: "", valida: false };

                const grosorRespaldo = modulo.grosorRespaldo || 6;
                const profundidadRepisa = nombre.startsWith("REPF")
                    ? modulo.profundidad - modulo.grosor - 1 - grosorRespaldo - 1
                    : modulo.profundidad;
                // Repisa tapa suelta (REPTA94.9P47): va al ancho completo del codigo.
                const anchosRepisa = modulo.tipo === "REPTA" && modulo.ancho ? [modulo.anchoInterno, modulo.ancho] : [modulo.anchoInterno];
                const ok = anchosRepisa.some(ancho => coincideParMedidas(medida1, medida2, ancho, profundidadRepisa));

                return {
                    ok,
                    mensaje: nombre.startsWith("REPF")
                        ? `deberia medir ${modulo.anchoInterno} x ${profundidadRepisa} mm como repisa fija, descontando grosor estructura, 1 mm de fuga, grosor respaldo y 1 mm de fuga.`
                        : `deberia medir ${modulo.anchoInterno} x ${profundidadRepisa} mm como repisa normal.`,
                    valida: true,
                    objetivos: [modulo.anchoInterno, profundidadRepisa]
                };
            }

            if (esAjuste(nombre)) {
                if (!modulo.anchoInterno) return { ok: true, mensaje: "", valida: false };

                const alturasAjuste = [60, 80, 100, 150];
                const largosAjuste = [modulo.anchoInterno];
                // Complementos Henzo LB/LBD/LBI/FVLB/FB: ajuste 100 mm mas corto.
                if (/^(LB|LBD|LBI|FVLB|FB)$/.test(modulo.tipo || "")) largosAjuste.push(modulo.anchoInterno - 100);
                // Paneles PPX/PPA/PRM: ajuste AJ-PP = ancho - 60.
                if (/^(PPX|PPA|PPB|PRM)$/.test(modulo.tipo || "") && modulo.ancho) largosAjuste.push(modulo.ancho - 60);
                const ok = largosAjuste.some(largo => alturasAjuste.some(altura => coincideParMedidas(medida1, medida2, largo, altura)));

                return {
                    ok,
                    mensaje: `deberia medir ${largosAjuste.join(" o ")} x 60/80/100/150 mm.`,
                    valida: true,
                    objetivos: [modulo.anchoInterno, ...alturasAjuste]
                };
            }

            if (esPiezaDosDimensiones(nombre)) {
                const segundaMedida = modulo.alto || modulo.profundidad;
                if (!modulo.ancho || !segundaMedida) return { ok: true, mensaje: "", valida: false };

                const ok = coincideParMedidas(medida1, medida2, modulo.ancho, segundaMedida);
                return {
                    ok,
                    mensaje: `deberia medir ${modulo.ancho} x ${segundaMedida} mm segun las dos dimensiones detectadas del codigo.`,
                    valida: true,
                    objetivos: [modulo.ancho, segundaMedida]
                };
            }

            if (esLateral(nombre)) {
                const altoLateral = alturaUtilModulo(modulo);
                const profundidadLateral = profundidadLateralModulo(modulo);
                if (!altoLateral || !profundidadLateral) return { ok: true, mensaje: "", valida: false };

                const opciones = [[altoLateral, profundidadLateral]];
                const codigoMayus = String(modulo.cod || "").toUpperCase();
                // Altos sobre refrigerador (RF): laterales entre base y techo y 68 mm menos profundos.
                if (modulo.tipo === "A" && /\d(H[\d.]+)?RF/.test(codigoMayus) && modulo.grosor) {
                    opciones.push([altoLateral - modulo.grosor * 2, profundidadLateral - 68]);
                }
                // Altos MOU: la mayoria baja 30 mm la estructura, pero algunos van al alto del codigo.
                if (modulo.altoFrente && modulo.altoFrente !== modulo.alto) opciones.push([modulo.altoFrente, profundidadLateral]);
                // Altos invertidos (INV): laterales entre base y techo (- 2 espesores); con base decorativa BDEC, - 1.
                if (tieneTokenCodigo(codigoMayus, "INV") && modulo.grosor) {
                    opciones.push([altoLateral - modulo.grosor * 2, profundidadLateral], [altoLateral - modulo.grosor, profundidadLateral]);
                }
                // Bastidor BSX de linea MCS (H205, H240): 82 de fondo.
                if (modulo.tipo === "BSX") opciones.push([altoLateral, 82]);
                // Esquinero en L con lados P6P4 / P4P6: un lateral de 420.
                if (modulo.tipo === "ECL" && /P6P4|P4P6/.test(codigoMayus)) opciones.push([altoLateral, 420]);
                // Bastidor BSX con Novak: laterales con zocalo de 126 (H11 = 2246).
                if (modulo.tipo === "BSX" && tieneNovak(codigoMayus)) {
                    [altoLateral + 126, altoLateral + 120, 2436].forEach(alto => opciones.push([Math.min(alto, 2436), profundidadLateral]));
                }
                // STC: estructura 30 mm mas baja.
                if (tieneTokenCodigo(codigoMayus, "STC")) opciones.push([altoLateral - 30, profundidadLateral]);
                const ok = opciones.some(([alto, prof]) => coincideParMedidas(medida1, medida2, alto, prof));
                return {
                    ok,
                    mensaje: `deberia medir ${opciones.map(o => o.join(" x ")).join(" o ")} mm segun alto y profundidad del modulo.`,
                    valida: true,
                    objetivos: [altoLateral, profundidadLateral]
                };
            }

            if (esRespaldo(nombre)) {
                if (!modulo.ancho || !modulo.alto || !modulo.grosor) return { ok: true, mensaje: "", valida: false };

                if (esModuloBar(modulo)) {
                    const anchoRespaldoBar = modulo.ancho - (modulo.grosor * 2) - 1;
                    const altoRespaldoBar = 1506;
                    const ok = coincideParMedidas(medida1, medida2, altoRespaldoBar, anchoRespaldoBar);

                    return {
                        ok,
                        mensaje: `deberia medir ${altoRespaldoBar} x ${anchoRespaldoBar} mm como respaldo de bar, usando grosor de laterales y 1 mm de fuga.`,
                        valida: true,
                        objetivos: [altoRespaldoBar, anchoRespaldoBar]
                    };
                }

                const anchoRespaldo = modulo.ancho - (modulo.grosor * 2) + 10;
                const altoRespaldo = modulo.alto - (modulo.grosor * 2) + 10;
                const altosRespaldo = tieneTokenCodigo(String(modulo.cod || "").toUpperCase(), "STC") ? [altoRespaldo, altoRespaldo - 30] : [altoRespaldo];
                // Altos MOU: el respaldo puede ir con el alto del codigo (sin los 30 mm de la estructura).
                if (modulo.altoFrente && modulo.altoFrente !== modulo.alto) altosRespaldo.push(modulo.altoFrente - (modulo.grosor * 2) + 10);
                const ok = altosRespaldo.some(alto => coincideParMedidas(medida1, medida2, anchoRespaldo, alto));

                return {
                    ok,
                    mensaje: `deberia medir ${anchoRespaldo} x ${altoRespaldo} mm, descontando dos espesores y sumando 5 mm por lado para ranura.`,
                    valida: true,
                    objetivos: [anchoRespaldo, altoRespaldo]
                };
            }

            if (tieneSoloDosDimensiones(modulo)) {
                const segundaMedida = modulo.alto || modulo.profundidad;
                const ok = coincideParMedidas(medida1, medida2, modulo.ancho, segundaMedida);

                return {
                    ok,
                    mensaje: `deberia medir ${modulo.ancho} x ${segundaMedida} mm porque el codigo solo tiene dos dimensiones detectadas.`,
                    valida: true,
                    objetivos: [modulo.ancho, segundaMedida]
                };
            }

            return { ok: true, mensaje: "", valida: false };
        }

function obtenerGrosorMaterialDesdeItems(items) {
            const candidatas = [];

            items.forEach(row => {
                const pieza = normalizarPieza(val(row, "cod_pieza"));
                if (!esPiezaQueDefineGrosorModulo(pieza)) return;

                const grosor = extraerGrosorMaterial(val(row, "jov"));
                if (grosor) candidatas.push(grosor);
            });

            return candidatas.find(grosor => grosor > 0) || 18;
        }

function obtenerGrosorMaterialDesdeCard(card, preferirLaterales = false) {
            if (preferirLaterales) {
                const laterales = [];
                card.querySelectorAll("tbody tr").forEach(row => {
                    const pieza = normalizarPieza(textoCelda(row, "cod_pieza"));
                    if (!esLateral(pieza)) return;

                    const grosorLateral = extraerGrosorMaterial(textoCelda(row, "jov"));
                    if (grosorLateral) laterales.push(grosorLateral);
                });

                const lateral = laterales.find(grosor => grosor > 0);
                if (lateral) return lateral;
            }

            const grosor = Number.parseFloat(card.dataset.grosorMaterial || "");
            return Number.isFinite(grosor) && grosor > 0 ? grosor : 18;
        }

function obtenerGrosorRespaldoDesdeCard(card) {
            const candidatos = [];

            card.querySelectorAll("tbody tr").forEach(row => {
                const pieza = normalizarPieza(textoCelda(row, "cod_pieza"));
                if (!esRespaldo(pieza)) return;

                const grosor = extraerGrosorMaterial(textoCelda(row, "jov"));
                if (grosor) candidatos.push(grosor);
            });

            return candidatos.find(grosor => grosor > 0) || 6;
        }

function profundidadRepisaMovil(modulo) {
            const profundidad = Number(modulo.profundidad) || 0;

            // Segun produccion real: modulos P3 (hasta 350) descuentan 70 mm, los demas 110 mm.
            if (profundidad <= 110) return profundidad;
            // RAS: repisas al filo frontal (profundidad - ajuste - fugas - respaldo = -25).
            if (esRas(modulo)) return profundidad - 25;
            // Modulos US: repisa movil a profundidad - 45 (P6 = 535, P3 = 275).
            if (tieneTokenCodigo(String(modulo.cod || "").toUpperCase(), "US")) return profundidad - 45;
            // Botellero BOT (P1.6): repisa a la profundidad total - 50.
            if (modulo.tipo === "BOT") return (modulo.profundidadTotal || profundidad) - 50;
            return profundidad <= 350 ? profundidad - 70 : profundidad - 110;
        }

// Closet con repisas y maletera al ras del borde frontal (token RAS).
function esRas(modulo) {
            return tieneTokenCodigo(String(modulo && modulo.cod || "").toUpperCase(), "RAS");
        }

// Medidas de un esquinero de closet en L. ladoB sale de P70 (700) o de "x80" (800).
function medidasEsquineroL(modulo) {
            if (!modulo || modulo.tipo !== "ECL" || !modulo.ancho || !modulo.alto) return null;
            const codigo = String(modulo.cod || "").toUpperCase();
            const matchX = codigo.match(/X(\d+(?:[.,]\d+)?)/);
            const matchP = codigo.match(/P(\d{2}(?:[.,]\d+)?)/);
            const ladoB = matchX ? Math.round(Number.parseFloat(matchX[1].replace(",", ".")) * 10)
                : matchP && Number.parseFloat(matchP[1]) >= 50 ? Math.round(Number.parseFloat(matchP[1].replace(",", ".")) * 10) : 0;
            if (!ladoB) return null;

            const fondo = modulo.profundidad || 580;
            const grosor = modulo.grosor || 15;
            const altoRespaldo = modulo.alto - 2 * grosor;
            const fondosLado = [...new Set([fondo, 580, 420])];
            return {
                ladoB,
                // Techo/base: lado largo (ancho - 16) y tramo del segundo lado (segundo lado - fondo - 16).
                tapas: [[modulo.ancho - 16, fondo], ...fondosLado.map(f => [f, ladoB - fondo - 16])],
                respaldos: [[modulo.ancho - 16, altoRespaldo], [ladoB - 2 * grosor - 1, altoRespaldo]]
            };
        }

function esModuloAlto(modulo) {
            const tipo = String(modulo && modulo.tipo || "").toUpperCase();
            return tipo === "A" || tipo === "EA";
        }

function esModuloBar(modulo) {
            return String(modulo && modulo.tipo || "").toUpperCase() === "BAR";
        }

function tieneNivelador(cod) {
            return String(cod || "")
                .toUpperCase()
                .split(/[-+]/)
                .some(parte => parte === "NIV");
        }

function tieneHenzo(cod, linea = "") {
            const partes = String(cod || "").toUpperCase().split(/[-+]/);
            // Apertura PUSH nunca lleva descuento Henzo (no tiene gola).
            if (partes.includes("PUSH")) return false;
            // El codigo manda: con HZ es Henzo.
            if (partes.includes("HZ")) return true;
            // Sin HZ en el codigo solo la linea de cocina Henzo (KUHZ) lo hace Henzo;
            // MCUHZ, BUHZ, MOUHZ sin HZ en el codigo son normales (produccion real, 38 semanas).
            return /^KUHZ/.test(String(linea || "").toUpperCase().split("+")[0]);
        }

function tieneSistemaSlimTexto(texto) {
            return String(texto || "")
                .toUpperCase()
                .split(/[-+]/)
                .some(parte => parte === "SS" || parte === "SLIM");
        }

function alturaUtilModulo(modulo) {
            const alto = Number(modulo && modulo.alto) || 0;
            if (!alto) return 0;

            return tieneNivelador(modulo.cod) ? alto - 8 : alto;
        }

function altoBaseOreja(modulo) {
            const alto = Number(modulo && modulo.alto) || 0;
            if (!alto) return 0;

            // Las orejas solo descuentan Henzo cuando el codigo trae HZ (no por la linea).
            const descuentoHenzo = tieneHenzo(modulo.cod) ? 35 : 0;
            return alto - descuentoHenzo;
        }

function alturasPermitidasOreja(modulo, tipoOreja) {
            const base = altoBaseOreja(modulo);
            if (!base) return [];

            const contexto = modulo.contextoOrejas || {};
            const alto = Number(modulo.alto) || 0;
            let alturas;
            if (!contexto.emparejadas) {
                // Oreja sola: con o sin la fuga de 3 mm (produccion usa ambas).
                alturas = tieneHenzo(modulo.cod) ? [base - 3] : [base, base - 3];
                // Linea Henzo (KUHZ...) sin HZ en el codigo: descuenta 35 + 3 como las puertas.
                if (!tieneHenzo(modulo.cod) && tieneHenzo("", modulo.linea)) alturas.push(alto - 38);
            } else {
                const descuento = contexto.descuentoEn || "";
                if (descuento === "OTP") alturas = tipoOreja === "OTP" ? [base - 3] : [base];
                else if (descuento === "OA") alturas = tipoOreja === "OA" ? [base - 3] : [base];
                else alturas = [base, base - 3];
            }
            // Altos MOU: la oreja puede ir con el alto del codigo.
            if (modulo.altoFrente && modulo.altoFrente !== alto) alturas.push(modulo.altoFrente, modulo.altoFrente - 3);
            // La OA no lleva descuento Henzo: acompana el alto real del modulo.
            if (tipoOreja === "OA" && alto && alto !== base) alturas.push(alto, alto - 3);
            return [...new Set(alturas)];
        }

function anchosPermitidosOreja(modulo) {
            const contexto = modulo && modulo.contextoOrejas || {};
            const anchoCodigo = contexto.anchoDefinido || detectarAnchoOrejaDesdeCodigo(modulo && modulo.cod);

            return anchoCodigo ? [anchoCodigo] : [60, 80, 100, 150];
        }

function analizarParejaOtpOa(card, alto, cod) {
            const filas = Array.from(card.querySelectorAll("tbody tr")).map(tr => {
                const pieza = normalizarPieza(textoCelda(tr, "cod_pieza"));
                return {
                    pieza,
                    medida1: numeroCelda(tr, "medida1"),
                    medida2: numeroCelda(tr, "medida2")
                };
            });

            const otp = filas.filter(item => esOrejaTipoPuerta(item.pieza));
            const oa = filas.filter(item => esOrejaAuxiliar(item.pieza));
            const emparejadas = otp.length > 0 && otp.length === oa.length;
            const base = altoBaseOreja({ alto, cod });
            const conFuga = base ? base - 3 : 0;
            const anchoDefinido = detectarAnchoOrejaDesdeCodigo(cod);
            const anchos = anchoDefinido ? [anchoDefinido] : [60, 80, 100, 150];

            if (!emparejadas || !base) {
                return { emparejadas: false, descuentoEn: "", altoBase: base, altoConFuga: conFuga, anchoDefinido };
            }

            const otpConFuga = otp.every(item => coincideOreja(item, conFuga, anchos));
            const otpSinFuga = otp.every(item => coincideOreja(item, base, anchos));
            const oaConFuga = oa.every(item => coincideOreja(item, conFuga, anchos));
            // La OA nunca lleva descuento Henzo: va al alto real del modulo (OTP10H3-HZ: OTP 532, OA 570).
            const oaSinFuga = oa.every(item => coincideOreja(item, base, anchos) || coincideOreja(item, alto, anchos));

            let descuentoEn = "";
            if (otpConFuga && oaSinFuga) descuentoEn = "OTP";
            else if (oaConFuga && otpSinFuga) descuentoEn = "OA";

            return { emparejadas: true, descuentoEn, altoBase: base, altoConFuga: conFuga, anchoDefinido };
        }

function analizarFrenteFalso(card, cod) {
            const filas = Array.from(card.querySelectorAll("tbody tr")).map(tr => normalizarPieza(textoCelda(tr, "cod_pieza")));
            const tieneFF = filas.some(pieza => esFrenteFalso(pieza));
            const tieneSistemaSlim = tieneSistemaSlimTexto(cod) || filas.some(pieza => pieza.includes("SS") || pieza.includes("SLIM"));

            return { tieneFF, tieneSistemaSlim };
        }

function coincideOreja(item, alto, anchos = [60, 80, 100, 150]) {
            return anchos.some(ancho => coincideParMedidas(item.medida1, item.medida2, alto, ancho));
        }

function profundidadLateralModulo(modulo) {
            const tipo = String(modulo && modulo.tipo || "").toUpperCase();
            const profundidadTotal = Number(modulo && modulo.profundidadTotal) || 0;
            const profundidad = Number(modulo && modulo.profundidad) || 0;

            // Laterales LX/FX con P en cm (P69) descuentan 20 como la estructura (670).
            if ((tipo.startsWith("LX") || tipo.startsWith("FX")) && profundidadTotal >= 200 && profundidad && profundidad < profundidadTotal) {
                return profundidad;
            }
            if (tipo.startsWith("LA") || tipo.startsWith("LX") || tipo.startsWith("LB") || tipo.startsWith("FB") || tipo.startsWith("FX")) {
                return profundidadTotal || profundidad;
            }

            return profundidad;
        }

function tieneSoloDosDimensiones(modulo) {
            if (!modulo.ancho) return false;

            const tieneAlto = Number.isFinite(modulo.alto) && modulo.alto > 0;
            const tieneProfundidad = Number.isFinite(modulo.profundidad) && modulo.profundidad > 0;

            return tieneAlto !== tieneProfundidad;
        }

function extraerGrosorMaterial(value) {
            const texto = String(value || "").toUpperCase();
            const match = texto.match(/(?:^|[^0-9])(\d{1,2}(?:[.,]\d+)?)(?=[A-Z]|[^0-9]|$)/);
            const grosor = match ? Number.parseFloat(match[1].replace(",", ".")) : 0;

            if (!Number.isFinite(grosor)) return 0;
            return grosor >= 3 && grosor <= 40 ? grosor : 0;
        }

function esPiezaQueDefineGrosorModulo(pieza) {
            return esBaseOTecho(pieza) || esAjuste(pieza);
        }

function normalizarPieza(pieza) {
            return String(pieza || "")
                .toUpperCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/\s+/g, "")
                .trim();
        }

function esBaseOTecho(pieza) {
            return esBase(pieza) || esTecho(pieza);
        }

function esPuerta(pieza) {
            const normal = normalizarPieza(pieza);
            if (normal.includes("ABF") || normal.includes("ABE")) return false;
            return normal === "PT" || normal.startsWith("PT-");
        }

function tieneNovak(cod) {
            return String(cod || "")
                .toUpperCase()
                .split(/[-+]/)
                .some(parte => parte === "NK");
        }

function extraerAnchoPuertaDesdeCodigo(cod) {
            const match = String(cod || "").toUpperCase().match(/PT(\d+(?:[.,]\d+)?)/);
            if (!match) return 0;

            const numero = Number.parseFloat(match[1].replace(",", "."));
            if (!Number.isFinite(numero)) return 0;

            return Math.round(numero < 20 ? numero * 100 : numero * 10);
        }

function esFrenteCajon(pieza) {
            const normal = normalizarPieza(pieza);
            const partes = normal.split("-").filter(Boolean);
            return normal === "FC" ||
                normal.startsWith("FC") ||
                normal.endsWith("FC") ||
                normal.includes("FRENTECAJON") ||
                partes.some(parte => parte === "FC" || parte.endsWith("FC"));
        }

function esZocalo(pieza) {
            const normal = normalizarPieza(pieza);
            return normal.includes("ZOC");
        }

function esTapaDecorativa(pieza) {
            const normal = normalizarPieza(pieza);
            return normal === "TA" || normal.startsWith("TAPA") || normal.startsWith("TAPADEC");
        }

function esCornisa(pieza) {
            const normal = normalizarPieza(pieza);
            return normal === "CR" || normal.startsWith("CR-") || normal.startsWith("CORNISA");
        }

function esCornisaBase(pieza) {
            const normal = normalizarPieza(pieza);
            return normal === "CR-BA" || normal === "CRBA" || normal.includes("CORNISABASE");
        }

function esForramientoOLateralPlano(pieza) {
            const normal = normalizarPieza(pieza);
            return normal.startsWith("FX") ||
                normal.startsWith("FB") ||
                normal.startsWith("FA") ||
                normal.startsWith("LBTR") ||
                normal.startsWith("LVB") ||
                normal.startsWith("LXTR") ||
                normal.startsWith("LX2L") ||
                normal.startsWith("LX60") ||
                normal.startsWith("LBD");
        }

function esCostadoInterno(pieza) {
            const normal = normalizarPieza(pieza);
            return normal === "CI" || normal.startsWith("CI-");
        }

function esFrenteVertical(pieza) {
            const normal = normalizarPieza(pieza);
            return normal === "FV" || normal.startsWith("FV-");
        }

function esFrenteFalso(pieza) {
            const normal = normalizarPieza(pieza);
            const partes = normal.split("-").filter(Boolean);
            return normal === "FF" || partes.includes("FF") || normal.includes("FRENTEFALSO");
        }

// Piezas de sistemas de gaveta, medidas contra el ancho interno (ancho - 2 espesores - 1).
// Deducido de 20 despieces reales. FI = gaveta interna tras puerta: descuenta 37 mm mas.
const SISTEMAS_GAVETA = {
    SS: { nombre: "Slim", FON: { d: 19, h: [490] }, POS: { d: 40, h: [63, 101, 199, 300, 380, 435] }, FRI: { d: 3, h: [110, 240] }, FRI_FI: { d: [34, 31], h: [135, 116] } },
    SB: { nombre: "SB", FON: { d: [31, 25], h: [498, 530] }, POS: { d: [31, 25], h: [100, 199, 70] }, FRI: { d: [3, -3], h: [100] }, FRI_FI: { d: [34, 31], h: [135, 116] } },
    SM: { nombre: "Metabox", FON: { d: 31, h: [483, 498, 268] }, POS: { d: 31, h: [71, 103, 199] }, FRI: { d: 63, h: [61] } },
    SL: { nombre: "Legrabox", FON: { d: 34, h: [490, 260] }, POS: { d: 37, h: [148, 63] } },
    SI: { nombre: "Sistema invisible", FON: { d: [35, 41], h: [475, 425] }, POS: { d: [35, 41], h: [105, 185, 65, 255, 75, 60] }, FRI_FI: { d: 31, h: [135] } },
    MRV: { nombre: "Merivobox", FON: { d: 51, h: [474, 480, 324] }, POS: { d: 51, h: [83, 184, 300] } }
};

function medidasSistemaGaveta(pieza, modulo) {
            const match = String(pieza || "").match(/^(FON|POS|FRI)-(SS|SB|SM|SL|SI|MRV)$/);
            if (!match || !modulo.anchoInterno) return null;

            const [, parte, sistemaCodigo] = match;
            const sistema = SISTEMAS_GAVETA[sistemaCodigo];
            const esInterna = /FI(?![A-Z])/.test(String(modulo.cod || "").toUpperCase());
            const regla = (esInterna && sistema[`${parte}_FI`]) || sistema[parte];
            if (!regla) return null;

            const extraInterna = esInterna && !sistema[`${parte}_FI`] ? 37 : 0;
            // Comodin CM con frente interno: cada LTE3 (engrosado de 36 mm) quita ancho a los cajones.
            // Desde 800 mm lleva dos engrosados, uno por lado: 36 mm mas (el friso 29).
            const dosEngrosados = esInterna && modulo.tipo === "CM" && modulo.ancho >= 800;
            const extraEngrosado = dosEngrosados ? (parte === "FRI" ? 29 : 36) : 0;
            const descuentos = (Array.isArray(regla.d) ? regla.d : [regla.d]).map(d => d + extraInterna + extraEngrosado);
            if (dosEngrosados && parte !== "FRI") descuentos.push(descuentos[0] + 3);
            const nombres = { FON: "fondo", POS: "posicion", FRI: "friso" };

            return {
                nombre: `${nombres[parte]} ${sistema.nombre}`,
                descuento: descuentos.join(" o "),
                anchos: descuentos.map(d => modulo.anchoInterno - d),
                ancho: modulo.anchoInterno - descuentos[0],
                alturas: regla.h
            };
        }

function esFondoMerivobox(pieza) {
            const normal = normalizarPieza(pieza);
            return normal === "FON-MRV" || normal === "FONMRV" || (normal.startsWith("FON") && normal.includes("MRV"));
        }

function esPosicionMerivobox(pieza) {
            const normal = normalizarPieza(pieza);
            return normal === "POS-MRV" || normal === "POSMRV" || (normal.startsWith("POS") && normal.includes("MRV"));
        }

function esFondoSlim(pieza) {
            const normal = normalizarPieza(pieza);
            return normal === "FON-SS" || normal === "FONSS" || (normal.startsWith("FON") && (normal.includes("-SS") || normal.includes("SLIM")));
        }

function esPosicionSlim(pieza) {
            const normal = normalizarPieza(pieza);
            return normal === "POS-SS" || normal === "POSSS" || (normal.startsWith("POS") && (normal.includes("-SS") || normal.includes("SLIM")));
        }

function esFrisoSlim(pieza) {
            const normal = normalizarPieza(pieza);
            return normal === "FRI-SLIM" ||
                normal === "FRISLIM" ||
                normal === "FRI-SS" ||
                normal === "FRISS" ||
                (normal.startsWith("FRI") && (normal.includes("SLIM") || normal.includes("-SS")));
        }

function esFondoOPosicion(pieza) {
            const normal = normalizarPieza(pieza);
            return normal.startsWith("FON") ||
                normal.startsWith("POS") ||
                normal.startsWith("FRI") ||
                normal.startsWith("FRE");
        }

function esOrejaAuxiliar(pieza) {
            const normal = normalizarPieza(pieza);
            return normal === "OA" || normal.startsWith("OA-") || /^OA\d/.test(normal);
        }

function esOrejaTipoPuerta(pieza) {
            const normal = normalizarPieza(pieza);
            return normal === "OTP" || normal.startsWith("OTP");
        }

function detectarAnchoOrejaDesdePieza(pieza) {
            const match = String(pieza || "").toUpperCase().match(/OTP(\d+(?:[.,]\d+)?)/);
            if (match) return Math.round(Number.parseFloat(match[1].replace(",", ".")) * 10);

            return 0;
        }

function detectarAnchoOrejaDesdeCodigo(cod) {
            const match = String(cod || "").toUpperCase().match(/\bOTP(\d+(?:[.,]\d+)?)/);
            if (!match) return 0;

            return Math.round(Number.parseFloat(match[1].replace(",", ".")) * 10);
        }

function esRepisaPortacopas(pieza) {
            const normal = normalizarPieza(pieza);
            return normal.includes("PORTACOP");
        }

function esMaletera(pieza) {
            const normal = normalizarPieza(pieza);
            return normal === "MALE" || normal.startsWith("MALE");
        }

function esRepisaTapa(pieza) {
            const normal = normalizarPieza(pieza);
            return normal.startsWith("REPT");
        }

function esRepisaEspecialBar(pieza) {
            const normal = normalizarPieza(pieza);
            return normal.includes("REPF-E3") || normal.includes("REPFE3");
        }

function esBase(pieza) {
            const normal = normalizarPieza(pieza);
            const partes = normal.split("-").filter(Boolean);

            return normal.includes("BASE") ||
                normal.includes("BAS") ||
                partes.includes("BA") ||
                normal === "BA" ||
                normal.startsWith("BA-") ||
                normal.endsWith("-BA");
        }

function esTecho(pieza) {
            const normal = normalizarPieza(pieza);
            const partes = normal.split("-").filter(Boolean);

            return normal.includes("TECHO") ||
                normal.includes("TEC") ||
                partes.includes("TE") ||
                partes.includes("TCH") ||
                normal === "TE" ||
                normal === "TCH";
        }

function esBaseConTiraderaInterna(pieza) {
            const normal = normalizarPieza(pieza);
            if (!esBase(normal) || esTecho(normal)) return false;

            return normal === "BAS-TI" ||
                normal === "BASTI" ||
                normal.endsWith("TI") ||
                normal.includes("-TI") ||
                normal.includes("TIRADERAINTERNA");
        }

function esTaco(pieza) {
            const normal = normalizarPieza(pieza);
            return normal.includes("TACO");
        }

function esAjuste(pieza) {
            const normal = normalizarPieza(pieza);
            const partes = normal.split("-").filter(Boolean);

            return normal.includes("AJUSTE") ||
                partes.some(parte => /^AJ[A-Z0-9]*$/.test(parte)) ||
                /^AJ[A-Z0-9]*$/.test(normal) ||
                /(?:^|[^A-Z])AJ[A-Z0-9]*$/.test(normal);
        }

function esLateral(pieza) {
            const normal = normalizarPieza(pieza);
            const partes = normal.split("-").filter(Boolean);

            return normal === "LID" ||
                normal === "LDD" ||
                normal === "LATI" ||
                normal === "LATD" ||
                normal === "LI" ||
                normal === "LD" ||
                normal.startsWith("LAT") ||
                normal.startsWith("LAD") ||
                normal.startsWith("LAI") ||
                normal.includes("LATERAL") ||
                partes.includes("LID") ||
                partes.includes("LDD") ||
                partes.includes("LATI") ||
                partes.includes("LATD") ||
                partes.includes("LI") ||
                partes.includes("LD");
        }

function esRespaldo(pieza) {
            const normal = normalizarPieza(pieza);
            const partes = normal.split("-").filter(Boolean);

            return normal === "RES" ||
                normal.startsWith("RES-") ||
                normal.includes("RESP") ||
                normal.includes("RSP") ||
                normal.includes("FONDO") ||
                normal.includes("TRASERA") ||
                partes.includes("RES") ||
                /(?:^|[^A-Z])RES[A-Z0-9]*$/.test(normal);
        }

function esRepisaMovil(pieza) {
            const normal = normalizarPieza(pieza);
            const partes = normal.split("-").filter(Boolean);

            return normal === "REPM" ||
                normal === "REPMM" ||
                normal === "RPM" ||
                normal === "RPMM" ||
                normal.startsWith("REPM") ||
                normal.startsWith("RPM") ||
                partes.some(parte => parte.startsWith("REPM")) ||
                partes.some(parte => parte.startsWith("RPM")) ||
                /(?:^|[^A-Z])REPM[A-Z0-9]*$/.test(normal);
        }

function esRepisaFija(pieza) {
            const normal = normalizarPieza(pieza);
            const partes = normal.split("-").filter(Boolean);

            if (esRepisaMovil(normal)) return false;

            return normal === "REP" ||
                normal.startsWith("REPF") ||
                normal === "REPISA" ||
                partes.includes("REP") ||
                partes.includes("REPISA") ||
                partes.some(parte => parte.startsWith("REPF")) ||
                /(?:^|[^A-Z])REP$/.test(normal);
        }

function esPiezaDosDimensiones(pieza) {
            const normal = normalizarPieza(pieza);
            const partes = normal.split("-").filter(Boolean);

            return normal.startsWith("FXTR") ||
                normal.startsWith("FBTR") ||
                normal.startsWith("FATR") ||
                normal.startsWith("LBTR") ||
                normal.startsWith("LVB") ||
                normal === "PM" ||
                normal.startsWith("FORR") ||
                normal.includes("FORRAMIENTO") ||
                partes.some(parte => parte === "PM" || parte.startsWith("FXTR") || parte.startsWith("FBTR") || parte.startsWith("FATR"));
        }

function esTpm(pieza) {
            const normal = normalizarPieza(pieza);
            return normal === "TPM" || normal.includes("-TPM");
        }

function coincideParMedidas(medida1, medida2, esperado1, esperado2) {
            return (coincideMedida(medida1, esperado1) && coincideMedida(medida2, esperado2)) ||
                (coincideMedida(medida1, esperado2) && coincideMedida(medida2, esperado1));
        }

function formatearMedida(valor) {
            return Number.isFinite(valor) ? String(valor) : "-";
        }

function coincideMedida(valor, esperado) {
            // Si el valor no es numerico, no coincide.
            if (!Number.isFinite(valor)) return false;

            // Devuelve true si esta dentro de la tolerancia.
            return Math.abs(valor - esperado) <= TOLERANCIA_MM;
        }

function textoCelda(row, col) {
            // Busca la celda por data-col.
            const cell = row.querySelector(`[data-col="${col}"]`);

            // Devuelve texto limpio.
            return cell ? cell.textContent.trim() : "";
        }

function numeroCelda(row, col) {
            // Lee texto de celda.
            const texto = textoCelda(row, col);

            // Cambia coma decimal por punto y convierte a numero.
            const numero = Number.parseFloat(texto.replace(",", "."));

            // Devuelve numero o NaN si no se pudo convertir.
            return Number.isFinite(numero) ? numero : NaN;
        }
