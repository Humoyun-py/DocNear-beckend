/**
 * DocNear Haptic Feedback Utility
 * Provides pleasant tactile vibration feedback on supported mobile devices and tablets.
 */

export type HapticFeedbackType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'selection'
  | 'success'
  | 'warning'
  | 'error';

export function triggerHaptic(type: HapticFeedbackType = 'light'): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  if (!('vibrate' in navigator) || typeof navigator.vibrate !== 'function') {
    return false;
  }

  try {
    switch (type) {
      case 'light':
        // Soft single tap for standard button clicks & chip selections
        return navigator.vibrate(10);

      case 'medium':
        // Distinct tap for modal opens, tab switches, dropdown selects
        return navigator.vibrate(25);

      case 'heavy':
        // Prominent tap for emergency actions, SOS button
        return navigator.vibrate(45);

      case 'selection':
        // Micro-tick for slider adjustments & list scrolling
        return navigator.vibrate(8);

      case 'success':
        // Multi-pulse celebration for confirmed bookings & successful actions
        return navigator.vibrate([30, 40, 50, 40, 70]);

      case 'warning':
        // Double pulse for warnings or cancel confirmations
        return navigator.vibrate([40, 60, 40]);

      case 'error':
        // Triple harsh vibration for validation or network errors
        return navigator.vibrate([60, 50, 60, 50, 80]);

      default:
        return navigator.vibrate(15);
    }
  } catch {
    // Fail silently on non-supporting or policy-restricted browsers
    return false;
  }
}
