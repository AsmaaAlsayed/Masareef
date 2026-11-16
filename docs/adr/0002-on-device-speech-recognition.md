# ADR 0002: On-device speech recognition - whisper.cpp with a quantised Whisper model on Android; no web voice as the baseline

- **Status:** Proposed - PROVISIONAL. Chosen from documented evidence on 2026-11-16 by the product owner's instruction ("Decide on research, PoC first in build"). The measured proof of concept is the first build task and its result confirms or supersedes this ADR through a new ADR.
- **Date:** 2026-11-16
- **Relates to:** FR-023, FR-029, FR-030, FR-031, FR-032, FR-033, NFR-001, NFR-002, NFR-003, NFR-004, NFR-021, NFR-027; vision R-1, Q-06, Q-11

## Context
Decided by the product owner [FACT]: audio is processed on the device only and never leaves the phone or browser; if on-device accuracy cannot reach the targets, the targets are lowered through change control rather than using a cloud service; voice must understand Egyptian Arabic, English, and Arabic mixed with English; on the web, on-device recognition is to be tried and, if not good enough, voice ships on Android only. Test audio starts as synthetic and public; real speakers come before release.

Constraints from the requirements: Android 8.0 and later; total download before first voice entry of 150 MB or less (NFR-027, "to be revisited after the PoC"); voice entry in a median of 10 seconds including review (NFR-004); no network fallback ever (FR-031 criterion 3).

No recordings and no running code exist, so nothing below is a measurement of accuracy. What was checked on 2026-11-16:

**Android's built-in recogniser.** `SpeechRecognizer.createOnDeviceSpeechRecognizer` exists from API 31 (Android 12); `checkRecognitionSupport`, which tells an app which languages are installed or downloadable on-device, needs Android 13 (developer.android.com reference for `SpeechRecognizer` and `RecognitionSupport`). The supported languages "can vary based on the device and OS version". No source was found that confirms an on-device Arabic pack, Egyptian or otherwise. It is absent on devices without Google's services. Below API 31 an app can ask for offline recognition but cannot guarantee it.

**Browsers.** The Web Speech API's `processLocally` flag forces on-device recognition (MDN). The specification's explainer lists Chrome's on-device languages: de-DE, en-US, es-ES, fr-FR, hi-IN, id-ID, it-IT, ja-JP, ko-KR, pl-PL, pt-BR, ru-RU, th-TH, tr-TR, vi-VN, zh-CN, zh-TW. Arabic is not listed (github.com/WebAudio/web-speech-api, explainers/on-device-speech-recognition.md). Without the flag a browser may send audio to its vendor.

**Open engines and models** (sizes from the GitHub releases API and the Hugging Face API; licences from each repository):

