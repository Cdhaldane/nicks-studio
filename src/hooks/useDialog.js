import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Standard modal-dialog behaviour for a container element:
 *   - Escape closes it
 *   - focus moves inside on open, Tab cycles within it, and focus returns to
 *     whatever opened it on close
 *   - the page behind doesn't scroll
 *
 * Returns a ref for the dialog's root element.
 *
 * @param {boolean} isOpen
 * @param {() => void} onClose
 */
export const useDialog = (isOpen, onClose) => {
  const ref = useRef(null);
  // Latest onClose without re-running the effect (and re-stealing focus) each render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return undefined;
    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusables = () =>
      ref.current ? [...ref.current.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null) : [];

    // Wait a frame so the dialog has rendered (and finished any mount animation start).
    const frame = requestAnimationFrame(() => {
      const target = ref.current?.querySelector('[data-autofocus]') || focusables()[0] || ref.current;
      target?.focus({ preventScroll: true });
    });

    const onKeyDown = e => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !ref.current) return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || !ref.current.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (opener && typeof opener.focus === 'function') opener.focus({ preventScroll: true });
    };
  }, [isOpen]);

  return ref;
};

export default useDialog;
