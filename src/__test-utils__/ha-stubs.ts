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
          <svg viewBox="0 0 24 24" style="width: 1em; height: 1em; fill: currentColor;">
            <path d="${path}" />
          </svg>
        `;
      } else {
        this.innerHTML = '<span style="font-size: 1em;">●</span>';
      }
    }
  }
  customElements.define('ha-icon', HaIconStub);
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
