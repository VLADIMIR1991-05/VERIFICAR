// lector_codigos.js
// Lee e interpreta la nomenclatura de codigos de muebles.
// Aqui se agregan reglas de lectura: ancho, alto, profundidad, tipo y accesorios.

function obtenerNombre(cod) {
            // Si no hay codigo, devuelve descripcion generica.
            if (!cod) return "Codigo no definido";

            // Normaliza el codigo.
            const codigo = normalizarSinPuerta(String(cod).toUpperCase().trim());

            // Si existe completo en el diccionario, lo devuelve.
            if (DB[codigo]) return DB[codigo];

            // Intenta interpretar codigos compactos de modulo como B60IH36 o A40DH5-TI-LBA-BF.
            const interpretado = interpretarCodigoModulo(codigo);

            // Si logro interpretar partes, las devuelve como descripcion completa.
            if (interpretado.length > 0) return interpretado.join(" + ");

            // Divide por guiones para intentar traducir cada parte como respaldo.
            return combinarTokensEspeciales(codigo.split("-").filter(Boolean)).map(parte => traducirToken(parte)).join(" + ");
        }

function combinarTokensEspeciales(partes) {
            const resultado = [];

            for (let i = 0; i < partes.length; i++) {
                const actual = String(partes[i] || "").toUpperCase();
                const siguiente = String(partes[i + 1] || "").toUpperCase();

                if (actual === "S" && siguiente.startsWith("P")) {
                    resultado.push(`S/P${siguiente.slice(1)}`);
                    i++;
                    continue;
                }

                if (actual === "SIN" && siguiente === "ACV") {
                    resultado.push("SIN-ACV");
                    i++;
                    continue;
                }

                if (actual === "ACV" && siguiente === "LE") {
                    resultado.push("ACV-LE");
                    i++;
                    continue;
                }

                resultado.push(partes[i]);
            }

            return resultado;
        }

function normalizarSinPuerta(codigo) {
            return String(codigo || "").toUpperCase().replace(/S-P/g, "S/P");
        }

function separarCodigoPrincipalYAccesorios(codigo) {
            const partes = combinarTokensEspeciales(String(codigo || "").split(/[-+]/).filter(Boolean));
            if (partes.length === 0) return { principal: "", accesorios: [] };

            const indiceConAncho = partes.findIndex(parte => /[A-Z]+\d/.test(String(parte || "").toUpperCase()));
            if (indiceConAncho <= 0) {
                return { principal: partes[0] || "", accesorios: partes.slice(1) };
            }

            return {
                principal: partes.slice(0, indiceConAncho + 1).join("-"),
                accesorios: partes.slice(indiceConAncho + 1)
            };
        }

