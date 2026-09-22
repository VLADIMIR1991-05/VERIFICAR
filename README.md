# VERIFICAR

Validador de despiece: carga el Excel de despiece, agrupa las piezas por OP y mueble,
interpreta el codigo de cada mueble y valida las medidas de cada pieza.

## Archivos

| Archivo | Para que sirve |
| --- | --- |
| `index.html` | Pagina principal (interfaz y estilos). |
| `app.js` | Carga del Excel, filtros, renderizado y comparacion. |
| `lector_codigos.js` | Lectura de la nomenclatura del mueble (ancho, alto, profundidad, accesorios). |
| `reglas_validacion.js` | Reglas de validacion de medidas por pieza. |
| `reglas_coleccion.js` | Avisos por coleccion y limites de fabricacion (no cuentan como error). |
| `db_codigos.js` | Base de datos de abreviaturas y su significado. |
| `validador_despiece_mejorado.html` | Redireccion a `index.html` (nombre antiguo). |
| `GUIA_PARA_MODIFICAR_REGLAS.txt` | Guia rapida para agregar reglas o codigos. |

Las versiones anteriores de cada archivo estan en el historial de git.
