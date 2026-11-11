let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      // @ts-expect-error webkitAudioContext fallback for Safari
      window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }

  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

/**
 * Short, muted mechanical thud/click (180Hz dropping to 45Hz over 60ms with smooth gain ramp-down).
 */
export function playDropSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Frequency drop: 180Hz to 45Hz over 60ms
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.06);

    // Muted mechanical click gain profile
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  } catch (err) {
    console.debug('Error playing drop sound:', err);
  }
}

/**
 * Gentle sliding click with low-frequency resonance.
 */
export function playDrawerSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Resonant low-frequency component
    const oscLow = ctx.createOscillator();
    const gainLow = ctx.createGain();

    oscLow.type = 'triangle';
    oscLow.frequency.setValueAtTime(95, now);
    oscLow.frequency.exponentialRampToValueAtTime(55, now + 0.12);

    gainLow.gain.setValueAtTime(0.25, now);
    gainLow.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    oscLow.connect(gainLow);
    gainLow.connect(ctx.destination);

    oscLow.start(now);
    oscLow.stop(now + 0.14);

    // Subtle sliding friction click
    const oscHigh = ctx.createOscillator();
    const gainHigh = ctx.createGain();

    oscHigh.type = 'sine';
    oscHigh.frequency.setValueAtTime(480, now);
    oscHigh.frequency.exponentialRampToValueAtTime(220, now + 0.05);

    gainHigh.gain.setValueAtTime(0.1, now);
    gainHigh.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    oscHigh.connect(gainHigh);
    gainHigh.connect(ctx.destination);

    oscHigh.start(now);
    oscHigh.stop(now + 0.055);
  } catch (err) {
    console.debug('Error playing drawer sound:', err);
  }
}

