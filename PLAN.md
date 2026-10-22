# Plan · Maqueta de la app de talles y probador virtual

Plan para construir una web app de demostración de la idea del grupo ROPA,
siguiendo la misma arquitectura que `../sinergia`: datos generados de forma
determinística y tres portales que comparten una misma base: el **de la usuaria
o usuario**, el **de la tienda asociada** y el **de administración de la
plataforma**. Delante de todo va una **portada animada** pública. No hay
backend: todo corre en el navegador.

> **Nombre de trabajo:** «ROPA». Si la app ya tiene nombre, se cambia en un solo
> lugar (`src/app/lib/marca.ts`).

---

## 1. Qué es la app (según los documentos)

**Propuesta de valor (Canvas):**

- **Para quien compra** (15 a 25 años): le dice qué **talle** le queda en cada
  prenda de las tiendas asociadas, según sus medidas, y le deja **probarse la
  prenda virtualmente** subiendo una foto.
- **Para las tiendas:** menos **devoluciones por talle equivocado** y más
  **conversión**, porque la duda se convierte en venta.

**Cómo gana plata:**

1. **Suscripción Premium** (mensual o anual) que habilita la prueba virtual con IA. La recomendación de talle es gratis (freemium).
2. **Comisión** por cada venta que la app deriva a una tienda asociada.

**Lo que hay que mostrar con la demo:** el Canvas y el análisis de riesgos dejan
hipótesis concretas con números. La maqueta las convierte en métricas visibles,
para que la presentación pueda decir «así mediríamos cada riesgo»:

| Riesgo | Hipótesis | Métrica en la maqueta | Meta |
|---|---|---|---|
| Factibilidad 1 | El algoritmo acierta el talle | % de ventas sin devolución por talle cuando se siguió la recomendación | ≥ 85 % |
| Factibilidad 2 | La IA genera una prueba realista con una foto | Tiempo por prueba (p95) y costo por imagen | ≤ 10 s |
| Factibilidad 3 | Las tiendas comparten catálogo y tablas de medidas | Tiendas con catálogo completo / con tablas válidas | — |
| Factibilidad 5 | Los datos se guardan de forma segura | Consentimientos, fotos borradas, solicitudes de baja | — |
| Viabilidad 1 | ≥ 5 % de los gratuitos pasa a Premium | Conversión free → Premium | ≥ 5 % |
| Viabilidad 2 | Las tiendas ceden comisión | Tiendas activas, comisión media, ventas derivadas | — |
| Viabilidad 3 | El costo de IA es menor que la suscripción | Costo de IA por suscriptor vs. precio del plan | margen > 0 |
| Viabilidad 4 | El marketing se recupera en ≤ 6 meses | CAC y payback por canal | ≤ 6 meses |
| Deseabilidad 2 | Los usuarios suben su foto | % de usuarios con foto cargada | — |
| Deseabilidad 4 | Redes e influencers son el mejor canal | Altas y Premium por canal / influencer | — |
| Deseabilidad 5 | Siguen usando la app después de la primera compra | Retención a 30/60/90 días | — |

Los datos se calibran para que **algunas metas se cumplan y otras no** (por
ejemplo, precisión 87 % ✓, conversión a Premium 4,3 % ✗). Una demo donde todo da
verde no es creíble, y la que muestra un riesgo abierto le da tema a la
presentación.

---

## 2. Qué se reutiliza de Sinergia

Se copia la base y se reemplaza el dominio:

