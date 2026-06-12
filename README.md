# 💬 float-whats

Botón flotante de WhatsApp como **Web Component nativo** (`<float-whats>`).

Vanilla JavaScript puro, **sin dependencias**, encapsulado con **Shadow DOM** y listo para producción. Compatible con **WordPress, Elementor y sitios HTML estáticos**.

```html
<float-whats phone="523300000000"></float-whats>
```

---

## ✨ Características

- 🚫 **Cero dependencias** — solo JavaScript nativo (Custom Elements + Shadow DOM).
- 🎨 **Estilos aislados** — el Shadow DOM evita colisiones de CSS con tu sitio.
- ♻️ **Reutilizable** — usa varias instancias en la misma página sin conflictos.
- ⚡ **Reactivo** — responde a cambios de atributos en tiempo real.
- 📊 **Tracking integrado** — Google Analytics (gtag), Meta Pixel (fbq) y GTM (dataLayer).
- ♿ **Accesible** — `aria-label`, `role="button"`, `:focus-visible` y `prefers-reduced-motion`.
- 📱 **Responsive** — se adapta a pantallas pequeñas.
- 🧹 **Sin fugas de memoria** — limpia sus listeners al desconectarse.

---

## 📦 Instalación

### Opción A — Descarga directa

Descarga [`float-whats.js`](float-whats.js) y cárgalo en tu página:

```html
<script src="float-whats.js" defer></script>
```

### Opción B — CDN (jsDelivr vía GitHub)

**Recomendada para producción** — versión fijada (inmutable, no cambia bajo tus pies):

```html
<script src="https://cdn.jsdelivr.net/gh/adviewmx/float-whats@1.0.0/float-whats.min.js" defer></script>
```

Otras opciones según cuánto quieras auto-actualizar:

```html
<!-- Auto-parches dentro de la v1 (recibe 1.x.x, pero nunca un v2 que rompa) -->
<script src="https://cdn.jsdelivr.net/gh/adviewmx/float-whats@1/float-whats.min.js" defer></script>

<!-- Siempre la última versión publicada — cómodo, pero puede cambiar sin aviso -->
<script src="https://cdn.jsdelivr.net/gh/adviewmx/float-whats@latest/float-whats.min.js" defer></script>
```

> 💡 **Para sitios de clientes usa la versión fijada** (`@1.0.0`). Las URLs auto-actualizables
> son cómodas, pero un release con un bug podría afectar a todos los sitios a la vez. Fijar la
> versión te da control sobre cuándo actualizas.

---

## 🚀 Uso básico

Una vez cargado el script, basta con declarar el elemento. Solo `phone` es obligatorio:

```html
<float-whats phone="523300000000"></float-whats>
```

### Configuración completa

```html
<float-whats
  phone="523300000000"
  bg-color="#25D366"
  icon-color="#FFFFFF"
  bottom="20"
  right="20"
  left=""
  size="60"
  z-index="9999"
  event-name="click_whatsapp">
</float-whats>
```

---

## ⚙️ Atributos

| Atributo      | Tipo     | Default               | Descripción                                                        |
|---------------|----------|-----------------------|--------------------------------------------------------------------|
| `phone`       | string   | _(requerido)_         | Número con código de país, sin `+` ni espacios. Ej: `523326507207`. |
| `bg-color`    | string   | `#25D366`             | Color de fondo del botón.                                          |
| `icon-color`  | string   | `#FFFFFF`             | Color del icono de WhatsApp.                                       |
| `bottom`      | number   | `20`                  | Distancia desde abajo (px si no indicas unidad).                   |
| `right`       | number   | `20`                  | Distancia desde la derecha. Se ignora si se define `left`.         |
| `left`        | number   | _(vacío)_             | Distancia desde la izquierda. **Tiene prioridad sobre `right`.**   |
| `size`        | number   | `60`                  | Tamaño (ancho y alto) del botón.                                   |
| `z-index`     | number   | `9999`                | Orden de apilamiento del botón. Súbelo si queda detrás de otros elementos. |
| `event-name`  | string   | `click_whatsapp`      | Nombre del evento enviado a Google Analytics (gtag).               |
| `send-phone`  | boolean  | `false`               | Si es `true`, incluye el `phone_number` en los eventos de analítica. Por defecto el teléfono **no** se envía. |
| `meta-event`  | string   | `Contact`             | Nombre del evento del Meta Pixel. Si es estándar se envía con `fbq('track', …)`; si es personalizado, con `fbq('trackCustom', …)`. |
| `analytics-send-to` | string | _(vacío)_           | `send_to` de gtag: enruta el evento a un destino concreto (`G-XXXX`, `AW-XXXX/label` o grupo). Si se omite, va a **todos** los destinos gtag. |
| `meta-pixel-id` | string | _(vacío)_             | Dirige el evento de Meta **solo** a ese pixel (`trackSingle`/`trackSingleCustom`). Útil con varios pixeles. Si se omite, va a **todos**. |

> 💡 Los valores numéricos aceptan unidades explícitas (`size="4rem"`, `bottom="5vh"`). Sin unidad se asume `px`.

### 🧭 Posicionamiento

- El botón siempre usa `position: fixed`. El `z-index` por defecto es `9999` y se ajusta con el atributo `z-index`.
- Si defines `left`, el botón se ancla a la izquierda (`right` se ignora).
- Si **no** defines `left`, se usa `right`.

---

## 📊 Tracking de eventos

Al hacer click, el componente dispara automáticamente los siguientes eventos **solo si la herramienta existe** en la página. El campo `phone_number` se incluye **únicamente** si defines `send-phone="true"` (por defecto no se envía):