function interpretarCodigoModulo(codigo) {
            codigo = normalizarSinPuerta(codigo);

            // Separa el codigo principal de los accesorios con guion o signo mas.
            const partes = combinarTokensEspeciales(String(codigo || "").split(/[-+]/).filter(Boolean));

            // Si no hay partes, devuelve lista vacia.
            if (partes.length === 0) return [];

            // Toma el codigo principal, recomponiendo tipos con guion antes del ancho.
            const separado = separarCodigoPrincipalYAccesorios(codigo);
            const principal = separado.principal;

            // Toma el resto como accesorios o condiciones adicionales.
            const accesorios = separado.accesorios;

            // Primero intenta leer una nomenclatura conocida antes de H/P aunque tenga numeros internos.
            const compactoConToken = separarTokenConDetalleCompacto(principal);
            if (compactoConToken) {
                const descripcion = [traducirToken(compactoConToken.token)];
                const detalles = interpretarDetalleCompacto(compactoConToken.detalle, compactoConToken.token);
                descripcion.push(...detalles);
                accesorios.forEach(accesorio => descripcion.push(traducirToken(accesorio)));
                return descripcion.filter(Boolean);
            }

            // Detecta tipo completo como todas las letras antes del ancho.
            const match = principal.match(/^([A-Z]+(?:-[A-Z]+)*)(\d+(?:[.,]\d+)?)(.*)$/);

            // Si no coincide con formato de modulo, intenta traducir accesorios normales.
            if (!match) return partes.map(parte => traducirToken(parte));

            // Extrae cada parte capturada.
            const [, tipo, ancho, detalleCompacto] = match;

            // Guarda la descripcion armada.
            const descripcion = [];

            // Agrega tipo de modulo.
            descripcion.push(traducirTipoModulo(tipo));

            // Agrega ancho si existe.
            if (ancho) descripcion.push(`Ancho ${convertirNumeroCodigoAMm(ancho)}mm`);

            // Interpreta detalles compactos despues del ancho, respetando el orden original.
            const detalles = interpretarDetalleCompacto(detalleCompacto, tipo);

            // Agrega los detalles compactos encontrados.
            descripcion.push(...detalles);

            // Si no vino altura explicita, aplica altura por defecto.
            if (!detalles.some(texto => texto.startsWith("Altura"))) {
                const alturaFinal = alturaPorDefecto(tipo);
                if (alturaFinal) descripcion.push(traducirAltura(alturaFinal));
            }

            // Traduce accesorios despues de guiones.
            accesorios.forEach(accesorio => descripcion.push(traducirToken(accesorio)));

            // Devuelve descripcion sin valores vacios.
            return descripcion.filter(Boolean);
        }

function separarTokenConDetalleCompacto(principal) {
            // Normaliza el codigo principal.
            const texto = String(principal || "").toUpperCase().trim();

            // Busca el primer marcador Hnumero, HE o Pnumero dentro del texto, ignorando P de S/P o S-P.
            const marcador = texto.match(/(HE|H\d+(?:[.,]\d+)?|(?<![\/-])P\d+(?:[.,]\d+)?)/);

            // Si no hay H/P con numero, no aplica esta regla.
            if (!marcador || marcador.index === 0) return null;

            // Todo lo anterior al marcador es candidato a nomenclatura.
            const candidato = texto.slice(0, marcador.index);

            // Todo desde el marcador en adelante son detalles compactos.
            const detalle = texto.slice(marcador.index);

            // Acepta el candidato si existe en DB.
            if (DB[candidato]) return { token: candidato, detalle };

            // Si no existe exacto, busca el token conocido mas largo al final del candidato.
            const token = buscarTokenConocido(candidato);
            if (token && token === candidato) return { token, detalle };

            // Sin token claro, no aplica.
            return null;
        }

