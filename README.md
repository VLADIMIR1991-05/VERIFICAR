# VERIFICAR

Herramienta de despiece Madeval con tres pestanas:

- **Consultar codigo**: lee un codigo de modulo y muestra su ficha (medidas, gavetas, sistema, coleccion, piezas).
- **Validar despiece**: carga el Excel de despiece, agrupa por OP y mueble y valida las medidas de cada pieza.
- **Generar despiece**: arma el despiece de uno o varios codigos con los grosores elegidos; se puede exportar a Excel o mandar al validador.

## Archivos

| Archivo | Para que sirve |
| --- | --- |
| `index.html` | Pagina principal (interfaz y estilos). |
| `app.js` | Carga del Excel, filtros, renderizado y comparacion. |
| `lector_codigos.js` | Lectura de la nomenclatura del mueble (ancho, alto, profundidad, accesorios). |
| `reglas_validacion.js` | Reglas de validacion de medidas por pieza. |
| `reglas_coleccion.js` | Avisos por coleccion y limites de fabricacion (no cuentan como error). |
| `generador_despiece.js` | Recetas de piezas por tipo de modulo; las medidas salen de `reglas_validacion.js`. |
| `app_generador.js` | Pantalla de las pestanas Consultar y Generar. |
| `app_lote.js` | Carga del lote: melamina + lacas + herrajes, enlazados por OP y mueble, con cruces entre archivos. |
| `REPORTE_ERRORES_VALIDADOR.txt` | Clasificacion de los errores en 20 despieces reales (regla faltante o error real). |
| `db_codigos.js` | Base de datos de abreviaturas y su significado. |
| `validador_despiece_mejorado.html` | Redireccion a `index.html` (nombre antiguo). |
| `GUIA_PARA_MODIFICAR_REGLAS.txt` | Guia rapida para agregar reglas o codigos. |

Las versiones anteriores de cada archivo estan en el historial de git.