| De Sinergia | En ROPA |
|---|---|
| `package.json`, `vite.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `index.html` | Igual (cambia nombre y descripción) |
| `src/app/components/ui/` (shadcn/ui) | Igual, entero |
| `src/styles/` | Igual; se redefinen los tokens de color en `theme.css` |
| `lib/auth.ts` (login demo con `sessionStorage`) | Mismo patrón, roles `admin` y `usuario` |
| `lib/store.tsx` (estado en contexto + `localStorage` versionado + «Restablecer la demostración») | Mismo patrón |
| `lib/format.ts` | Igual |
| `data/seed.ts` (PRNG `hash` + `mulberry32`, `HOY` fijo) | Se reutiliza el PRNG; el resto del motor es nuevo |
| `components/shell.tsx` (`Kpi`, `Panel`, `Barra`, `Chip`…) | Igual |
| `components/layout/` (sidebar, topbar, búsqueda global) | Se usa **sólo para el panel admin** |
| `pages/login.tsx` con botones de acceso rápido | Igual, con las cuentas nuevas |

**Lo nuevo de verdad:** el layout móvil de la app de usuario, el algoritmo de
talles, el probador virtual simulado y el motor de datos.

**Stack:** Vite 6 · React 18 · TypeScript · react-router 7 · Tailwind 4 ·
shadcn/ui · Recharts · lucide-react · sonner. Sin backend.

---

## 3. Roles y accesos de demostración

| Rol | Email | Contraseña | Qué ve |
|---|---|---|---|
| Administración de la plataforma | `admin@ropa.app` | `admin` | Panel admin completo |
| Usuaria Premium | `sofi@ropa.app` | `sofi` | App con probador virtual habilitado |
| Usuario gratuito | `lucas@ropa.app` | `lucas` | App con talles; el probador muestra el paso a Premium |
| Usuario nuevo | `nuevo@ropa.app` | `nuevo` | Entra al onboarding de medidas desde cero |
| Tienda asociada | `tienda@ropa.app` | `tienda` | Portal de tienda de una tienda activa |
| Tienda en onboarding | `nueva-tienda@ropa.app` | `tienda` | Portal de tienda recién dada de alta, con el catálogo por cargar |

La cuenta «nuevo» existe para que la demo pueda arrancar desde el primer paso
del producto; «nueva-tienda» hace lo mismo del lado de las tiendas.

---

## 3 bis. Portada animada (página de inicio pública)

Es lo primero que se ve, antes del login, en `/`.

**La idea:** una persona en el centro de la pantalla, fija, y a medida que
scrolleás **le va cambiando la ropa**. Cada tramo del scroll es un look:

```
  scroll ▼     ┌──────────────┐
  tramo 1      │   persona    │   «¿Cuál es tu talle en esta tienda?»
               │  con remera  │   Remera boxy · Tienda Norte · Tu talle: M ✓
  tramo 2      │   ⟶ buzo     │   «Probátelo antes de comprarlo»
  tramo 3      │   ⟶ campera  │   «Menos devoluciones para las tiendas»
  tramo 4      │   ⟶ look 4   │   «+200 tiendas · +40.000 usuarios»
               └──────────────┘   [ Crear mi perfil ]  [ Soy una tienda ]
```

- La persona queda fija (`position: sticky`) y el progreso del scroll decide qué
  look se ve; entre uno y otro hay una transición tipo «barrido» de arriba hacia
  abajo (la prenda nueva «cae» sobre la anterior), no un simple fundido.
- Al costado de cada look aparece una etiqueta con la prenda, la tienda y el
  **talle recomendado**: la portada ya muestra el producto funcionando.
- Los textos de cada tramo cuentan la propuesta de valor del Canvas, y el último
  tramo cierra con los dos llamados a la acción (usuario y tienda).
- En el celular funciona igual (scroll vertical) y respeta
  `prefers-reduced-motion` (sin animación, los looks quedan uno debajo de otro).

**De dónde salen las imágenes:** son la **misma persona, misma pose, mismo
fondo**, con 4 a 6 prendas distintas. Se generan con el mismo probador virtual
virtual (sección 6), así la portada es, literalmente, el producto en acción. Se
recortan con fondo transparente para que el barrido entre looks quede limpio.

---

## 4. App de usuario (mobile-first)

El público tiene entre 15 y 25 años y la va a usar desde el celular, así que
**no usa el sidebar de Sinergia**: tiene barra de pestañas inferior en el
celular y, en pantalla de computadora, se muestra centrada en un ancho de
teléfono (útil para proyectar en la presentación).

Pestañas: **Inicio · Explorar · Probador · Mis compras · Perfil**

| Pantalla | Qué resuelve |
|---|---|
| **Onboarding** | Datos básicos y medidas (altura, peso, pecho, cintura, cadera, entrepierna) y calce preferido (ajustado / regular / holgado). Opción «No sé mis medidas»: las estima a partir de altura, peso y contextura, con una guía para medirse. Consentimiento explícito para el uso de medidas y foto. |
| **Inicio** | Prendas recomendadas de las tiendas asociadas, con el talle ya calculado en cada tarjeta. Novedades de tiendas. |
| **Explorar** | Catálogo de todas las tiendas, con filtros por tienda, categoría, precio y «sólo las que tienen mi talle». |
| **Tienda** | Perfil de una tienda asociada y sus prendas. |
| **Detalle de prenda** | **Tu talle: M · 92 % de confianza**, cómo te queda en cada zona («pecho: justo · cintura: holgado · largo: ideal») y comparación con el talle de al lado. Botones **Probármela** (Premium) y **Comprar en la tienda** (venta derivada). |
| **Probador virtual** | Subir foto (o usar la última), elegir prenda y talle, animación de procesamiento de ~6 s y resultado; comparar dos talles lado a lado. Gratuito: una prueba de cortesía y después el paso a Premium. |
| **Mis pruebas** | Historial de pruebas virtuales y favoritos («mi armario»). |
| **Mis compras** | Compras derivadas a tiendas, con la pregunta **«¿Te quedó bien el talle?»**. Esa respuesta alimenta la métrica de precisión del admin y la retención. |
| **Premium** | Planes mensual y anual, qué incluye cada uno y checkout simulado. |
| **Perfil y medidas** | Editar medidas y calce; ver cómo cambia la recomendación. |
| **Privacidad** | Ver qué datos se guardan, borrar la foto, descargar o eliminar la cuenta (riesgo de factibilidad 5). |
| **Ayuda** | Chat de soporte simulado con respuestas predefinidas. |

### El circuito que tiene que verse en la demo

```
  Se registra ─▶ carga medidas ─▶ ve prendas con su talle ─▶ abre una prenda
                                                                  │
          ┌───────────────────────────────────────────────────────┤
          ▼                                                       ▼
   Probármela (Premium)                                 Comprar en la tienda
   foto ─▶ prueba virtual                               (venta derivada ─▶ comisión)
          │                                                       │
          └──────────── si es gratuito: pasa a Premium            ▼
                                                        «¿Te quedó bien?»
                                                        ─▶ precisión del algoritmo