function interpretarDetalleCompacto(detalle, tipo) {
            // Normaliza el detalle.
            let resto = String(detalle || "").toUpperCase().trim();

            // Guarda las partes interpretadas en el orden encontrado.
            const partes = [];

            // Recorre de izquierda a derecha hasta consumir el texto.
            while (resto.length > 0) {
                // Ignora separadores compactos.
                if (resto.startsWith("+") || resto.startsWith("-")) {
                    resto = resto.slice(1);
                    continue;
                }

                // Detecta altura HE, H12, H36, H8.6, etc.
                const altura = resto.match(/^(HE|H\d+(?:[.,]\d+)?)/);
                if (altura) {
                    partes.push(traducirAltura(altura[0]));
                    resto = resto.slice(altura[0].length);
                    continue;
                }

                // Detecta sin puerta dentro del codigo compacto.
                if (resto.startsWith("S/P") || resto.startsWith("S-P")) {
                    partes.push(traducirToken("S/P"));
                    resto = resto.slice(3);
                    continue;
                }

                // Detecta cantidad de repisas pegada, como 1R, 1RP, 2RP o 3REP.
                const repisaCompacta = resto.match(/^(\d+)R(?:P|EP)?/);
                if (repisaCompacta) {
                    partes.push(traducirRepisa(repisaCompacta[1]));
                    resto = resto.slice(repisaCompacta[0].length);
                    continue;
                }

                // Detecta profundidad P6.7, P58, P53, etc.
                const profundidad = resto.match(/^P\d+(?:[.,]\d+)?/);
                if (profundidad) {
                    partes.push(traducirProfundidad(profundidad[0]));
                    resto = resto.slice(profundidad[0].length);
                    continue;
                }

                // Detecta G seguida de numero como cantidad de gavetas.
                const gavetasCompactas = resto.match(/^G(\d+)/);
                if (gavetasCompactas) {
                    partes.push(traducirGavetas(gavetasCompactas[1]));
                    resto = resto.slice(gavetasCompactas[0].length);
                    continue;
                }

                // Detecta IN como una gaveta interna antes de leer I como apertura izquierda.
                if (resto.startsWith("IN")) {
                    partes.push("1 Interna");
                    resto = resto.slice(2);
                    continue;
                }

                // Detecta apertura izquierda o derecha.
                if (resto.startsWith("I") || resto.startsWith("D")) {
                    partes.push(traducirApertura(resto.charAt(0)));
                    resto = resto.slice(1);
                    continue;
                }

                // Detecta tokens conocidos que puedan venir pegados.
                const token = buscarTokenConocido(resto);
                if (token) {
                    partes.push(traducirToken(token));
                    resto = resto.slice(token.length);
                    continue;
                }

                // Si nada coincide, conserva el caracter para no perder informacion.
                partes.push(resto.charAt(0));
                resto = resto.slice(1);
            }

            // Devuelve partes interpretadas.
            return partes;
        }

function traducirTipoModulo(tipo) {
            // Diccionario especifico para tipos compactos.
            const tipos = {
                B: "Modulo Bajo",
                A: "Modulo Alto",
                S: "Modulo Suspendido",
                BS: "Modulo Bajo Suspendido",
                MBS: "Mueble Bajo Suspendido",
                BAR: "Bar",
                X: "Modulo Auxiliar",
                E: "Modulo Esquinero",
                EB: "Esquinero Bajo",
                EA: "Esquinero Alto",
                ES: "Esquinero Suspendido",
                EX: "Esquinero Auxiliar",
                ECL: "Esquinero Closet",
                MB: "Mueble de Bano",
                CL: "Closet",
                CLOSET: "Closet"
            };

            // Devuelve traduccion conocida o una descripcion generica del codigo.
            return tipos[tipo] || DB[tipo] || `Modulo ${tipo}`;
        }

function traducirApertura(apertura) {
            // I significa izquierda.
            if (apertura === "I") return "Apertura Izquierda";

            // D significa derecha.
            if (apertura === "D") return "Apertura Derecha";

            // Respaldo por si llega otro valor.
            return apertura;
        }

function traducirRepisa(cantidad) {
            const numero = Number.parseInt(cantidad, 10);
            if (!Number.isFinite(numero) || numero <= 0) return "Repisa";
            return numero === 1 ? "1 Repisa" : `${numero} Repisas`;
        }

function traducirGavetas(cantidad) {
            const numero = Number.parseInt(cantidad, 10);
            if (!Number.isFinite(numero) || numero <= 0) return "Gavetas";
            return numero === 1 ? "1 Gaveta" : `${numero} Gavetas`;
        }

function alturaPorDefecto(tipo) {
            // Suspendidos usan H3 cuando no se especifica altura.
            if (["BS", "MBS", "S", "ES"].includes(tipo)) return "H3";

            // Bajos, muebles de bano, altos y esquineros comunes usan H4 cuando no se especifica altura.
            if (["B", "MB", "ST", "EB", "E"].includes(tipo)) return "H4";

            // Altos usan H4 por defecto, pero se muestra como altura final 760mm.
            if (["A", "EA"].includes(tipo)) return "H4";

            // Auxiliares y closets usan H11 por defecto.
            if (["X", "CL", "CLOSET", "CM", "BAR", "ECL"].includes(tipo)) return "H11";
            if (/^(LX|LXTR|LX2L|FX|FXTR)/.test(tipo)) return "H11";
            if (/^(LB|LBTR|LVB|FB|FBTR)/.test(tipo)) return "H4";

            // Sin altura por defecto para otros tipos.
            return "";
        }

