export function playCelebrationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Victory fanfare: ascending arpeggio then final chord
    const melody = [
      { freq: 523.25, start: 0.00, dur: 0.18 },   // C5
      { freq: 659.25, start: 0.16, dur: 0.18 },   // E5
      { freq: 783.99, start: 0.32, dur: 0.18 },   // G5
      { freq: 1046.50, start: 0.48, dur: 0.35 },  // C6
    ];

    // Final chord (C major)
    const chord = [523.25, 659.25, 783.99, 1046.50];
    const chordStart = 0.88;

    function playNote(freq, startOffset, duration, volume = 0.28) {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const t = ctx.currentTime + startOffset;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(volume, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.start(t);
      osc.stop(t + duration + 0.05);
    }

    melody.forEach(({ freq, start, dur }) => playNote(freq, start, dur));
    chord.forEach(freq => playNote(freq, chordStart, 0.9, 0.18));

    // Extra sparkle layer (high sine harmonics)
    [2093, 2637, 3136].forEach((freq, i) => {
      playNote(freq, chordStart + i * 0.06, 0.5, 0.07);
    });
  } catch {
    // Audio blocked or not supported — silent fail
  }
}

export function sendBrowserNotification() {
  const show = () => {
    try {
      new Notification("Your plant is fully grown! 🌱", {
        body: "30 days complete — you actually did it. 🏆",
        icon: "/icon-192.svg",
        badge: "/icon-192.svg",
        tag: "lockin-challenge-complete",
      });
    } catch {
      // Notifications not supported
    }
  };

  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    show();
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(p => { if (p === "granted") show(); });
  }
}

export function vibratePhone() {
  try {
    if (navigator.vibrate) {
      // Build-up pattern: short taps → long hold
      navigator.vibrate([80, 60, 80, 60, 120, 80, 400]);
    }
  } catch {
    // Vibration not supported
  }
}

export function triggerCelebration() {
  playCelebrationSound();
  sendBrowserNotification();
  vibratePhone();
}
