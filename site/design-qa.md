# Expanded project cards — design QA

final result: passed

## Visual truth and scope

- Anatomy reference: `C:/Users/lark-k/AppData/Local/Temp/codex-clipboard-fa764877-f29a-4a9c-a7ca-0769826ccb8b.png`, 1452 × 850 pixels.
- Existing art direction: `C:/Users/lark-k/AppData/Local/Temp/codex-clipboard-31c937a4-9acb-49cb-b349-89cf4ee43802.png`, 1973 × 1154 pixels.
- Implemented state: `http://localhost:5173/#works`, folder expanded, reveal completed.
- This is an adaptation of the reference's image/title/introduction anatomy to the user's four actual projects, rather than a pixel clone of its three design categories. The existing folder and clay palette are retained.
- The reference image and final implementation screenshot were opened together in one comparison call. Comparison uses card anatomy and visual hierarchy; the two source screenshots depict different subjects and compositions, so no pixel-perfect overlay claim is made.

## Browser evidence

- Desktop: `qa/projects-desktop-final.jpg`, 1440 × 900 pixels and CSS viewport, approximately 1× density. All four cards, original folder and collapse button fit, with zero overlay scroll overflow.
- Tablet: `qa/projects-tablet-final.jpg`, 601 × 800 pixels and CSS viewport, approximately 1× density. Two columns, balanced title wrapping, equal heights per row and vertical scrolling.
- Mobile: `qa/projects-mobile-top.jpg` and `qa/projects-mobile-bottom.jpg`, 390 × 844 pixels and CSS viewport, approximately 1× density. Single column; the final energy card, its project link and the folder are reachable without horizontal overflow.
- Focused desktop evidence: `qa/project-card-detail.jpg`, browser-captured first-card region for typography, image crop and link inspection.
- No density rescaling was needed for final captures. An early 1973 × 1154 viewport override returned a clipped 1831 × 1154 capture; that artifact is not used to assert fidelity or diagnose page overflow.

## Findings and fixes

1. [P2, resolved] The first tablet title originally wrapped with a single final character on its last line. Added balanced wrapping to the title label; the final tablet capture shows two complete phrases.
2. [P2, resolved] Different title heights left card bases and links uneven. Cards now stretch within each grid row, with flexible copy regions and bottom-aligned technology/link areas.
3. [P2, resolved] At 1440 × 900 the first desktop composition required slight vertical scrolling and put the collapse control over the folder. Reduced the folder to 31% of the stage width and adjusted spacing; final DOM measurement reports zero vertical overflow and the final capture separates the control from the artwork.

No remaining actionable P0/P1/P2 findings.

## Required fidelity surfaces

- **Typography:** Existing DM Sans / Microsoft YaHei stack retained. Cream bold raised title labels, readable dark Chinese descriptions, smaller category and technology text. Desktop descriptions scale from 12–15px; tablet/mobile use 14px. No copy is clipped or line-clamped. Title and paragraph wrapping checked in all final sizes.
- **Spacing/layout:** Cream rounded postcard anatomy, colored label crossing the illustration/copy boundary, light tilt on desktop and upright cards on small screens. Four desktop columns, two tablet columns, one mobile column. The original folder occupies about one third of the desktop stage width. Cards and links remain separated from the folder and collapse control.
- **Colors/tokens:** Warm cream text areas, espresso/olive/blue/terracotta project accents, cream label text and dark body text match the supplied art direction. Existing blurred full-scene backdrop retained.
- **Image quality:** Four separate built-in imagegen illustrations, each 1536 × 1024, exported to WebP at quality 92. Subjects match the original four projects; no rasterized project copy, placeholders or code-drawn replacement illustrations. All four browser images decoded successfully. Original PNGs and full prompts are saved under `../assets/works/projects/`.
- **Copy/content:** Introductions and technology labels checked against the four public GitHub READMEs. Energy copy distinguishes solar numerical power separation from energy-station and charger state identification. Project links point to the exact corresponding `lark-k` repositories.

## Interaction and implementation checks

- Folder opens with sequential card reveal. Clicking a card, the close button or Escape collapses it; the trigger regains keyboard focus after closing.
- Tab and Shift+Tab cycle between project links and the collapse control while background content is inert.
- Clicking a project link leaves the spread open. All four anchors have verified repository URLs, `target="_blank"` and `rel="noopener noreferrer"`. The in-app browser did not expose a separate popup tab during the link click, so external browser popup handling is not claimed as verified.
- Mobile wheel scrolling was observed changing the overlay scroll position; keyboard traversal also brings the fourth link into view. Small-screen scroll padding leaves the last card and folder accessible above the fixed collapse control.
- Existing reduced-motion media query disables all spread animation.
- In-app browser console warning/error inspection returned no entries.
- `npm run build` passed after the final source and asset changes. Existing 5 interaction tests passed. Build retains the existing Three.js chunk-size advisory.

## Follow-up polish

- None required for the requested scope. Independent project detail pages remain deferred; the new entries link directly to GitHub.
