/**
 * Lightweight stand-ins for the Home Assistant custom elements used by cards.
 * These do NOT match HA's real behavior; they exist so cards can render in
 * Storybook and tests without console errors about unknown elements.
 *
 * ha-icon renders real MDI paths from `@mdi/js` so weather icons look right.
 */
import * as mdiIcons from '@mdi/js';

if (typeof customElements !== 'undefined' && !customElements.get('ha-card')) {
  class HaCardStub extends HTMLElement {
    connectedCallback() {
      this.style.display = 'block';
      this.style.background = 'var(--ha-card-background, var(--card-background-color, #1c1c1c))';
      this.style.color = 'var(--primary-text-color, #e1e1e1)';
      this.style.borderRadius = 'var(--ha-card-border-radius, 12px)';
      this.style.overflow = 'hidden';
      this.style.padding = '0';
    }
  }
  customElements.define('ha-card', HaCardStub);
}

if (typeof customElements !== 'undefined' && !customElements.get('ha-icon')) {
  function mdiNameToImport(icon: string): string {
    if (!icon.startsWith('mdi:')) return '';
    const name = icon.slice(4);
    const pascalCase = name
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
    return `mdi${pascalCase}`;
  }

  class HaIconStub extends HTMLElement {
    private _icon = '';

    static get observedAttributes() {
      return ['icon'];
    }

    connectedCallback() {
      // Real ha-icon sizes the *host* from --mdc-icon-size; the svg then fills
      // it. Sizing the svg directly (1em of the inherited font size) ignored
      // every `--mdc-icon-size: 3em` in the card styles, so the big header
      // icon came out body-text sized in Storybook but correct inside HA.
      this.style.display = 'inline-flex';
      this.style.alignItems = 'center';
      this.style.justifyContent = 'center';
      this.style.width = 'var(--mdc-icon-size, 24px)';
      this.style.height = 'var(--mdc-icon-size, 24px)';
      this.style.flexShrink = '0';
      this.render();
    }

    attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
      if (name === 'icon') {
        this._icon = newValue;
        this.render();
      }
    }

    set icon(value: string) {
      this._icon = value;
      this.setAttribute('icon', value);
      this.render();
    }

    get icon() {
      return this._icon;
    }

    private render() {
      const iconName = mdiNameToImport(this._icon);
      const path = (mdiIcons as Record<string, string>)[iconName];

      if (path) {
        this.innerHTML = `
          <svg viewBox="0 0 24 24" style="width: 100%; height: 100%; fill: currentColor;">
            <path d="${path}" />
          </svg>
        `;
      } else {
        this.innerHTML = '<span style="font-size: 0.75em;">●</span>';
      }
    }
  }
  customElements.define('ha-icon', HaIconStub);
}

if (typeof customElements !== 'undefined' && !customElements.get('ha-adaptive-dialog')) {
  // Approximation of HA's real ha-adaptive-dialog: a scrim + centered surface
  // with a header (close button + title) and a scrollable content area. The
  // real element also switches to a mobile bottom sheet and uses HA's exact
  // Material chrome — that only shows inside Home Assistant. This stub just
  // lets the card render and be dismissed in Storybook/tests.
  class HaAdaptiveDialogStub extends HTMLElement {
    private _initialized = false;

    connectedCallback() {
      if (this._initialized) return;
      this._initialized = true;

      const slotted = Array.from(this.childNodes);
      const title = this.getAttribute('header-title') ?? '';

      // Scrim
      this.style.cssText =
        'position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center;' +
        'justify-content: center; background: rgba(0, 0, 0, 0.6);';
      this.addEventListener('click', (e) => {
        if (e.target === this) this._close();
      });

      // `width` is an explicit size (not max-width): descendants (e.g. canvas
      // charts sized via ResizeObserver) need a definite box to measure
      // against, or a shrink-to-fit surface and a 100%-width child create a
      // circular layout that settles on an arbitrarily small size.
      const surface = document.createElement('div');
      surface.style.cssText =
        'display: flex; flex-direction: column; width: min(90vw, 560px);' +
        'max-height: 90vh; border-radius: 28px; overflow: hidden;' +
        'background: var(--ha-card-background, var(--card-background-color, #1c1c1c));' +
        'color: var(--primary-text-color, #e1e1e1); box-shadow: 0 8px 32px rgba(0,0,0,0.4);';

      const header = document.createElement('div');
      header.style.cssText =
        'display: flex; align-items: center; gap: 16px; padding: 12px 24px 12px 8px;';

      const closeBtn = document.createElement('button');
      closeBtn.setAttribute('aria-label', 'Close');
      closeBtn.textContent = '✕';
      closeBtn.style.cssText =
        'border: none; background: none; cursor: pointer; font-size: 20px; line-height: 1;' +
        'width: 40px; height: 40px; border-radius: 50%; color: inherit; flex-shrink: 0;';
      closeBtn.addEventListener('click', () => this._close());

      const titleEl = document.createElement('span');
      titleEl.textContent = title;
      titleEl.style.cssText = 'flex: 1; min-width: 0; font-size: 1.375rem; font-weight: 400;';

      header.append(closeBtn, titleEl);

      const body = document.createElement('div');
      body.style.cssText = 'padding: 0 24px 24px; overflow-y: auto;';
      for (const node of slotted) body.appendChild(node);

      surface.append(header, body);
      this.appendChild(surface);
    }

    private _close() {
      this.dispatchEvent(new CustomEvent('closed', { bubbles: true }));
    }
  }
  customElements.define('ha-adaptive-dialog', HaAdaptiveDialogStub);
}

if (typeof customElements !== 'undefined' && !customElements.get('ha-select')) {
  class HaSelectStub extends HTMLElement {
    private _select: HTMLSelectElement;

    constructor() {
      super();
      this._select = document.createElement('select');
      this._select.style.padding = '8px';
      this._select.style.width = '100%';
      this._select.addEventListener('change', (e) => {
        this.dispatchEvent(
          new CustomEvent('change', {
            detail: { value: (e.target as HTMLSelectElement).value },
            bubbles: true,
          }),
        );
      });
    }

    connectedCallback() {
      this.style.display = 'block';
      this.style.margin = '8px 0';

      const label = this.getAttribute('label');
      if (label) {
        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        labelEl.style.display = 'block';
        labelEl.style.marginBottom = '4px';
        this.appendChild(labelEl);
      }

      const items = Array.from(this.querySelectorAll('ha-list-item'));
      for (const item of items) {
        const opt = document.createElement('option');
        opt.value = item.getAttribute('value') ?? '';
        opt.textContent = item.textContent ?? '';
        this._select.appendChild(opt);
        item.remove();
      }

      this.appendChild(this._select);

      const value = this.getAttribute('value');
      if (value) this._select.value = value;
    }

    set value(v: string) {
      this._select.value = v;
    }

    get value() {
      return this._select.value;
    }
  }
  customElements.define('ha-select', HaSelectStub);
}

if (typeof customElements !== 'undefined' && !customElements.get('ha-list-item')) {
  class HaListItemStub extends HTMLElement {
    connectedCallback() {
      this.style.display = 'none';
    }
  }
  customElements.define('ha-list-item', HaListItemStub);
}