function traducirProfundidad(profundidad) {
            // Normaliza el codigo.
            const codigo = String(profundidad || "").toUpperCase();

            // Extrae el numero despues de P.
            const match = codigo.match(/^P(\d+(?:[.,]\d+)?)$/);

            // Si no hay numero, devuelve el codigo original.
            if (!match) return codigo;

            // Convierte P2 en 220mm, P3 en 320mm, P4 en 420mm, P6.7 en 670mm, P58 en 580mm, etc.
            const numero = Number.parseFloat(match[1].replace(",", "."));
            const mm = profundidadTotalDesdeNumeroP(numero);

            // Devuelve descripcion clara.
            return `Profundidad ${Math.round(mm)}mm`;
        }

function obtenerDimensionesCodigo(cod) {
            const dimensiones = obtenerDimensionesModulo(cod);
            return [dimensiones.ancho, dimensiones.alto, dimensiones.profundidad]
                .filter(valor => Number.isFinite(valor) && valor > 0)
                .join("X");
        }

function obtenerDimensionesModulo(cod) {
            const codigo = normalizarSinPuerta(String(cod || "").toUpperCase().trim());
            const resultado = { tipo: "", ancho: 0, alto: 0, profundidad: 0, profundidadEstructura: 0 };
            if (!codigo) return resultado;

            const separado = separarCodigoPrincipalYAccesorios(codigo);
            const principal = separado.principal;
            const alturaCodigoCompleto = extraerAlturaMm(codigo);
            const profundidadCodigoCompleto = extraerProfundidadMm(codigo);
            const compactoConToken = separarTokenConDetalleCompacto(principal);
            const tipoMatch = principal.match(/^([A-Z]+(?:-[A-Z]+)*)(\d+(?:[.,]\d+)?)(.*)$/);

            if (compactoConToken) {
                resultado.tipo = compactoConToken.token;
                resultado.alto = alturaCodigoCompleto || extraerAlturaMm(compactoConToken.detalle) || alturaPorDefectoEspecial(resultado.tipo);
                resultado.profundidad = profundidadCodigoCompleto || extraerProfundidadMm(compactoConToken.detalle) || profundidadPorDefectoEspecial(resultado.tipo);
                resultado.profundidadEstructura = resultado.profundidad ? profundidadEstructuraDesdeCodigo(codigo, resultado.profundidad, resultado.tipo) : 0;
            } else if (tipoMatch) {
                const [, tipo, ancho, detalle] = tipoMatch;
                resultado.tipo = tipo;
                resultado.ancho = tipoUsaNumeroComoProfundidad(tipo) ? 0 : convertirNumeroCodigoAMm(ancho);

                const altura = alturaCodigoCompleto || extraerAlturaMm(detalle);
                resultado.alto = altura || extraerAlturaMm(alturaPorDefecto(tipo));

                const profundidad = profundidadCodigoCompleto || extraerProfundidadMm(detalle);
                resultado.profundidad = profundidad || (tipoUsaNumeroComoProfundidad(tipo) ? profundidadTotalDesdeNumeroP(Number.parseFloat(String(ancho).replace(",", "."))) : profundidadPorDefecto(tipo));
                resultado.profundidadEstructura = profundidad ? profundidadEstructuraDesdeCodigo(codigo, profundidad, tipo) : resultado.profundidad;
            }

            return resultado;
        }

function convertirNumeroCodigoAMm(valor) {
            const numero = Number.parseFloat(String(valor || "").replace(",", "."));
            if (!Number.isFinite(numero)) return 0;
            return Math.round(numero * 10);
        }

