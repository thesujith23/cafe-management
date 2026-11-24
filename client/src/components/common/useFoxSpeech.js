import { useCallback, useEffect, useRef, useState } from 'react';
import { chatBotApi } from '../../api/apiServices';

/**
 * Gives Finnegan a voice.
 *
 * Tries the café's own speech route first (ElevenLabs behind the server, so the key never
 * reaches the browser). If that is not configured, or the request fails, it falls back to
 * the browser's speechSynthesis so the fox still talks.
 *
 * `amplitudeRef` is a 0–1 loudness value the 3D jaw reads every frame. It comes from a real
 * AnalyserNode on the audio element, or a synthetic envelope while the browser voice plays.
 */

const STORAGE_KEY = 'cafe.fox.voice';
const MAX_SPOKEN_CHARS = 400;

// The ElevenLabs voice is configured on the server now, so the fox talks by default. The
// speaker button in the header still silences him, and the stored choice wins from then on.
const readMuted = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'off') return true;
    if (stored === 'on') return false;
    return false;
  } catch {
    return false;
  }
};

export function useFoxSpeech() {
  const [muted, setMutedState] = useState(readMuted);
  const [speaking, setSpeaking] = useState(false);

  const amplitudeRef = useRef(0);
  const audioRef = useRef(null);
  const contextRef = useRef(null);
  const analyserRef = useRef(null);
  const frameRef = useRef(0);
  const cancelledRef = useRef(false);
  const synthTimerRef = useRef(0);

  const stopFrames = useCallback(() => {
    if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    if (synthTimerRef.current) window.clearInterval(synthTimerRef.current);
    synthTimerRef.current = 0;
    amplitudeRef.current = 0;
  }, []);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    stopFrames();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load?.();
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [stopFrames]);

  const ensureAudio = useCallback(() => {
    if (audioRef.current) return audioRef.current;
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;
    return audio;
  }, []);

  const ensureAnalyser = useCallback(() => {
    if (analyserRef.current) return analyserRef.current;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    try {
      const context = new AudioContextClass();
      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.68;
      const source = context.createMediaElementSource(ensureAudio());
      source.connect(analyser);
      analyser.connect(context.destination);
      contextRef.current = context;
      analyserRef.current = analyser;
      return analyser;
    } catch {
      return null;
    }
  }, [ensureAudio]);

  const pump = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.fftSize);
    const loop = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i += 1) {
        const value = (data[i] - 128) / 128;
        sum += value * value;
      }
      const rms = Math.sqrt(sum / data.length);
      const target = Math.min(1, rms * 4.4);
      amplitudeRef.current += (target - amplitudeRef.current) * 0.4;
      frameRef.current = window.requestAnimationFrame(loop);
    };
    frameRef.current = window.requestAnimationFrame(loop);
  }, []);

  const finish = useCallback(() => {
    stopFrames();
    setSpeaking(false);
  }, [stopFrames]);

  const speakWithBrowser = useCallback((text) => {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    if (!synth) {
      finish();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    // Slightly high and quick: a small, bright, friendly animal rather than a narrator.
    utterance.pitch = 1.3;
    utterance.rate = 1.04;
    utterance.volume = 1;
    const voices = synth.getVoices?.() || [];
    const preferred = voices.find((voice) => /^en/i.test(voice.lang) && /female|samantha|karen|zira|aria|jenny/i.test(voice.name))
      || voices.find((voice) => /^en/i.test(voice.lang));
    if (preferred) utterance.voice = preferred;

    utterance.onend = finish;
    utterance.onerror = finish;

    // No analyser on speechSynthesis, so fake a talking envelope.
    const started = performance.now();
    synthTimerRef.current = window.setInterval(() => {
      const t = (performance.now() - started) / 1000;
      const syllable = 0.55 + 0.45 * Math.abs(Math.sin(t * 9.4));
      amplitudeRef.current = 0.14 + 0.3 * syllable * (0.6 + 0.4 * Math.abs(Math.sin(t * 1.7)));
    }, 60);

    synth.speak(utterance);
  }, [finish]);

  const speak = useCallback(async (text) => {
    const clean = String(text || '').replace(/\s+/g, ' ').trim().slice(0, MAX_SPOKEN_CHARS);
    stop();
    if (!clean || muted) return;

    cancelledRef.current = false;
    setSpeaking(true);

    try {
      const audio = ensureAudio();
      const blob = await chatBotApi.speak(clean);
      if (cancelledRef.current) return;
      if (!(blob instanceof Blob) || blob.size < 512) throw new Error('No speech audio');

      const analyser = ensureAnalyser();
      if (contextRef.current?.state === 'suspended') await contextRef.current.resume();

      const url = URL.createObjectURL(blob);
      const cleanup = () => URL.revokeObjectURL(url);
      audio.onended = () => { cleanup(); finish(); };
      audio.onerror = () => { cleanup(); if (!cancelledRef.current) speakWithBrowser(clean); };
      audio.src = url;
      if (analyser) pump();
      await audio.play();
    } catch {
      if (!cancelledRef.current) speakWithBrowser(clean);
    }
  }, [ensureAnalyser, ensureAudio, finish, muted, pump, speakWithBrowser, stop]);

  const setMuted = useCallback((next) => {
    const value = Boolean(next);
    setMutedState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value ? 'off' : 'on');
    } catch {
      /* storage can be blocked; the toggle still works for this visit */
    }
    if (value) stop();
  }, [stop]);

  // Warm the voice list on some browsers, where it arrives asynchronously.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices?.();
    }
  }, []);

  useEffect(() => () => {
    stop();
    if (contextRef.current) contextRef.current.close?.().catch?.(() => {});
    contextRef.current = null;
    analyserRef.current = null;
  }, [stop]);

  return {
    speak,
    stop,
    muted,
    setMuted,
    speaking,
    amplitudeRef,
    supportsBrowserVoice: typeof window !== 'undefined'
      && typeof window.speechSynthesis !== 'undefined',
  };
}

export default useFoxSpeech;
