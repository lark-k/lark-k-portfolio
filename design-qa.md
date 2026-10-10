# Works scene and stationary folder — design QA

final result: passed

## Current visual target

User references: `codex-clipboard-6d347725-a434-448e-b510-d96cefe09b93.png` (left-side folder), `codex-clipboard-131df144-c7df-4f03-8791-b47cd7eedf5b.png` (stationary folder), and `codex-clipboard-1f527dd1-be4c-499c-8e73-2ee0378fe47b.png` (remove scrollbars, clear the laptop). These references and the implementation were compared in the same image inspection calls. The final adaptation retains four actual projects and original character artwork.

## Resolved findings

- P1: The expanded spread previously filled the screen. It now occupies the left side, leaving the right-side character and laptop visible.
- P1: Opening moved and resized the folder. Both images now use shared viewport anchor coordinates and width. At 1600 × 900, closed and open image bounds are identical: x=203.5, y=558, width=297, height=222.75. The hover translation and arriving-folder transform are removed.
- P1: Card overflow caused horizontal and vertical scrollbars and clipped the illustrations. Removed scroll containers; a ResizeObserver fits the natural card row to available vertical space without changing image aspect ratio. All four cards remain fully visible.
- P2: The background was excessively blurred. Blur is now 4px with a 12% dark backdrop, preserving the underlying scene.
- P2: The transition ended in a centered composition. The new biography-to-works video is used; its exact last frame supplies the full-screen still with the character on the lower right. No separate character cutout or smeared background extension is used.

No outstanding actionable P0/P1/P2 findings for the requested scope.

## Browser evidence

Screenshots under `site/qa/`, captured in the in-app browser at approximately 1× pixel density:

- `works-collapsed-final.png`: desktop 1600 × 900, small folder on the left below the heading.
- `works-expanded-left-final.png`: desktop 1600 × 900, four cream project cards, stationary folder and visible laptop.
- `works-tablet-final.png`: 1024 × 768, four compact cards on the left, complete illustrations and project links.
- `works-mobile-final.png`: 390 × 844, two-by-two grid, all descriptions and links visible, folder below. Category labels and technology tags are omitted only at this narrow breakpoint to preserve legibility.

Desktop typography, wrapping, illustration crop, cream/brown/olive/blue/terracotta colors, card spacing and folder separation were inspected. Browser measurements confirm visible overflow on the card row rather than an internal scroll container; mobile dialog scrollWidth equals clientWidth (390px).

## Interaction and media checks

- Escape and the close control collapse the spread. Tab from the close control cycles to the first project link; underlying scene content is inert during the dialog.
- Original four project links and source images are preserved.
- The final biography chapter's wheel action starts `biography-to-works.mp4` and settles on the works scene. Homepage direct works navigation plays both forward clips in sequence and reaches the same final composition.
- The archived and served copies of the new video have matching SHA-256 hashes. It is copied without re-encoding.
- Seven interaction/media tests and the static production build pass. The existing Three.js bundle-size advisory remains.
- No deployment was performed.

This report supersedes older layout and temporary-transition notes in `site/design-qa.md`.
