// Ambient declarations for Home Assistant custom elements used in JSX.
// `any` keeps these forgiving — HA's element APIs are not stable enough to
// warrant strict types here.

import 'preact';

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ha-card': any;
      'ha-select': any;
      'ha-list-item': any;
      'ha-icon': any;
      'ha-textfield': any;
      'ha-switch': any;
      'ha-formfield': any;
      'ha-button': any;
      'ha-icon-button': any;
      'ha-entity-picker': any;
      'ha-form': any;
      'ha-selector': any;
    }
  }
}