function extraerAlturaMm(texto) {
            const limpio = String(texto || "").toUpperCase();

            if (limpio.includes("HE")) return 1360;

            const match = limpio.match(/H(\d+(?:[.,]\d+)?)/);
            if (!match) return 0;

            const codigo = `H${match[1].replace(",", ".")}`;
            const desdeDb = DB[codigo] ? String(DB[codigo]).match(/(\d+(?:\.\d+)?)\s*mm/i) : null;
            if (desdeDb) return Math.round(Number.parseFloat(desdeDb[1]));

            return convertirNumeroCodigoAMm(match[1]);
        }

function extraerProfundidadMm(texto) {
            const match = String(texto || "").toUpperCase().match(/(?<!\/)P(\d+(?:[.,]\d+)?)/);
            if (!match) return 0;

            const numero = Number.parseFloat(match[1].replace(",", "."));
            if (!Number.isFinite(numero)) return 0;

            return profundidadTotalDesdeNumeroP(numero);
        }

function profundidadTotalDesdeNumeroP(numero) {
            if (!Number.isFinite(numero)) return 0;
            if (numero >= 10 && Number.isInteger(numero)) return Math.round(numero * 10);
            if (numero >= 2 && numero <= 4 && Number.isInteger(numero)) return Math.round(numero * 100 + 20);
            return Math.round(numero < 20 ? numero * 100 : numero * 10);
        }

function tipoUsaNumeroComoProfundidad(tipo) {
            const familia = String(tipo || "").toUpperCase();
            return /^(LX|LXTR|LX2L|LB|LBTR|LVB|FX|FXTR|FB|FBTR)/.test(familia);
        }

function profundidadEstructuraDesdeCodigo(texto, profundidadTotal, tipo = "") {
            const match = String(texto || "").toUpperCase().match(/(?<!\/)P(\d+(?:[.,]\d+)?)/);
            const numero = match ? Number.parseFloat(match[1].replace(",", ".")) : 0;
            const profundidad = Number(profundidadTotal) || 0;
            const familia = String(tipo || "").toUpperCase();

            if (!profundidad) return 0;
            if (familia === "ST") return profundidad;
            if (numero === 2) return profundidad - 20;
            if ((numero === 3 || numero === 4) || numero >= 20) return profundidad;
            return profundidad > 20 ? profundidad - 20 : 0;
        }

function profundidadPorDefecto(tipo) {
            const familia = String(tipo || "").toUpperCase();

            if (["A", "EA"].includes(familia)) return 320;
            if (["BS", "MBS", "S", "ES"].includes(familia)) return 530;
            if (familia === "MB") return 530;
            if (familia === "ST") return 600;
            if (["B", "X", "CM", "BAR", "CL", "CLOSET", "ECL", "EB", "EX"].includes(familia)) return 580;
            if (/^(LX|LXTR|LX2L|FX|FXTR|LB|LBTR|LVB|FB|FBTR)/.test(familia)) return 580;

            return 0;
        }

function alturaPorDefectoEspecial(tipo) {
            const familia = String(tipo || "").toUpperCase();
            if (familia.startsWith("LX") || familia.startsWith("LXA")) return 2120;
            if (familia.startsWith("LA")) return 760;
            if (familia.startsWith("LB")) return 760;
            return 0;
        }

function profundidadPorDefectoEspecial(tipo) {
            const familia = String(tipo || "").toUpperCase();
            if (familia.startsWith("LATR") || familia.startsWith("LA")) return 340;
            if (familia.startsWith("LX")) return 580;
            if (familia.startsWith("LB")) return 580;
            return 0;
        }

function traducirAltura(altura) {
            // Normaliza la altura.
            const codigoAltura = String(altura || "").toUpperCase();

            // Usa el diccionario si ya existe una descripcion exacta.
            if (DB[codigoAltura]) return descripcionAlturaDB(codigoAltura);

            // Extrae el numero despues de H.
            const match = codigoAltura.match(/^H(\d+(?:[.,]\d+)?)$/);

            // Si no hay numero, devuelve el codigo original.
            if (!match) return codigoAltura;

            // Convierte H36 en 360mm, H72 en 720mm, etc.
            const mm = Number.parseFloat(match[1].replace(",", ".")) * 10;

            // Devuelve descripcion clara.
            return `Altura ${codigoAltura} (${mm}mm)`;
        }

