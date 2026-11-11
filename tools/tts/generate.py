#!/usr/bin/env python3
"""Generate the spoken narration for every station.

Reads audio/narration/script.json (exported from js/core/narration.js) and writes
audio/narration/<lang>/<station-key>.mp3. The tour plays these files when they exist
and falls back to the device's own speech voices when they do not.

Engines
  local       free, open-source, runs on CPU:
                English  Kokoro-82M (kokoro-onnx)   Apache-2.0
                Arabic   Piper ar_JO "kareem"       MIT, with automatic tashkeel
  elevenlabs  ElevenLabs multilingual v2 (needs ELEVENLABS_API_KEY)

Usage
  python tools/tts/generate.py --engine local --models /path/to/models
  ELEVENLABS_API_KEY=... python tools/tts/generate.py --engine elevenlabs \
      --en-voice <voice_id> --ar-voice <voice_id>
  Add --only thawr,hijrah to regenerate some stations, --lang en for one language.

Models for the local engine (put them in --models):
  kokoro-v1.0.onnx, voices-v1.0.bin
    https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
  ar_JO-kareem-medium.onnx, ar_JO-kareem-medium.onnx.json
    https://huggingface.co/rhasspy/piper-voices/tree/main/ar/ar_JO/kareem/medium
  pip install kokoro-onnx piper-tts soundfile numpy   (ffmpeg must be on PATH)
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile
import urllib.request
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "audio" / "narration" / "script.json"
OUT = ROOT / "audio" / "narration"


def to_mp3(wav_path, mp3_path, pad=0.35):
    """Loudness-normalise, add a breath of silence at both ends, encode a small mono MP3."""
    mp3_path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error", "-i", str(wav_path),
        "-af", f"adelay={int(pad * 1000)},apad=pad_dur={pad},loudnorm=I=-17:TP=-1.5:LRA=9,"
               "highpass=f=70,acompressor=threshold=-20dB:ratio=2:attack=8:release=120",
        "-ac", "1", "-ar", "44100", "-codec:a", "libmp3lame", "-b:a", "80k", str(mp3_path),
    ], check=True)


class Local:
    def __init__(self, models, en_voice, speed):
        import numpy as np  # noqa: F401
        from kokoro_onnx import Kokoro
        from piper import PiperVoice
        m = Path(models)
        self.kokoro = Kokoro(str(m / "kokoro-v1.0.onnx"), str(m / "voices-v1.0.bin"))
        self.piper = PiperVoice.load(str(m / "ar_JO-kareem-medium.onnx"))
        self.en_voice, self.speed = en_voice, speed

    def say(self, text, lang, wav_path):
        if lang == "en":
            import numpy as np
            import soundfile as sf
            # synthesise sentence by sentence with a short rest between, which reads more naturally
            parts, sr = [], 24000
            for s in split_sentences(respell(text)):
                audio, sr = self.kokoro.create(s, voice=self.en_voice, speed=self.speed, lang="en-gb")
                parts += [audio, np.zeros(int(sr * 0.32), dtype=audio.dtype)]
            sf.write(str(wav_path), np.concatenate(parts), sr)
        else:
            from piper import SynthesisConfig
            cfg = SynthesisConfig(length_scale=1.12, noise_scale=0.6, noise_w_scale=0.75)
            with wave.open(str(wav_path), "wb") as wf:
                self.piper.synthesize_wav(text, wf, syn_config=cfg)


class ElevenLabs:
    def __init__(self, voices, model):
        self.key = os.environ.get("ELEVENLABS_API_KEY")
        if not self.key:
            sys.exit("Set ELEVENLABS_API_KEY to use the ElevenLabs engine.")
        self.voices, self.model = voices, model

    def say(self, text, lang, wav_path):
        voice = self.voices[lang]
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128",
            data=json.dumps({
                "text": text, "model_id": self.model,
                "voice_settings": {"stability": 0.55, "similarity_boost": 0.8, "style": 0.15, "use_speaker_boost": True},
            }).encode(),
            headers={"xi-api-key": self.key, "Content-Type": "application/json", "Accept": "audio/mpeg"},
        )
        mp3 = wav_path.with_suffix(".src.mp3")
        with urllib.request.urlopen(req) as r, open(mp3, "wb") as f:
            f.write(r.read())
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(mp3), str(wav_path)], check=True)


# The local English voice reads Arabic names better from phonetic spellings.
# (Captions keep the proper spellings; this only changes what the voice is given.)
RESPELL = {
    "Abu Bakr": "Abu Backer", "Urayqit": "Ooray-kit", "Ka\u2019bah": "Kaaba", "Qur\u2019an": "Koraan",
    "Rumah": "Roomah", "Ajwa": "Ajwah", "al-Aliyah": "al Aaliya", "Wadi al-Aqiq": "Waadi al Akeek",
    "roshan": "rowshan", "Quba": "Koobaa", "Suffah": "Suffa", "Uthman ibn Affan": "Uthmaan ibn Affaan",
    "Salman al-Farisi": "Salmaan al Faarisi", "Madinat an-Nabi": "Madeenat an-Nabi", "Thawr": "Thowr",
    "Hejaz": "Hijaaz", "Hamzah": "Hamza", "Hijrah": "Hijra", "minbar": "minbar",
}


def respell(text):
    for a, b in RESPELL.items():
        text = text.replace(a, b)
    return text


def split_sentences(text):
    out, cur = [], ""
    for ch in text:
        cur += ch
        if ch in ".!?؟":
            out.append(cur.strip()); cur = ""
    if cur.strip():
        out.append(cur.strip())
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--engine", choices=["local", "elevenlabs"], default="local")
    ap.add_argument("--models", default=str(ROOT / "tools" / "tts" / "models"))
    ap.add_argument("--en-voice", default="bm_george", help="Kokoro voice, or ElevenLabs voice id")
    ap.add_argument("--ar-voice", default="", help="ElevenLabs voice id for Arabic")
    ap.add_argument("--model", default="eleven_multilingual_v2")
    ap.add_argument("--speed", type=float, default=0.92)
    ap.add_argument("--lang", choices=["en", "ar", "both"], default="both")
    ap.add_argument("--only", default="")
    a = ap.parse_args()

    script = json.loads(SCRIPT.read_text(encoding="utf-8"))
    keys = [k for k in script if not a.only or k in a.only.split(",")]
    langs = ["en", "ar"] if a.lang == "both" else [a.lang]
    if a.engine == "local":
        eng = Local(a.models, a.en_voice, a.speed)
    else:
        eng = ElevenLabs({"en": a.en_voice, "ar": a.ar_voice or a.en_voice}, a.model)

    with tempfile.TemporaryDirectory() as tmp:
        for k in keys:
            for lang in langs:
                text = script[k].get(lang)
                if not text:
                    continue
                wav = Path(tmp) / f"{lang}-{k}.wav"
                eng.say(text, lang, wav)
                dst = OUT / lang / f"{k}.mp3"
                to_mp3(wav, dst)
                print(f"{lang}/{k}.mp3  {dst.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