**Google Analytics (gtag.js)** — con `analytics-send-to` se añade `send_to` para enrutar a un destino concreto:
```js
gtag("event", eventName, { /* phone_number: phone (send-phone), send_to: id (analytics-send-to) */ });
```

**Meta Pixel (fbq)** — el evento es `Contact` por defecto, configurable con `meta-event`:
```js
fbq("track", "Contact", { content_name: "whatsapp" /* , phone_number: phone */ });
// Si meta-event no es un evento estándar de Meta, se usa fbq("trackCustom", …).
// Con meta-pixel-id se usa fbq("trackSingle"/"trackSingleCustom", pixelId, …) para dirigirlo a un solo pixel.
```

**Google Tag Manager (dataLayer)**
```js
window.dataLayer.push({ event: "whatsapp_click" /* , phone_number: phone */ });
```

Además emite un evento DOM personalizado por si quieres reaccionar desde tu propio código:

```js
document.querySelector('float-whats')
  .addEventListener('float-whats:click', function (e) {
    console.log(e.detail); // { phone, eventName, sendPhone }
  });
```

---

## 🔌 Implementación por plataforma

### Sitio HTML estático

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <script src="float-whats.js" defer></script>
</head>
<body>
  <float-whats phone="523300000000"></float-whats>
</body>
</html>
```

### WordPress

1. Sube `float-whats.js` a tu tema (ej. `/wp-content/themes/tu-tema/js/`).
2. Encólalo desde `functions.php`:

```php
add_action('wp_enqueue_scripts', function () {
  wp_enqueue_script(
    'float-whats',
    get_template_directory_uri() . '/js/float-whats.js',
    [],
    '1.0.0',
    true // en el footer
  );
});
```

3. Inserta el elemento en tu plantilla (`footer.php`) o en un bloque HTML personalizado:

```html
<float-whats phone="523300000000"></float-whats>
```

### Elementor

1. Carga el script (vía el método de WordPress de arriba, o con un plugin tipo *Insert Headers and Footers*).
2. Arrastra un widget **HTML** a tu página y pega:

```html
<float-whats phone="523300000000" bg-color="#25D366"></float-whats>
```

> El componente incluye una guarda para no registrarse dos veces, evitando errores si Elementor inyecta el script más de una vez.

---

## 🧩 Extender / personalizar

El componente está **cerrado a modificación pero abierto a extensión**: nunca necesitas editar `float-whats.js`. Todo se personaliza desde fuera, así puedes seguir actualizando la librería (p. ej. vía CDN) sin perder tus cambios.

### Icono personalizado (`<slot name="icon">`)

Por defecto se muestra el icono de WhatsApp embebido. Para usar el tuyo, pásalo como hijo con `slot="icon"`:

```html
<!-- Icono por defecto -->
<float-whats phone="523326507207"></float-whats>

<!-- SVG propio -->
<float-whats phone="523326507207">
  <svg slot="icon" viewBox="0 0 24 24">
    <path d="M12 2 2 22h20L12 2z" />
  </svg>
</float-whats>

<!-- También funciona con una imagen -->
<float-whats phone="523326507207">
  <img slot="icon" src="mi-icono.png" alt="" />
</float-whats>
```

> Un `<svg>` que use `fill="currentColor"` heredará automáticamente el color de `icon-color`.

### Tracking adicional (TikTok, LinkedIn, etc.)

El componente trae gtag, Meta Pixel y GTM de fábrica. Para **cualquier otra plataforma**, escucha el evento `float-whats:click` que emite el componente (burbujea y atraviesa el Shadow DOM). No hay que tocar la librería:

```js
// TikTok Pixel
document.addEventListener('float-whats:click', function (e) {
  if (window.ttq) {
    var params = { content_name: 'whatsapp' };
    if (e.detail.sendPhone) { params.phone = e.detail.phone; } // respeta send-phone
    ttq.track('Contact', params);
  }
});

// LinkedIn Insight Tag
document.addEventListener('float-whats:click', function () {
  if (window.lintrk) {
    window.lintrk('track', { conversion_id: 1234567 });
  }
});
```

El `detail` del evento incluye `{ phone, eventName, sendPhone }`.

### Estilos finos (`::part`)

El botón se expone como `part="button"`, así que puedes estilizarlo desde el CSS de tu sitio aunque viva dentro del Shadow DOM:

```css
float-whats::part(button) {
  box-shadow: 0 0 0 4px rgba(37, 211, 102, 0.3);
}
```

### Comportamiento avanzado (herencia)

Como es una clase nativa, puedes extenderla y registrar tu propia variante:

```js
class WhatsappConSaludo extends FloatWhats {
  getConfig() {
    const cfg = super.getConfig();
    // ...tu lógica extra
    return cfg;
  }
}
customElements.define('whatsapp-saludo', WhatsappConSaludo);
```

### Resumen de puntos de extensión

| Necesidad | Mecanismo | ¿Editar la librería? |
|---|---|---|
| Otro tracking (TikTok, LinkedIn…) | Escuchar `float-whats:click` | ❌ No |
| Icono distinto | `<slot name="icon">` | ❌ No |
| Ajustar sombra/animación | `::part(button)` | ❌ No |
| Cambiar comportamiento | `extends FloatWhats` | ❌ No |

---

## 🔄 Cambios dinámicos

El componente observa sus atributos y se actualiza solo. Puedes modificarlo por JavaScript en cualquier momento:

```js
const btn = document.querySelector('float-whats');
btn.setAttribute('bg-color', '#075E54');
btn.setAttribute('phone', '523300000000');
```

---

## 🌐 Compatibilidad

Funciona en todos los navegadores modernos que soportan Custom Elements v1 y Shadow DOM v1: Chrome, Edge, Firefox, Safari y sus equivalentes móviles.

---

## 📄 Licencia

MIT
