/**
 * float-whats.js
 * -----------------------------------------------------------------------------
 * <float-whats> — Botón flotante de WhatsApp como Web Component nativo.
 *
 * Vanilla JS puro, sin dependencias. Compatible con WordPress, Elementor y
 * sitios HTML estáticos. Todo el estilo vive aislado dentro de un Shadow DOM,
 * por lo que puede usarse múltiples veces en la misma página sin colisiones.
 *
 * Uso:
 *   <script src="float-whats.js" defer></script>
 *   <float-whats phone="523326507207"></float-whats>
 *
 * @author  Javi Mata
 * @license MIT
 */
(function () {
  'use strict';

  // Evita re-registrar el elemento si el script se carga más de una vez
  // (común en builders como Elementor que pueden inyectar scripts dos veces).
  if (customElements.get('float-whats')) {
    return;
  }

  /**
   * Icono SVG de WhatsApp embebido. `currentColor` permite teñirlo vía CSS
   * con la propiedad `color`, que enlazamos al atributo `icon-color`.
   * @type {string}
   */
  var WHATSAPP_SVG =
    '<svg viewBox="0 0 32 32" width="60%" height="60%" fill="currentColor" ' +
    'aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M16.04 4c-6.6 0-11.96 5.36-11.96 11.96 0 2.11.55 4.17 1.6 ' +
    '5.99L4 28l6.2-1.62a11.9 11.9 0 0 0 5.83 1.49h.01c6.6 0 11.96-5.36 ' +
    '11.96-11.96C28 9.36 22.64 4 16.04 4zm0 21.86h-.01a9.9 9.9 0 0 1-5.04-1.38' +
    'l-.36-.21-3.68.96.98-3.59-.24-.37a9.86 9.86 0 0 1-1.51-5.27c0-5.47 ' +
    '4.45-9.92 9.93-9.92 2.65 0 5.14 1.03 7.01 2.91a9.86 9.86 0 0 1 2.9 ' +
    '7.02c0 5.47-4.45 9.92-9.98 9.92zm5.45-7.43c-.3-.15-1.77-.87-2.04-.97' +
    '-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15' +
    '-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61' +
    '.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15' +
    '-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37' +
    '-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 ' +
    '5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.77-.72 ' +
    '2.02-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35z"/></svg>';

  /**
   * Valores por defecto de la configuración. Se sobreescriben con los
   * atributos presentes en el elemento.
   * @type {Object}
   */
  var DEFAULTS = {
    phone: '',
    bgColor: '#25D366',
    iconColor: '#FFFFFF',
    bottom: '20',
    right: '20',
    left: '',
    size: '60',
    zIndex: '9999',
    eventName: 'click_whatsapp',
    sendPhone: false,
    metaEvent: 'Contact',
    gaSendTo: '',
    metaPixelId: ''
  };

  /**
   * Eventos estándar del pixel de Meta. Si `meta-event` es uno de estos se
   * envía con `fbq('track', …)`; cualquier otro nombre se considera evento
   * personalizado y se envía con `fbq('trackCustom', …)`.
   * @type {string[]}
   */
  var META_STANDARD_EVENTS = [
    'AddPaymentInfo', 'AddToCart', 'AddToWishlist', 'CompleteRegistration',
    'Contact', 'CustomizeProduct', 'Donate', 'FindLocation', 'InitiateCheckout',
    'Lead', 'Purchase', 'Schedule', 'Search', 'StartTrial', 'SubmitApplication',
    'Subscribe', 'ViewContent', 'PageView'
  ];

  /**
   * Web Component del botón flotante de WhatsApp.
   * @extends HTMLElement
   */
  class FloatWhats extends HTMLElement {
    /**
     * Atributos observados: cualquier cambio en ellos dispara
     * {@link FloatWhats#attributeChangedCallback}.
     * @returns {string[]}
     */
    static get observedAttributes() {
      return [
        'phone',
        'bg-color',
        'icon-color',
        'bottom',
        'right',
        'left',
        'size',
        'z-index',
        'event-name'
      ];
    }

    constructor() {
      super();

      /** @private {ShadowRoot} */
      this._shadow = this.attachShadow({ mode: 'open' });

      /** @private {HTMLAnchorElement|null} Referencia al enlace renderizado. */
      this._link = null;

      /** @private {HTMLStyleElement|null} Hoja de estilos del shadow. */
      this._styleEl = null;

      /**
       * Handler de click enlazado a la instancia para poder removerlo
       * en disconnectedCallback y evitar fugas de memoria.
       * @private {Function}
       */
      this._onClick = this._handleClick.bind(this);

      /** @private {boolean} Indica si el DOM interno ya fue construido. */
      this._rendered = false;
    }

    /** Ciclo de vida: el elemento se conecta al DOM. */
    connectedCallback() {
      if (!this._rendered) {
        this.render();
        this._rendered = true;
      }
      this.updateStyles();
      this.bindEvents();
    }

    /** Ciclo de vida: el elemento se desconecta del DOM. */
    disconnectedCallback() {
      if (this._link) {
        this._link.removeEventListener('click', this._onClick);
      }
    }

    /**
     * Ciclo de vida: cambió un atributo observado.
     * @param {string} name     Nombre del atributo.
     * @param {?string} oldVal  Valor anterior.
     * @param {?string} newVal  Valor nuevo.
     */
    attributeChangedCallback(name, oldVal, newVal) {
      if (oldVal === newVal || !this._rendered) {
        return;
      }
      // El href depende de `phone`; el resto solo afecta estilos/atributos.
      if (name === 'phone' || name === 'event-name') {
        this.updateLink();
      }
      this.updateStyles();
    }

    /**
     * Lee y normaliza la configuración a partir de los atributos HTML,
     * aplicando valores por defecto cuando faltan.
     * @returns {{phone:string,bgColor:string,iconColor:string,bottom:string,right:string,left:string,size:string,zIndex:string,eventName:string,sendPhone:boolean,metaEvent:string,gaSendTo:string,metaPixelId:string}}
     */
    getConfig() {
      var get = function (attr, fallback) {
        var v = this.getAttribute(attr);
        return v === null || v.trim() === '' ? fallback : v.trim();
      }.bind(this);

      // Atributo booleano: ausente => fallback. Presente sin valor o con
      // 'true'/'1'/'yes' => true. Cualquier otro valor ('false', '0'…) => false.
      var getBool = function (attr, fallback) {
        var v = this.getAttribute(attr);
        if (v === null) {
          return fallback;
        }
        v = v.trim().toLowerCase();
        return v === '' || v === 'true' || v === '1' || v === 'yes';
      }.bind(this);

      return {
        phone: (get('phone', DEFAULTS.phone) || '').replace(/[^\d]/g, ''),
        bgColor: get('bg-color', DEFAULTS.bgColor),
        iconColor: get('icon-color', DEFAULTS.iconColor),
        bottom: get('bottom', DEFAULTS.bottom),
        right: get('right', DEFAULTS.right),
        left: this.getAttribute('left'), // puede ser null o '' a propósito
        size: get('size', DEFAULTS.size),
        zIndex: get('z-index', DEFAULTS.zIndex),
        eventName: get('event-name', DEFAULTS.eventName),
        sendPhone: getBool('send-phone', DEFAULTS.sendPhone),
        metaEvent: get('meta-event', DEFAULTS.metaEvent),
        gaSendTo: get('analytics-send-to', DEFAULTS.gaSendTo),
        metaPixelId: get('meta-pixel-id', DEFAULTS.metaPixelId)
      };
    }

    /**
     * Construye el DOM interno del Shadow DOM una sola vez.
     * Usa createElement para los nodos y un <style> para el CSS.
     */
    render() {
      var cfg = this.getConfig();

      // Hoja de estilos encapsulada.
      this._styleEl = document.createElement('style');
      this._styleEl.textContent = this._baseCss();
      this._shadow.appendChild(this._styleEl);

      // Enlace principal (el botón en sí).
      var link = document.createElement('a');
      link.className = 'fw-btn';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('part', 'button');
      link.setAttribute('aria-label', 'Abrir conversación de WhatsApp');
      link.setAttribute('role', 'button');

      // Slot para el icono: si el usuario pasa <svg slot="icon"> (o cualquier
      // nodo con slot="icon") se usa ese; si no, cae al SVG por defecto.
      var slot = document.createElement('slot');
      slot.name = 'icon';
      slot.innerHTML = WHATSAPP_SVG; // contenido fallback del slot.
      link.appendChild(slot);

      this._shadow.appendChild(link);
      this._link = link;

      this.updateLink(cfg);
    }

    /**
     * Actualiza el href (enlace wa.me) y el aria-label según el teléfono.
     * @param {Object} [cfg] Configuración ya resuelta (opcional, se recalcula si falta).
     */
    updateLink(cfg) {
      if (!this._link) {
        return;
      }
      cfg = cfg || this.getConfig();

      if (cfg.phone) {
        this._link.href = 'https://wa.me/' + cfg.phone;
        this._link.removeAttribute('aria-disabled');
        this._link.setAttribute(
          'aria-label',
          'Escríbenos por WhatsApp al ' + cfg.phone
        );
      } else {
        // Sin teléfono no generamos enlace funcional, pero no rompemos nada.
        this._link.removeAttribute('href');
        this._link.setAttribute('aria-disabled', 'true');
        this._link.setAttribute('aria-label', 'WhatsApp no disponible');
      }
    }

    /**
     * Sincroniza las variables CSS del Shadow DOM con la configuración actual.
     * El posicionamiento prioriza `left` cuando está presente.
     */
    updateStyles() {
      var cfg = this.getConfig();
      var hasLeft = cfg.left !== null && cfg.left.trim() !== '';

      var s = this.style;
      // Variables custom que consume el CSS base del shadow.
      s.setProperty('--fw-bg', cfg.bgColor);
      s.setProperty('--fw-icon', cfg.iconColor);
      s.setProperty('--fw-size', this._toPx(cfg.size));
      s.setProperty('--fw-zindex', cfg.zIndex);
      s.setProperty('--fw-bottom', this._toPx(cfg.bottom));

      if (hasLeft) {
        s.setProperty('--fw-left', this._toPx(cfg.left));
        s.setProperty('--fw-right', 'auto');
      } else {
        s.setProperty('--fw-right', this._toPx(cfg.right));
        s.setProperty('--fw-left', 'auto');
      }
    }

    /**
     * Enlaza los eventos del componente (idempotente).
     */
    bindEvents() {
      if (!this._link) {
        return;
      }
      // Evita listeners duplicados si connectedCallback se invoca varias veces.
      this._link.removeEventListener('click', this._onClick);
      this._link.addEventListener('click', this._onClick);
    }

    /**
     * Maneja el click: dispara tracking y deja continuar la navegación.
     * @private
     * @param {MouseEvent} ev
     */
    _handleClick(ev) {
      var cfg = this.getConfig();

      if (!cfg.phone) {
        ev.preventDefault();
        return;
      }

      this._track(cfg);

      // Emite un evento DOM componible por si el sitio quiere reaccionar.
      this.dispatchEvent(
        new CustomEvent('float-whats:click', {
          bubbles: true,
          composed: true,
          detail: {
            phone: cfg.phone,
            eventName: cfg.eventName,
            sendPhone: cfg.sendPhone
          }
        })
      );
    }

    /**
     * Envía eventos a las plataformas de analítica disponibles.
     * Cada llamada se protege con try/catch para que un fallo de tracking
     * nunca impida abrir WhatsApp.
     * @private
     * @param {Object} cfg
     */
    _track(cfg) {
      // Google Analytics (gtag)
      try {
        if (typeof window.gtag === 'function') {
          var gaParams = {};
          if (cfg.sendPhone) {
            gaParams.phone_number = cfg.phone;
          }
          // Enruta el evento a un destino concreto (Measurement ID, conversión
          // AW-…/label o grupo de envío). Sin esto, va a todos los destinos.
          if (cfg.gaSendTo) {
            gaParams.send_to = cfg.gaSendTo;
          }
          window.gtag('event', cfg.eventName, gaParams);
        }
      } catch (e) {
        /* noop */
      }

      // Meta Pixel (fbq)
      try {
        if (typeof window.fbq === 'function') {
          var fbParams = { content_name: 'whatsapp' };
          if (cfg.sendPhone) {
            fbParams.phone_number = cfg.phone;
          }
          // Evento estándar => 'track'; personalizado => 'trackCustom'.
          var isStd = META_STANDARD_EVENTS.indexOf(cfg.metaEvent) !== -1;
          if (cfg.metaPixelId) {
            // Dirige el evento SOLO a ese pixel (útil con varios en la página).
            window.fbq(
              isStd ? 'trackSingle' : 'trackSingleCustom',
              cfg.metaPixelId,
              cfg.metaEvent,
              fbParams
            );
          } else {
            // Comportamiento por defecto: a todos los pixeles inicializados.
            window.fbq(isStd ? 'track' : 'trackCustom', cfg.metaEvent, fbParams);
          }
        }
      } catch (e) {
        /* noop */
      }

      // Google Tag Manager (dataLayer)
      try {
        if (window.dataLayer && typeof window.dataLayer.push === 'function') {
          var dlEvent = { event: 'whatsapp_click' };
          if (cfg.sendPhone) {
            dlEvent.phone_number = cfg.phone;
          }
          window.dataLayer.push(dlEvent);
        }
      } catch (e) {
        /* noop */
      }
    }

    /**
     * Convierte un valor a píxeles. Si ya trae unidad (px, %, rem…) lo respeta.
     * @private
     * @param {string|number} val
     * @returns {string}
     */
    _toPx(val) {
      if (val === null || val === undefined || val === '') {
        return '0';
      }
      var str = String(val).trim();
      return /[a-z%]$/i.test(str) ? str : str + 'px';
    }

    /**
     * CSS base del componente. Usa variables custom para que updateStyles()
     * pueda actualizarlo sin reescribir la hoja completa.
     * @private
     * @returns {string}
     */
    _baseCss() {
      return [
        ':host {',
        '  --fw-bg: ' + DEFAULTS.bgColor + ';',
        '  --fw-icon: ' + DEFAULTS.iconColor + ';',
        '  --fw-size: 60px;',
        '  --fw-zindex: 9999;',
        '  --fw-bottom: 20px;',
        '  --fw-right: 20px;',
        '  --fw-left: auto;',
        '  display: block;',
        '}',
        ':host([hidden]) { display: none; }',
        '.fw-btn {',
        '  position: fixed;',
        '  z-index: var(--fw-zindex);',
        '  bottom: var(--fw-bottom);',
        '  right: var(--fw-right);',
        '  left: var(--fw-left);',
        '  width: var(--fw-size);',
        '  height: var(--fw-size);',
        '  display: flex;',
        '  align-items: center;',
        '  justify-content: center;',
        '  box-sizing: border-box;',
        '  border-radius: 50%;',
        '  background-color: var(--fw-bg);',
        '  color: var(--fw-icon);',
        '  text-decoration: none;',
        '  cursor: pointer;',
        '  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);',
        '  transition: transform 0.25s ease, box-shadow 0.25s ease;',
        '  -webkit-tap-highlight-color: transparent;',
        '}',
        '.fw-btn:hover {',
        '  transform: scale(1.1);',
        '  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);',
        '}',
        '.fw-btn:active { transform: scale(0.96); }',
        '.fw-btn:focus-visible {',
        '  outline: 3px solid rgba(37, 211, 102, 0.5);',
        '  outline-offset: 3px;',
        '}',
        '.fw-btn[aria-disabled="true"] {',
        '  opacity: 0.5;',
        '  pointer-events: none;',
        '}',
        '/* El slot ocupa el centro del botón y hereda el color del icono. */',
        'slot[name="icon"] {',
        '  display: flex;',
        '  align-items: center;',
        '  justify-content: center;',
        '  width: 60%;',
        '  height: 60%;',
        '  color: var(--fw-icon);',
        '}',
        '/* Iconos por defecto (dentro del slot) y personalizados (slotted). */',
        'slot[name="icon"] svg,',
        'slot[name="icon"] img,',
        '::slotted(svg),',
        '::slotted(img) {',
        '  width: 100%;',
        '  height: 100%;',
        '  display: block;',
        '}',
        '::slotted(svg) { fill: currentColor; }',
        '/* Responsive: reduce un poco el tamaño en pantallas pequeñas */',
        '@media (max-width: 480px) {',
        '  .fw-btn {',
        '    width: calc(var(--fw-size) * 0.85);',
        '    height: calc(var(--fw-size) * 0.85);',
        '  }',
        '}',
        '@media (prefers-reduced-motion: reduce) {',
        '  .fw-btn { transition: none; }',
        '  .fw-btn:hover { transform: none; }',
        '}'
      ].join('\n');
    }
  }

  // Registro del Custom Element.
  customElements.define('float-whats', FloatWhats);

  // Exponer la clase por si se necesita extender o instanciar programáticamente.
  window.FloatWhats = FloatWhats;
})();