function traducirToken(token) {
            // Normaliza token.
            const limpio = String(token || "").toUpperCase().trim();

            if (limpio === "SI") return "Sistema Invisible";
            if (limpio === "C1") return "1 Tubo Colgador";
            if (limpio === "C2") return "2 Tubos Colgadores";

            // Si existe en DB, devuelve descripcion.
            if (DB[limpio]) return descripcionDB(limpio);

            if (limpio === "SIN-ACV") return "Sin Accesorio";
            if (limpio === "ACV-LE") return "Accesorio Vibo Legumbrero";
            if (limpio === "ST") return "Sistema ST";
            if (limpio === "IN") return "1 Interna";

            const gavetas = limpio.match(/^G(\d+)$/);
            if (gavetas) return traducirGavetas(gavetas[1]);

            // Si es altura, la interpreta.
            if (/^H\d/.test(limpio)) return traducirAltura(limpio);

            // Si es profundidad, la interpreta.
            if (/^P\d/.test(limpio)) return traducirProfundidad(limpio);

            // Si no se conoce, devuelve el codigo original.
            return limpio;
        }

function tieneTiraderaInterna(cod) {
            const codigo = String(cod || "").toUpperCase().trim();
            if (!codigo) return false;

            return codigo.split(/[-+]/).some(parte => parte === "TI" || /\dTI$/.test(parte));
        }

function tieneTokenCodigo(cod, token) {
            const objetivo = String(token || "").toUpperCase();
            return String(cod || "").toUpperCase().split(/[-+]/).some(parte => parte === objetivo);
        }

function descripcionDB(token) {
            // Lee valor original.
            const valor = DB[token] || "";

            // Divide significados alternos.
            const partes = String(valor).split("/").map(p => p.trim()).filter(Boolean);

            // Deduplica ignorando mayusculas.
            const vistas = new Set();
            const limpias = [];
            partes.forEach(parte => {
                const key = parte.toUpperCase();
                if (!vistas.has(key)) {
                    vistas.add(key);
                    limpias.push(parte);
                }
            });

            // Devuelve descripcion limpia.
            return limpias.join(" / ");
        }

function descripcionAlturaDB(token) {
            // Toma descripcion limpia.
            const descripcion = descripcionDB(token);

            // Busca la primera parte que realmente describe altura.
            const parteAltura = descripcion.split("/").map(p => p.trim()).find(p => p.toUpperCase().startsWith("ALTURA"));

            // Devuelve la parte de altura si existe.
            return parteAltura || descripcion;
        }

function buscarTokenConocido(texto) {
            // Ordena claves largas primero para evitar partir codigos compuestos.
            const claves = Object.keys(DB).sort((a, b) => b.length - a.length);

            // Devuelve la primera clave que coincida al inicio.
            return claves.find(clave => texto.startsWith(clave)) || "";
        }

function detectarAncho(cod) {
            // Normaliza el codigo.
            const codigo = String(cod || "").toUpperCase();

            // Busca letras iniciales completas seguidas del ancho, como B60, BS60 o BAR63.
            const match = codigo.match(/\b[A-Z]+(\d{2,3}(?:[.,]\d+)?)/);

            // Si no encuentra, busca el primer numero de 2 o 3 digitos.
            const fallback = codigo.match(/(\d{2,3}(?:[.,]\d+)?)/);

            // Toma el numero encontrado.
            const valor = match ? match[1] : fallback ? fallback[1] : "";

            // Si no hay numero, devuelve 0.
            if (!valor) return 0;

            // Convierte codigos tipo 60 a 600 mm y 120 a 1200 mm.
            return convertirNumeroCodigoAMm(valor);
        }
