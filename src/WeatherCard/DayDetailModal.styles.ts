import { css } from 'preact-homeassistant';

/* Dialog shell (scrim, surface, header, close button) is provided by
   <ha-adaptive-dialog>; this only covers the content slotted into it. */
export const dayDetailModalStyles = css`
.day-modal-body {
  width: 100%;
  max-width: 480px;
  min-width: min(320px, 80vw);
  font-size: 17.5px;
  display: flex;
  flex-direction: column;
  gap: 1em;
  margin: 15px auto 15px;
}

/* Condition hero */
.day-modal-hero {
  display: flex;
  align-items: center;
  gap: 0.75em;
}

.day-modal-hero-icon {
  --mdc-icon-size: 3em;
  color: var(--primary-text-color, #fff);
}

.day-modal-condition {
  font-size: 1.1em;
  font-weight: 600;
}

.day-modal-temps {
  font-size: 1.5em;
  font-weight: 600;
}

.day-modal-temp-separator {
  margin: 0 0.25em;
  opacity: 0.5;
  font-weight: 400;
}

/* Detail rows */
.day-modal-details {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}

.day-modal-row {
  display: flex;
  align-items: center;
  gap: 0.5em;
}

.day-modal-row ha-icon {
  --mdc-icon-size: 1.25em;
  color: var(--secondary-text-color, rgba(255, 255, 255, 0.7));
}

.day-modal-label {
  color: var(--secondary-text-color, rgba(255, 255, 255, 0.7));
  flex: 1;
}

.day-modal-value {
  font-weight: 600;
}
`;
