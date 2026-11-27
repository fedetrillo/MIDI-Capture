# Changelog

## 1.0.1 — 2026-11-26

- **Fixed on Windows:** LUNA on Windows sizes the page to the window's outer size, title bar and frame included, so the bottom 39 px and the right 16 px were hidden. The page now leaves that space out on Windows, so everything at the bottom and right edges shows in full.
  the part you can see, so the controls at the bottom were hidden. The page now fits itself to
  the window size LUNA reports; nothing changes where the two match.
- **Report copy:** Alt-click on the version now always says in the status bar that the report was copied. Where the system clipboard is blocked (seen on some Windows set-ups) it uses a fallback, and if that fails too it shows the report selected so you can copy it by hand.

## 1.0.0 — 2026-11-25

- First release: keeps what you play on your MIDI keyboard as takes while the window is open,
  with LUNA playing or stopped, for the last 15 minutes.
- A new take after 5, 10, 20 or 30 seconds of silence, or when the transport starts or stops.
- Takes played with LUNA rolling go back to the bars they were played over; free takes go to the
  cursor with their timing.
- Capture the last one (button or C key), or any take from the list; listen first through the
  track's instrument; armed, selected or new track; one undo step.
- Sustain pedal folded into note lengths (optional); input device and channel filters.
- Input list with a live light per MIDI device and what it is sending, to pick the right one at a glance.
- A short guide the first time it opens, in the language you choose first, and again from the Guide button.
- Drop with a click: drag a take out of the window, then click in the arrangement where it goes.
- Dark and grey themes, seven colours, 7 languages, Alt-click the version for a support report.