```

Todo lo que hace la usuaria (registro, compras, pruebas, alta en Premium,
feedback) **aparece en el panel admin en la misma sesión**: el mismo store
alimenta los dos portales, como en Sinergia.

---

## 4 bis. Portal de tienda

Es el «panel de métricas para las tiendas» y la «carga de catálogo asistida»
que promete el Canvas. Mismo layout que el admin (sidebar), con otro color de
acento, y todo filtrado a **su** tienda.

| Pantalla | Qué resuelve |
|---|---|
| **Mi tienda** | Lo que la app le está dando: ventas derivadas del mes, conversión de quienes vieron su talle, **devoluciones por talle antes vs. después de sumarse**, comisión a pagar. |
| **Mis prendas** | Su catálogo publicado, con el estado de cada prenda (con tabla de talles / incompleta / pausada) y cuántas veces se recomendó, se probó y se compró. |
| **Cargar catálogo** | Carga asistida: subir un CSV o planilla, mapear columnas, completar tablas de talles faltantes desde plantillas por categoría, vista previa y publicar. |
| **Tablas de talles** | Editor de la tabla de cada prenda o de plantillas que se aplican a varias. Avisa cuando una prenda tiene muchas devoluciones (tabla probablemente mal cargada). |
| **Ventas y devoluciones** | Ventas que llegaron desde la app; la tienda marca las devoluciones y su motivo. Eso alimenta la precisión del algoritmo en el admin. |
| **Insights de talles** | Qué talles se recomiendan más por prenda (sirve para decidir cuánto stock pedir de cada talle) y en qué prendas los usuarios dudan más. |
| **Comisiones** | Liquidación mensual de lo que le debe a la plataforma, con el detalle por venta. |
| **Perfil de tienda** | Datos, logo y portada que ve el usuario en la app. |
| **Soporte** | Chat con la plataforma (soporte 24/7 del Canvas). |

Para la cuenta en onboarding, **Mi tienda** muestra un checklist: datos de la
tienda → cargar catálogo → completar tablas de talles → publicar. Así la demo
puede mostrar el alta de una tienda de punta a punta y, al publicar, sus prendas
aparecen en la app del usuario.

En el admin, **Detalle de tienda** reutiliza estas mismas pantallas en modo
lectura, y **Carga de catálogo** sirve para que el equipo comercial cargue en
nombre de una tienda.

---

## 5. Panel de administración

Mismo layout que Sinergia (sidebar oscura, topbar, búsqueda global).

| Pantalla | Qué resuelve |
|---|---|
| **Panel general** | Usuarios activos del mes, usuarios Premium, conversión a Premium, ventas derivadas, comisiones, ingresos del mes, devoluciones evitadas. Evolución de 12 meses. |
| **Hipótesis y riesgos** | La tabla de la sección 1, en vivo: cada hipótesis de los documentos con su métrica, su meta y su estado (✓ / ✗ / sin datos). Es la pantalla para cerrar la presentación. |
| **Tiendas** | ABM de tiendas asociadas: estado (onboarding / activa / pausada), comisión pactada, prendas cargadas, % de catálogo con tabla de medidas, ventas y devoluciones. |
| **Detalle de tienda** | Lo que la app le aporta a esa tienda: conversión, devoluciones por talle antes vs. después, ventas derivadas, comisión del mes, sus prendas. Es también el **«panel de métricas para tiendas»** que promete el Canvas. |
| **Carga de catálogo** | Carga asistida de un CSV de prendas con su tabla de talles: valida columnas, detecta talles sin medidas y muestra una vista previa antes de publicar (actividad clave del Canvas). |
| **Catálogo de prendas** | Todas las prendas, con su tabla de talles editable y cuántas veces se recomendó, probó y compró cada una. |
| **Usuarios** | Lista con plan, edad, canal de adquisición, fecha de alta, actividad. Las medidas y la foto **se muestran enmascaradas** salvo que se pida verlas (privacidad). |
| **Ficha de usuario** | Actividad, recomendaciones, pruebas, compras y suscripción. |
| **Suscripciones e ingresos** | Altas, bajas, churn, MRR, mensual vs. anual, ingresos por suscripción vs. por comisión. |
| **Ventas y comisiones** | Ventas derivadas por tienda y mes, liquidación mensual de comisiones a cobrar. |
| **Precisión del algoritmo** | Aciertos de talle por categoría, por tienda y por calce; prendas con más devoluciones (tablas de talles mal cargadas). |
| **Probador virtual / costos de IA** | Pruebas por día, latencia p50/p95, tasa de fallos, costo por prueba, **costo de IA por suscriptor vs. precio del plan**. |
| **Marketing** | Campañas por canal (TikTok, Instagram, influencers, orgánico): gasto, altas, Premium, CAC y payback en meses. |
| **Soporte** | Bandeja de tickets del chat, con estado y tiempo de respuesta. |
| **Privacidad y datos** | Consentimientos, fotos almacenadas, solicitudes de borrado y su plazo de cumplimiento. |
| **Configuración** | Precios de los planes, comisión por defecto, identidad de marca y «Restablecer la demostración». |

---

## 6. Las dos piezas «inteligentes»

### Recomendador de talles (funciona de verdad)

No es un número inventado: es un cálculo determinístico y explicable, en
`src/app/lib/talles.ts`.

1. Cada prenda tiene una tabla de talles con rangos por zona
   (`pecho`, `cintura`, `cadera`, `largo`, `entrepierna`).
2. Según la categoría pesa cada zona (remera: pecho; jean: cintura y cadera;
   campera: pecho y largo).
3. Ajusta por el calce de la prenda (slim / regular / oversize) y la
   preferencia del usuario.
4. Elige el talle de menor distancia; la **confianza** sale de cuánto le gana
   al segundo mejor.
5. Devuelve el veredicto por zona («justo», «ideal», «holgado») que ve la
   pantalla de detalle.

Si cambiás tus medidas en el perfil, todas las recomendaciones cambian en vivo,
y es la mejor forma de mostrar que el algoritmo existe.

### Probador virtual (simulado, con imágenes hechas con IA)

La app **no llama a ninguna IA** y no tiene costo por uso. Pero respeta lo que
dicen los documentos: el usuario **sube una foto o se prueba en vivo con la
cámara**. Hay tres caminos, y los tres terminan en una imagen de la persona con
la prenda puesta:

| Camino | Qué hace el usuario | Qué pasa por detrás | Cómo se ve |
|---|---|---|---|
| **1. Foto de ejemplo** | Elige una de las 3 personas demo (o «usar mi foto guardada» en las cuentas demo) | Muestra el resultado **pregenerado con IA** para esa persona y esa prenda, después de la animación «Probándote la prenda… 6 s» | Realista: es la imagen que daría el producto real |
| **2. Subir tu foto** | Sube una foto de cuerpo entero | La prenda (PNG recortado) se **superpone** sobre la foto, ubicada y escalada según el talle elegido; se puede ajustar arrastrando | Creíble pero claramente una aproximación |
| **3. En vivo** | Activa la cámara | Muestra la cámara espejada con la prenda superpuesta, que se acomoda arrastrando y con un control de tamaño. (Seguir el cuerpo con detección de pose, por ejemplo MediaPipe, queda como mejora futura.) | Efecto «espejo»: lo más llamativo para la presentación |

El camino 1 es el que se usa en el guion de la demo, porque es el que mejor
muestra la promesa del producto. El 2 y el 3 demuestran que el flujo de «subís
tu foto / te probás en vivo» existe de verdad.

En los tres, **la foto o la cámara nunca salen del navegador**: no hay servidor
que las reciba. La foto se guarda localmente y se puede borrar desde Privacidad.

**Al cambiar de talle** en el resultado, la imagen cambia: en el camino 1 hay
una imagen por talle para las prendas destacadas (S/M/L: ajustada, justa,
holgada); en el 2 y el 3 cambia la escala de la prenda superpuesta.

#### Cómo se hacen las imágenes

Se generan **una sola vez**, antes de construir, y quedan como archivos en
`public/probador/` y `public/looks/`:

1. **3 personas demo** (cuerpo entero, de frente, fondo liso): pueden ser fotos
   de gente del grupo (con su permiso) o personas generadas con IA.
2. **~12 prendas destacadas** (fotos de producto, de frente, fondo liso).
3. Cada persona × cada prenda pasa por una herramienta gratuita de prueba
   virtual (hay demos públicas de modelos como IDM-VTON o Kolors Virtual
   Try-On). Son ~36 imágenes, más las variantes de talle de las más vistosas.
4. Las mismas imágenes de una de las personas sirven para la **portada animada**
   (sección 3 bis), recortadas con fondo transparente.

Mientras esas imágenes no estén, la app usa **ilustraciones en SVG**
(`src/app/components/figura/`): tres personas tipo figurín (Ana, Tomás y Mía)
y cada prenda dibujada según su categoría, color, estampa y calce. La prenda se
dibuja con la holgura que calcula el recomendador, así un talle chico se ve
tirante y uno grande con aire. Cuando estén las imágenes, se reemplazan y el
flujo sigue igual.

El costo y la latencia que muestra el admin en *Probador virtual / costos de IA*
siguen siendo **datos generados**, calibrados con los precios públicos de los
proveedores de try-on, para poder discutir la hipótesis de viabilidad 3.

---

## 7. Datos

Igual que Sinergia: un **PRNG sembrado por string**, fecha fija
(`HOY = 2026-10-22`) y generación **calibrada hacia atrás desde las metas**.

| Entidad | Cantidad | Origen |
|---|---|---|
| Tiendas | 42 (37 activas, 3 en alta, 2 pausadas) | De ejemplo, nombres ficticios |
| Prendas | ~390, con tabla de talles | Generadas; ilustradas en SVG |
| Usuarios | 2.400 (más las 3 cuentas demo), sin escalar | Generados |
| Recomendaciones, pruebas, ventas, devoluciones, suscripciones | 12 meses de historia | Generados |
| Campañas de marketing | ~25 (canales e influencers ficticios) | Generados |
| Tickets de soporte, solicitudes de privacidad | Pocas decenas | Generados |

**Las tiendas e influencers son ficticios a propósito:** usar marcas reales de
ropa haría parecer que esas marcas son socias de la app.

**Reglas que siguen los datos:**

- Las ventas que siguieron la recomendación se devuelven por talle mucho menos
  que las que no (eso es lo que valida la propuesta de valor para las tiendas).
- La precisión varía por categoría: los jeans fallan más que las remeras.
- Los usuarios que vinieron por influencers convierten más a Premium pero
  cuestan más.
- Cada prueba virtual tiene latencia y costo; el costo de IA por suscriptor sale
  de las pruebas reales de cada uno.
- Hay estacionalidad (picos en cambio de temporada y fin de año).

**Supuestos de negocio (editables en Configuración):** Premium mensual $ 249,
anual $ 1.990, comisión por defecto 6 % sobre la venta derivada, costo de IA
USD 0,03 por prueba. La moneda por defecto es pesos uruguayos.

Lo que cambia en la sesión se guarda en `localStorage` con versión, y se
descarta desde **Configuración → Restablecer la demostración**.

---

## 8. Estructura de carpetas

```
src/app/
  data/        tiendas.ts · prendas.ts · usuarios.ts · seed.ts (motor) · supuestos.ts
  lib/         auth.ts · store.tsx · format.ts · talles.ts (recomendador) · marca.ts
               probador.ts (elige imagen pregenerada o superposición) · pose.ts (cámara en vivo)
  components/  shell.tsx · logo.tsx · prenda-card.tsx · talle-badge.tsx · probador.tsx
               layout/panel/ (sidebar, topbar: admin y tienda)
               layout/app/   (barra de pestañas, marco móvil)
               ui/ (shadcn, copiado)
  pages/       portada.tsx (animación de scroll) · login.tsx
               app/     (12 pantallas de usuario)
               tienda/  (9 pantallas de tienda)
               admin/   (17 pantallas de administración)
