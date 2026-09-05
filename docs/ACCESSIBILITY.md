# Accessibility

Phase F uses semantic headings, labels, status live regions, named controls, keyboard-reachable native elements, visible focus styles, 44-pixel-equivalent minimum targets, wrapping responsive layouts, text alternatives for missing media, and explicit timer/state text. Timer and status meaning never relies on color. The existing reduced-motion rule disables animation and transitions when requested. Mobile text uses platform scaling; fixed-height text containers are avoided.

Automated source tests verify labels, live status, timer naming, missing-media text, focus styling, reduced motion, and target tokens. Production builds and responsive web/mobile smoke checks validate that both surfaces render. Manual assistive-technology validation on target OS/browser combinations remains a release activity because static checks cannot prove screen-reader speech or platform focus behavior.
