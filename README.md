# ROPA · Tu talle ideal, antes de comprar

Maqueta funcional de la app del grupo ROPA: recomienda **qué talle te queda en
cada prenda** de las tiendas asociadas según tus medidas, y te deja
**probarte la prenda** antes de comprarla. Las tiendas reciben menos
devoluciones por talle y más ventas; la app cobra una suscripción Premium (el
probador) y una comisión por cada venta que deriva.

> «ROPA» es un nombre provisorio: se cambia en `src/app/lib/marca.ts`.

```bash
npm install
npm run dev
```

## Accesos de demostración

| Rol | Email | Contraseña | Qué ve |
|---|---|---|---|
| Usuaria Premium | `sofi@ropa.app` | `sofi` | App con el probador habilitado |
| Usuario gratuito | `lucas@ropa.app` | `lucas` | App con talles; el probador ofrece pasarse a Premium |
| Usuario nuevo | `nuevo@ropa.app` | `nuevo` | Arranca por la carga de medidas |
| Tienda asociada | `tienda@ropa.app` | `tienda` | Portal de Tienda Norte |
| Tienda en alta | `nueva-tienda@ropa.app` | `tienda` | Portal de Bruma, con el catálogo por cargar |
| Administración | `admin@ropa.app` | `admin` | Toda la plataforma |

Los botones de la pantalla de login completan las credenciales.

## Los tres portales

- **App de usuario** (`/app`): pensada para el celular; en la computadora se
  muestra dentro de un marco de teléfono. Carga de medidas, feed con el talle
  ya calculado, detalle de prenda con el veredicto por zona, probador virtual,
  compras con «¿te quedó bien?», Premium y privacidad.
- **Portal de tienda** (`/tienda`): métricas de lo que la app le aporta
  (devoluciones antes y después), catálogo, carga asistida por CSV, tablas de
  talles, ventas y devoluciones, insights de talles y comisiones.
- **Administración** (`/admin`): panel general, **hipótesis y riesgos**,
  tiendas, usuarios, suscripciones, ventas y comisiones, precisión del
  recomendador, costos del probador, marketing, soporte, privacidad y
  configuración.

Delante de todo está la **portada** (`/`): una persona que cambia de ropa a
medida que scrolleás.

Todo lo que se hace en un portal aparece en los otros en la misma sesión: una
compra en la app se ve en las ventas de la tienda y en las comisiones del
admin.

## Las hipótesis, medidas

La pantalla **Hipótesis y riesgos** del admin toma las hipótesis de los
documentos del grupo (Canvas, FODA y riesgos de factibilidad, viabilidad y
deseabilidad) y muestra cada una con su métrica en vivo:

| Hipótesis | Métrica | Meta |
|---|---|---|
| El algoritmo acierta el talle | Compras que siguieron la recomendación y no se devolvieron por talle | ≥ 85 % |
| La prueba virtual es rápida | Tiempo, percentil 95 | ≤ 10 s |
| Las tiendas comparten sus tablas | Prendas con tabla de talles completa | ≥ 90 % |
| ≥ 5 % pasa a Premium | Usuarios que alguna vez pagaron | ≥ 5 % |
| El costo de IA es sostenible | Costo de IA por suscriptor vs. precio del plan | menor |
| El marketing se recupera en 6 meses | Payback por canal | ≤ 6 meses |
| Siguen usando la app | Activos 30 días después de la primera compra | ≥ 50 % |

Los datos están calibrados para que **la mayoría se cumpla y dos no**
(conversión a Premium y payback de influencers): una demo en la que todo da
verde no es creíble.

## El recomendador de talles

`src/app/lib/talles.ts`. No es un número inventado:

1. Cada prenda tiene la tabla de talles de su tienda: para cada talle, el rango
   de medidas del cuerpo (pecho, cintura, cadera, altura) que le queda bien.
   Cada tienda tiene su propio molde, así que el M de una no es el M de otra.
2. Según la categoría pesa cada zona (remera: pecho; jean: cintura y cadera).
3. La preferencia de calce del usuario (ajustado, regular, holgado) mueve el
   punto ideal dentro de cada rango.
4. Gana el talle de menor costo. La confianza sale de cuánto le gana al segundo
   y de qué tan adentro de los rangos queda.

Si cambiás tus medidas en el perfil, cambian todas las recomendaciones.

## El probador virtual

No llama a ningún servicio de IA y no tiene costo por uso; la foto y la cámara
nunca salen del navegador. Tiene tres modos:

- **Persona de ejemplo:** muestra a la persona con la prenda en el talle
  elegido. Un talle chico se ve tirante y uno grande, con aire.
- **Tu foto:** la prenda se superpone sobre tu foto (vista aproximada).
- **En vivo:** la cámara, con la prenda que sigue el cuerpo (detección de pose en el navegador con MediaPipe; el modelo se descarga la primera vez).

Las personas y las prendas son ilustraciones en SVG
(`src/app/components/figura/`). Si el grupo genera imágenes con IA, se
reemplazan sin tocar el flujo.

## Los datos

| | Cantidad | Origen |
|---|---|---|
| Tiendas | 42 (37 activas, 3 en alta, 2 pausadas) | Ficticias |
| Prendas | ~390, con tabla de talles | Generadas |
| Usuarios | 2.400 + 3 cuentas demo | Generados |
| Ventas, pruebas, suscripciones, campañas, tickets | 12 meses de historia | Generados |

Las tiendas e influencers son **ficticios a propósito**: usar marcas reales
haría parecer que son socias de la app.

Todo se genera con un **PRNG sembrado** (`src/app/data/azar.ts`), así los
números son los mismos en cada recarga y coherentes entre pantallas. La fecha
de la demo es fija: **22 de octubre de 2026**. Lo que hacés en la sesión se
guarda en el navegador y se descarta desde **Configuración → Restablecer la
demostración** (admin).

## Stack

Vite 6 · React 18 · TypeScript · react-router 7 · Tailwind 4 · shadcn/ui ·
Recharts · lucide-react · sonner · MediaPipe Tasks Vision (pose del probador en
vivo, se carga sólo al usarlo). Sin backend.

```
src/app/
  data/        azar.ts · tiendas.ts · prendas.ts · usuarios.ts · seed.ts (motor de datos)
  lib/         talles.ts (recomendador) · metricas.ts · store.tsx · auth.ts · marca.ts
  components/  figura/ (ilustraciones) · portada/ · app/ · tienda/ · admin/ · layout/ · ui/
  pages/       portada · login · app/ · tienda/ · admin/
```

## Despliegue

**En línea (GitHub Pages): https://berranacho03.github.io/ropa-online/**

Cada push a `main` se publica solo con el workflow
`.github/workflows/pages.yml`: instala, construye con la subcarpeta
`/ropa-online/` y sube `dist/`. Como GitHub Pages no conoce las rutas de la
app, el workflow copia `index.html` como `404.html`: si alguien entra directo
a `/ropa-online/admin`, se carga la app y abre esa pantalla.

Para activarlo una sola vez: en GitHub, **Settings → Pages → Build and
deployment → Source: GitHub Actions**.

También funciona en Netlify (`netlify.toml` ya está) o en cualquier hosting
estático que redirija todas las rutas a `index.html`. La cámara del probador en
vivo necesita HTTPS, que GitHub Pages y Netlify ya dan.
