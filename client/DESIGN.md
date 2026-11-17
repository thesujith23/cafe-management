# Little Window Café — The service line

## Brief

- **Subject:** Little Window Café, a neighbourhood café with table-side QR ordering, reservations, a live kitchen and pickup counter, and staff tools.
- **Audience:** Guests deciding whether to visit, guests placing and tracking an order, and staff managing service.
- **Job:** Make the café inviting, make booking and ordering obvious, and keep operational states easy to read.
- **Stack:** Keep Vite + React and the current router. This preserves the working booking, cart, payment, live order, and 3D café flows.
- **Assumptions:** “Little Window Café” is the project’s current display name. Do not invent location, opening hours, customer metrics, awards, or menu facts. Use existing food photography and live backend data.

## Concept card

**Idea:** The site follows one plate from a guest’s table, through the kitchen and pickup pass, and back to the table.

**Metaphor:** A café service path, drawn as a quiet line that becomes a route through the guest journey and a clear progress cue in live order status.

**Signature:** Select one of four moments in a meal and watch the scene, status, and copy move to that point in the service path. The cafe page keeps its working 3D room as the live destination.

**Emotion:** Calm, appetite, and confidence. The first screen should feel like a considered place, with an unmistakable way to book or enter.

**Motion verb:** Settle and pass. Large scenes drift slowly with scroll; plates and labels slide along short distances; status signals arrive with a crisp, quiet reveal.

**Screenshot:** A generously composed food image paired with a short headline, a simple booking action, and a thin service path.

### Concepts considered

| Concept | Anchor and signature | Originality | Fit | Feasibility | Portability |
|---|---|---:|---:|---:|---:|
| The plate’s path | The live ordering lifecycle. One selected step traces a plate through table, kitchen, pass, and table. | 4 | 5 | 4 | 2 |
| A window through the day | The café’s name. The page opens and reframes scenes through a changing window. | 3 | 4 | 3 | 4 |
| The garden table | The café’s outdoor seating and pond. Scroll moves from garden edge to table to kitchen. | 3 | 4 | 3 | 3 |

Choose **The plate’s path** because it connects the public site, ordering flow, and live order tracking to real cafe behavior instead of adding unrelated spectacle.

## Art direction

- **Ground:** `#F5F7F3`, chalk leaf paper.
- **Ink:** `#19251F`, roasted evergreen.
- **Muted:** `#66736A`, herb shadow, checked for readable contrast.
- **Line:** `#D8DFD6`, pale sage stone.
- **Accent:** `#6E853F`, olive leaf, used for the active service point and primary actions.
- **Curtain:** `#18231D`, deep kitchen green for overlays and transitions.
- **Type:** Manrope for display, body, and UI; Newsreader italic for the occasional food-led phrase; DM Mono only for table codes, prices, and order times. Sources: Google Fonts.
- **Grid:** Twelve columns on desktop, four on mobile, fluid 24 to 64 px gutters. Main text aligns to columns 1 and 7; image compositions offset from that line. Sections alternate between split scene, asymmetric image, service path, and full-width booking close.
- **Shape:** Small 3 to 8 px radii for controls and surfaces. Avoid generic pill-shaped cards; reserve a larger radius for photography only.
- **Motion:** 220 ms for control feedback, 500 to 800 ms for scene changes, one ease family. Translate and clip images, never animate layout. Reduce motion removes parallax and reveals while leaving all content visible.

## Composition plan

```text
HOME
[brand + 3 links + book]
[short statement: 5 cols] [food composition: 7 cols]
[meal path: labels and controls] [sticky image with changing state]
[reserve invitation across width]
[compact footer]

CUSTOMER ORDER
[brand + table identity + cart]
[menu title] [food detail, offset]
[search + category rail]
[asymmetric dish list with real food crops]
[fixed compact cart action]

ORDER STATUS
[table/order identity]
[single progress path with live status]
[items and pickup instructions]

CAFE
[minimal cafe chrome] [existing 3D room as the central scene]
[contextual action appears in place]

STAFF
[compact navigation]
[operational heading + live state]
[unequal information panels, clear queues]
```

## Implementation notes

- Preserve existing routes, API calls, QR handling, reservation behavior, payment behavior, socket updates, and kitchen state transitions.
- Reuse the existing cafe-food montage as a crop source. Keep live order numbers and availability sourced from the app.
- The page remains quiet at rest. Pointer and scroll movement affect only the hero image layers and the service-path illustration. Respect `prefers-reduced-motion`.
- Build and inspect production output before delivery. The available local environment may not have the Awwwards skill’s screenshot harness; report the actual verification used.
