// focusRing (web) — one focus ring in the brand colour instead of each
// browser's own (a black ring on text fields in Chrome). Text fields show it
// whenever they have focus; buttons, choices and links only when reached
// with the keyboard. A field drawn inside a rounded box (dataSet
// { focusRing: 'around' }) rings the box instead of the bare field.
// Phones draw their own focus (focusRing.js).

import { TOKENS } from '../constants/theme';

if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        :is(input, textarea, button, a, [role="button"], [role="radio"], [role="link"]):focus-visible {
            outline: 2px solid ${TOKENS.primary};
            outline-offset: 2px;
        }
        [data-focus-ring="around"]:focus-within {
            outline: 2px solid ${TOKENS.primary};
            outline-offset: 2px;
        }
        [data-focus-ring="around"] input:focus-visible {
            outline: none;
        }
    `;
    document.head.appendChild(style);
}
