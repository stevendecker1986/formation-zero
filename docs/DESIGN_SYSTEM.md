# Formation Zero design system — Amendment 001

## Authority and logo

The [current board](../assets/brand/formation-zero-board.png) is the sole visual reference. [Asset handling](../assets/brand/README.md) records original filename, hash and approved-vector replacement contract. Canonical structure: angular outer formation, central ZERO, vertical centerline, red objective marker, FORMATION ZERO wordmark and optional READINESS STARTS HERE. tagline. ZERO means baseline; centerline direction/alignment/progression; red marker objective/focus/destination; outer formation collective capability/alignment/readiness. Starting point → directed development → capability → readiness.

Do not redesign it or substitute an FZ monogram, chevron, mountain, shield, skull, Spartan helmet, crosshair, weapon, military crest, EGA/USMC mark, rank or unit insignia. Text identification in current shells is a fallback, not replacement master artwork. Older visual experiments and the former blue/green placeholder theme have been superseded.

## Tokens and implementation

`packages/ui/src/tokens.ts` is the single semantic value source shared by web, admin and mobile. **All numeric/color/type choices are provisional implementation values**, globally replaceable after formal approval; AI-rendered hex labels are not official production values. `theme.ts` translates values to CSS custom properties; `theme.css` contains web semantics/layout. Native styles consume the same values directly without importing web components. No third-party font or image dependency is added.

| Group                 | Foundation                                                                                                                                                                                                                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Colors                | Obsidian background #0c0d0e; charcoal #1b1d1f; field gray #292c2f; bone text #f3efe7; secondary/muted grays; crimson action #bc2438 with hover/active; brighter accessible brand text; neutral borders; focus/sand; separate success/warning/danger/info.                          |
| Typography            | Heading/body/data families; small/body/title/hero sizes, line heights and tracking. Web heading fallback: locally installed Impact / Arial Narrow / system sans; body system sans; data system monospace with tabular numerals. Native uses device system typography with scaling. |
| Spacing/layout        | Shared spacing scale; reading/content/form widths; 48-unit interactive target.                                                                                                                                                                                                     |
| Radii/borders/shadows | Small and medium radii; thin borders and visible focus width; none/subtle elevation shadow. Current shells avoid decorative shadows.                                                                                                                                               |
| Motion                | Fast/standard/reduced duration tokens; no decorative motion; explicit web reduced-motion override.                                                                                                                                                                                 |
| Breakpoints           | Compact 480, medium 768, wide 1120 available centrally; current shells use intrinsic wrapping and bounded fluid widths instead of duplicated media-query thresholds.                                                                                                               |
| Z-index/icons         | Base/navigation/overlay layers and small/medium/large icon sizes. No speculative icon library or modal system.                                                                                                                                                                     |

The board names Bebas Neue, Inter and Space Grotesk. These are intended candidates only; they have not been downloaded, bundled or claimed license-approved. Current fallbacks reference fonts already supplied by the user's operating system and redistribute no font binaries. Verify commercial licensing and retain notices before introducing any production font. Final font/mark/palette approval remains an asset decision, not a Phase B implementation.

## Visual rules

Disciplined, capable, precise, rugged, modern, premium, athletic, functional and confident. Use aligned grids, generous spacing, readable hierarchy, restrained surfaces, large primary actions and predictable navigation. Avoid gaming/combat, generic dashboard overload, glassmorphism, excessive shadows/gradients, neon/cyan/purple, camouflage, fake classified labels, weapons, skulls, stencil excess or official insignia. Military influence is discipline, durability, leadership, hierarchy and field usability, not military cosplay.

Red is restrained: primary actions, selected/active states, objective and progress emphasis, semantic warnings only where appropriate. Never use it as a whole-screen wash. Status must include words/symbols and never depend on color alone. Identical design quality across BASE/PERFORMANCE/COMMAND; tiers unlock functionality, not design.

Current primitives are Shell, BrandName, Surface, Badge and semantic CSS for headings, text, native buttons/inputs/selects, status, focus, actions and forms. Existing native controls preserve keyboard and screen-reader behavior. No speculative component catalog or navigation to unimplemented features.

## Imagery

Real people, real effort, real training, real progress. Future rights-cleared imagery must represent men and women, different adult fitness levels, civilians, gym/outdoor work, strength/muscle development, running, rucking, hybrid/function/mobility/recovery, individual/partner/group training and coaching. First responders, tactical and military training may appear contextually but must not dominate. Avoid combat as core branding. No photography is added to current product shells; the board is reference-only, not a media-rights grant.

## Future surfaces — principles only

Home: what should I do today? Train: what am I training? Recover: what does recovery need? Progress: am I improving? Library: what information do I need? COMMAND: what does this group need? Live PT: what is happening now? Admin: what needs review/action?

COMMAND should foreground objective, people, time, equipment, space, scaling, execution and AAR; it may be denser, but is a serious coach/leader instrument, not military-only software or HR software. Live PT later requires very large text/timers, high contrast, few controls, fast interaction and outdoor readability. Admin shares the identity while prioritizing long-form readability, source/content review, accuracy and auditability; lighter working surfaces may be added when actual editing needs justify them. None of these future features are implemented.

## Accessibility foundation

Computed text contrast must meet 4.5:1 for body text, including muted text and all action states; borders/focus against applicable surfaces target 3:1. Automated contrast regression covers semantic pairs. Forms retain explicit wrapping labels, autocomplete, native controls, keyboard access and live status. Skip link targets the main landmark; focus is visible. Buttons/inputs/selects are at least 48 CSS pixels tall. Responsive wrapping avoids fixed-height text containers; browser zoom/reflow and native text scaling remain supported. Native scroll container and header semantics support VoiceOver/TalkBack; device assistive-technology certification is not claimed. No video is present; future media requires captions. No nonessential animation is introduced; respect reduced motion. Outdoor usability needs device testing for future field instruments, not fabricated present certification.
