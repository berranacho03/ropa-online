/** Textos de apoyo de las hipótesis: nombre corto y qué haríamos si no se cumple. */

export const CORTO: Record<string, string> = {
  F1: "Precisión del talle",
  F2: "Tiempo de la prueba virtual",
  F3: "Catálogo con tablas completas",
  F5: "Privacidad dentro de plazo",
  V1: "Conversión a Premium",
  V2: "Tiendas bajan devoluciones",
  V3: "Costo de IA vs. precio",
  V4: "Payback del marketing",
  V5: "Ingresos vs. costos fijos",
  D2: "Usuarios con foto",
  D4: "Mejor canal de adquisición",
  D5: "Uso después de comprar",
};

/** Qué haríamos (o cómo lo validaríamos) si la hipótesis no se cumple. */
export const PLAN_B: Record<string, { titulo: string; pasos: string[] }> = {
  F1: {
    titulo: "Afinar el recomendador donde más falla",
    pasos: [
      "Revisar las tablas de las prendas con más devoluciones por talle (suelen estar mal cargadas).",
      "Pedir medidas con cinta en jeans y pantalones, donde la estimación por altura y peso erra más.",
      "Usar el feedback «me quedó chico / grande» para corregir el molde de cada tienda.",
    ],
  },
  F2: {
    titulo: "Bajar el tiempo de la prueba",
    pasos: [
      "Precalcular la prenda recortada al publicarla, para que sólo se procese la foto del usuario.",
      "Mostrar una vista previa liviana a los 2 s y la final cuando esté.",
      "Comparar dos proveedores de generación de imágenes en una prueba A/B de latencia.",
    ],
  },
  F3: {
    titulo: "Que las tiendas completen sus tablas",
    pasos: [
      "Bloquear la publicación de prendas sin medidas en todos los talles.",
      "Ofrecer la carga asistida por CSV y una plantilla por categoría.",
      "Mostrarle a cada tienda cuántas ventas pierde por prendas incompletas.",
    ],
  },
  F5: {
    titulo: "Cumplir los plazos de privacidad",
    pasos: [
      "Automatizar el borrado de fotos y cuentas apenas se pide.",
      "Alerta a soporte cuando una solicitud pasa los 5 días.",
    ],
  },
  V1: {
    titulo: "Subir la conversión a Premium",
    pasos: [
      "Probar 7 días gratis de Premium al terminar el onboarding de medidas.",
      "Testear un precio menor (por ejemplo $ 199) o un plan por pruebas sueltas.",
      "Ofrecer Premium justo después de la primera recomendación de talle, cuando la duda es más alta.",
      "Medir: conversión por cohorte semanal con y sin prueba gratis.",
    ],
  },
  V2: {
    titulo: "Demostrarle a las tiendas que la comisión se paga sola",
    pasos: [
      "Enviar a cada tienda un reporte mensual de devoluciones evitadas en pesos.",
      "Comisión escalonada: menor los primeros tres meses.",
    ],
  },
  V3: {
    titulo: "Bajar el costo de IA por suscriptor",
    pasos: [
      "Limitar pruebas por mes en el plan mensual y cachear resultados repetidos.",
      "Negociar precio por volumen con el proveedor de imágenes.",
    ],
  },
  V4: {
    titulo: "Recuperar antes lo invertido en marketing",
    pasos: [
      "Pasar presupuesto de influencers grandes a micro-influencers con código propio.",
      "Lanzar un código de referido: un mes de Premium para quien invita y para quien llega.",
      "Cortar los canales con payback mayor a 6 meses dos meses seguidos.",
    ],
  },
  D2: {
    titulo: "Que más gente suba su foto",
    pasos: ["Mostrar el probador con un modelo de ejemplo antes de pedir la foto.", "Explicar dónde se guarda y cómo se borra."],
  },
  D4: {
    titulo: "Revisar el mix de canales",
    pasos: ["Medir altas y Premium por canal cada mes y mover presupuesto al que mejor convierte."],
  },
  D5: {
    titulo: "Que vuelvan después de la primera compra",
    pasos: [
      "Avisar cuando una tienda sube prendas de su talle y estilo.",
      "Preguntar a los 7 días «¿te quedó bien?» para traerlos de vuelta.",
    ],
  },
};