| Engine / model | Version or file | Size | Licence | Notes |
|---|---|---|---|---|
| whisper.cpp | v1.9.5, 2026-10-06 | native library of a few MB per ABI | MIT | Android through the NDK (official example app); also builds to WebAssembly; supports quantised models; converts fine-tuned Hugging Face Whisper models with a script in the repository; documented memory about 273 MB (tiny), 388 MB (base), 852 MB (small) unquantised |
| Whisper tiny / base / small, `q5_1` | `ggerganov/whisper.cpp` files | 30.7 / 56.9 / 181.3 MiB | Weights Apache-2.0 (openai/whisper-* model cards) | Multilingual: one file covers Arabic and English |
| Whisper small `q8_0`; small unquantised | same | 252.2 / 465.0 MiB | same | Too large |
| Egyptian Arabic fine-tunes of Whisper small | for example `IbrahimAmin/code-switched-egyptian-arabic-whisper-small` (Apache-2.0), `MAdel121/whisper-small-egyptian-arabic` (MIT), `alexstokes/whisper-small-eg2` (Apache-2.0) | 181 MiB after conversion to `q5_1` | As stated on each page | Individual uploads with few downloads; reported error rates are on different test sets and not comparable; training-data licences undocumented. Fine-tunes of tiny exist too (`MohamedGomaa30/whisper-tiny_egyptian_asr`, Apache-2.0) |
| sherpa-onnx | v2.0.1, 2026-10-26 | Android library 47.2 MiB for all ABIs | Apache-2.0 | Prebuilt Android package; minSdk 21; runs several model families |
| Whisper through sherpa-onnx | tiny / base / small packages | 110.8 / 197.9 / 609.8 MiB | Apache-2.0 | The same models are far larger in this format |
| Moonshine base Arabic through sherpa-onnx | package dated 2026-02-27 | 113.6 MiB | Moonshine AI Community License: non-commercial, with free use preserved under USD 1,000,000 annual revenue (moonshine-ai/moonshine LICENSE lists Arabic Base and Tiny) | Arabic only, so English needs a second model; the model card says "Arabic ... with code-switching"; no dialect breakdown; reported word error rate for the tiny Arabic model: 20.76 on FLEURS, 36.55 on Common Voice 17 |
| Meta Omnilingual ASR through sherpa-onnx | 300M model, quantised | 278.8 MiB | not checked | Lists Egyptian Arabic but is too large |
| Vosk | Arabic models | larger than the limit for the usable model | Apache-2.0 | Standard Arabic only (from the planner's prior knowledge; not re-verified today because the size alone excludes it) |

## Decision
On Android, recognise speech with a bundled open engine, whisper.cpp v1.9.5, running a multilingual Whisper model quantised to `q5_1`, wrapped in a project-owned Capacitor plugin. The model is a separate, checksummed download made with the user's consent on first use. Which model size and whether an Egyptian fine-tune is used is decided by the PoC, trying candidates in this order: base (56.9 MiB, within the size limit), then small (181.3 MiB, needs the limit raised), then Moonshine base Arabic through sherpa-onnx. The device's built-in recogniser is not used.

On the web, the planning baseline is that voice does not ship in R1 (FR-033 criteria 3 and 4). The PoC makes one time-boxed attempt to run the adopted model in the browser through WebAssembly before that is final.

The pass and fail criteria, the outcomes and what each changes are in `docs/03-architecture.md`, section "Voice proof of concept", and are part of this decision.

## Alternatives considered
| Option | For | Against |
|---|---|---|
| **whisper.cpp + quantised Whisper (chosen, provisional)** | The only family found with several permissively licensed Egyptian fine-tunes, including one trained for Arabic mixed with English; one model serves both languages; the smallest file for a given model size; tiny native library; same engine can be tried in the browser; works on API 26; fully offline | No prebuilt Android package from the project: built from source with the NDK in CI; accuracy on Egyptian dialect unmeasured; the small model exceeds the 150 MB limit; a 30-second window model, slow on old phones; invents text on silence unless gated |
| sherpa-onnx + Moonshine base Arabic | Prebuilt Android library; a model designed for phones and likely faster; fits the size limit | Licence is not a standard open licence and must be accepted by the product owner; Arabic-only model, so a second model for English and a larger total; dialect accuracy undocumented; engine library adds about 20 MiB to the APK for two ABIs |
| sherpa-onnx + Whisper | Prebuilt library | Same models at two to three times the download size |
| Android built-in on-device recogniser | No download; no engine to maintain; possibly high quality where available | Not available on Android 8 to 11; no confirmed Arabic on-device pack; cannot be shipped with test evidence because it differs per device; absent without Google services; below Android 12 cannot guarantee audio stays on the device, which the product owner ruled out |
| Fine-tune our own small model on Egyptian data | Could fit the size limit with better accuracy | Needs training data with a usable licence (the Egyptian corpora found are non-commercial or unlicensed), GPU time and expertise; not a first step. Remains an option after the PoC through change control |
| Cloud speech service | Best accuracy today | Excluded by the product owner (vision Q-06, Q-11) |
| Web: built-in `SpeechRecognition` with `processLocally` | No download | Arabic is not in Chrome's on-device list; other browsers offer no on-device guarantee |
| Web: same model through WebAssembly | Same accuracy as Android by construction | Large download inside the browser; much slower than native and impractical in phone browsers; needs cross-origin isolation and a looser Content-Security-Policy; a second integration to test on four engines. Tried once, time-boxed, in the PoC |

## Consequences
- The plugin's interface to the web layer (`getAvailability`, `downloadModel`, `start`, `stop`, `cancel`) does not depend on the engine, so changing engine or model after the PoC touches the plugin only.
- The model is data, versioned in a manifest with its size and SHA-256; the app carries the expected checksum. Changing the model is a release, not a code change.
- A device capability check decides whether voice is offered; devices below it get manual entry with an explanation (FR-031 criterion 3). Supporting Android 8.0 for the app does not mean voice runs acceptably on Android 8-era hardware; this is measured in the PoC (P9).
- CI must build native code with the Android NDK; the NDK version is pinned.
- Likely change requests, raised only when the PoC shows they are needed: lifting the 150 MB limit of NFR-027 to 250 MB; lowering NFR-001 to NFR-003 to measured values.
- Still needed from the product owner: a floor below which Arabic voice should not ship (OQ-08) and whether the web pass criterion stands (OQ-10), both before the PoC result is assessed; the reference phone and accounts for test audio (prerequisites P-09, P-10); real speakers before release (OQ-03).
- To watch: PoC numbers come from synthetic audio and are an upper estimate; community fine-tunes have undocumented training data (recorded per candidate in the PoC).

## Sources (all read on 2026-11-16)
- https://api.github.com/repos/ggml-org/whisper.cpp/releases/latest ; https://github.com/ggml-org/whisper.cpp
- https://huggingface.co/api/models/ggerganov/whisper.cpp/tree/main
- https://api.github.com/repos/k2-fsa/sherpa-onnx/releases/tags/v2.0.1 and `/tags/asr-models`
- https://raw.githubusercontent.com/moonshine-ai/moonshine/main/LICENSE ; https://huggingface.co/moonshine-ai/moonshine-tiny-ar
- Hugging Face API for each model named above
- https://developer.android.com/reference/android/speech/SpeechRecognizer
- https://github.com/WebAudio/web-speech-api/blob/main/explainers/on-device-speech-recognition.md ; https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/processLocally