public/looks/      (imágenes de la portada)
public/probador/   (personas demo, prendas recortadas y resultados pregenerados)
```

Rutas: `/` portada pública, `/login`, `/app/*` usuario, `/tienda/*` tienda,
`/admin/*` administración. Cada rol se redirige a su portal al entrar y no puede
abrir los otros.

---

## 9. Fases de trabajo

| Fase | Entrega | Cuándo se puede mostrar |
|---|---|---|
| **0. Base** | Proyecto copiado de Sinergia y limpio, marca nueva, login con las 6 cuentas, los layouts vacíos | — |
| **0 bis. Imágenes** | Personas demo, prendas destacadas y resultados de prueba virtual generados con IA, recortados | La hace el grupo, en paralelo a las fases 1 y 2 (mientras, van siluetas provisorias) |
| **1. Datos y algoritmo** | Motor de datos, tablas de talles, recomendador con tests de casos borde | — |
| **2. App de usuario** | Onboarding, Inicio, Explorar, Detalle de prenda, Probador (foto de ejemplo y subir foto), Mis compras, Premium, Perfil | **Ya se puede demostrar el producto** |
| **2 bis. Probador en vivo** | Cámara con la prenda siguiendo el cuerpo | Opcional: si hay tiempo, es lo más vistoso |
| **3. Portada animada** | Looks generados con el probador, recortados; animación de scroll | **Primera impresión lista** |
| **4. Portal de tienda** | Las 9 pantallas, con el alta de punta a punta para la cuenta en onboarding | |
| **5. Admin núcleo** | Panel general, Hipótesis y riesgos, Tiendas + detalle, Usuarios, Ventas y comisiones, Precisión | **Demo completa de los tres lados** |
| **6. Admin resto** | Carga de catálogo, Catálogo, Suscripciones, Costos de IA, Marketing, Soporte, Privacidad, Configuración | |
| **7. Pulido** | Responsive, estados vacíos, README con guion de demo, despliegue | Lista para presentar |

**Despliegue:** como es 100 % estática, sirve cualquiera: Netlify o Vercel con
deploy en cada push a `main`, o el mismo esquema de la VM de Sinergia. La cámara
en vivo exige HTTPS, que los tres ya dan.

---

## 10. Guion de demo sugerido (5 minutos)

1. **Portada** → scrollear y ver a la persona cambiar de look.
2. **Entrar como `nuevo`** → onboarding de medidas → aparece el feed con talles calculados.
3. **Abrir una prenda** → «Tu talle: M · 92 %» y el detalle por zona; cambiar la altura en el perfil y ver que la recomendación cambia.
4. **Probármela** con una persona demo → cambiar de talle y ver la diferencia → pasar a Premium (checkout simulado). Si está el modo en vivo, alguien del grupo se para frente a la cámara.
5. **Comprar en la tienda** → la compra queda registrada; responder «¿te quedó bien?».
6. **Entrar como `tienda`** → la venta aparece en *Ventas y devoluciones*; mostrar devoluciones antes vs. después.
7. **Entrar como `admin`** → la venta, la comisión y el nuevo Premium ya están en el panel.
8. **Hipótesis y riesgos** → qué metas se cumplen, cuál no, y cómo se validaría.

---

## 11. Decisiones abiertas

- **Nombre definitivo y marca** (colores, logo). Por ahora la app se llama «ROPA».
- **Moneda y precios** de los planes (por defecto, pesos uruguayos).


Resueltas: portal de tienda con login propio (sí); probador sin IA en vivo, con
imágenes pregeneradas, superposición y cámara (sí); portada con animación de
scroll (sí); personas demo generadas con IA.
