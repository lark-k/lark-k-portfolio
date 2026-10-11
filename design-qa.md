# Possibility ending and scroll transition — design QA

final result: passed

## Current target

Use the supplied ending screenshot (`codex-clipboard-f4af3d24-f56d-4e0e-a167-af05d972ef1f.png`) for the cream Anton title, section label, lower-left manifesto and lower-right return button. Use the supplied falling video and generated character artwork for the scene. Preserve the existing Lark-K brand and original pages.

Latest interaction direction: only vertical wheel travel from project previews to the ending scrubs the video. Content enters during playback with delayed, progress-linked phases and finishes with the video. Direct refresh must use the sharper original artwork.

## Resolved findings

- P1: A threshold-triggered complete video did not follow the wheel. Replaced this route with accumulated wheel distance and serialized, coalesced native video seeks. A faster gesture advances farther; no new input settles at the current target.
- P1: Waiting until the video finished delayed all ending copy. Copy now follows decoded video progress: label 10–30%, title 25–55%, manifesto 50–80%, supporting copy 65–90%, button 80–100%. There is no replay of the entrance after completion. Upward scrubbing reverses these phases and reaching zero restores the gallery.
- P2: Enlarging the 1280 × 720 video extraction softened the refresh background. Refresh, direct navigation and reduced-motion fallback now use the original 1672 × 941 artwork. Browser inspection confirms its natural dimensions, filter none, opacity 1, and the hidden video layer at opacity 0 after refresh.
- P2: The initial title sat lower than the reference. Aligned the heading to 13.2% from the top and tightened label spacing; it clears the character's face.
- P2: Compact mobile dimensions needed different wrapping. The title wraps to two lines, navigation uses a second row, and the footer stacks. The 390 × 844 view has no horizontal overflow; earlier 320 × 568 verification also passed.

No outstanding actionable P0/P1/P2 findings in the requested scope.

## Visual evidence

Images are under `output/possibility/qa/`:

- `comparison-latest.jpg`: reference and final refreshed page normalized to the same 1280 × 690 viewport and inspected together. Matches hierarchy, centered cream title, olive palette, footer arrangement and overall density.
- `scroll-progress.jpg`: paused video at approximately 88.6%; heading and manifesto fully visible, button opacity approximately 0.428. The same timestamp and opacity remained stable on a subsequent read without input.
- `scroll-complete.jpg`: native final frame, full content opacity and enabled return control; progress HUD removed.
- `refresh-sharp.jpg`: final desktop refresh using the high-resolution source.
- `mobile-sharp.jpg`: 390 × 844 responsive refresh, legible navigation, title and footer, scrollWidth equals viewport width.

Intentional adaptations: Lark-K branding and local identity replace the reference brand; the character and floating tools use the user's production assets. Source screenshot playback control, cursor and social captions are omitted. Native playback retains the actual video frame; direct refresh uses the sharper original artwork, whose pose differs slightly from the generated video's final frame. The video starts with a centered seated character while the preview backdrop has the character on the right; a brief 0.4-second full-frame blend eases that source mismatch without stretching or patching the scene.

## Functional checks

- Actual in-app browser wheel input over the carousel advances the transition without changing horizontal carousel behavior.
- Small wheel movement settled at 1.233 seconds; a larger gesture advanced to 5.343 seconds. The video remains paused because progression comes from wheel seeks.
- Reversing a gesture moved backward; reversing to zero restored `#preview` and its seven-project gallery.
- Completion reached 6.028 seconds of the 6.033-second browser clip, content progress 1, both heading and button opacity 1, with no second entrance animation.
- The original works-folder-to-preview wheel navigation still advances normally without the ending progress HUD.
- Explicit ending button navigation uses native playback at rate 1 and does not enter scroll-linked mode.
- Browser error/warning log was empty after the verified refresh and scroll flows.
- The browser video uses short keyframe intervals for seeking, retaining 1280 × 720 at 60 fps. The supplied original remains archived intact.
- All 11 interaction/media tests and the production build pass. The existing Three.js chunk-size advisory remains.
- No deployment performed.

The previous works-folder QA report is preserved at `output/possibility/qa/previous-design-qa.md`.
