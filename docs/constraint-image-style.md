# Pocket Architect — Constraint Image Style

## Purpose

Create one small square image for every constraint value in Pocket Architect. Each image is a visual cue that helps a person understand the brief immediately.

The images are not finished architectural drawings, renders, illustrations, or mood boards. They are deliberately incomplete visual notes: a few black marks that identify the concept and leave the actual drawing to the user.

## Core visual language

- **Canvas:** 1:1 square, preferably 1024 × 1024 px.
- **Color:** pure black and white only. No grayscale, color, beige paper, blueprints, or colored accents.
- **Background:** plain white or transparent-looking white.
- **Marks:** solid black ink, with at most two line weights: one primary contour and one lighter detail weight.
- **Composition:** one centered subject or relationship, with generous empty space around it.
- **Style:** simple hand-drawn architectural sketch; human and slightly imperfect, controlled enough to remain legible at thumbnail size.
- **Detail level:** low. Use the minimum number of marks needed to identify the value.
- **Texture:** almost none. A slight dry-ink irregularity is acceptable; avoid paper grain, hatching, watercolor, shading, and ornamental texture.
- **Perspective:** use a clear, simple architectural view. A modest three-quarter view is welcome for building values when it improves recognition. Do not add cinematic camera effects or realistic lighting.
- **Edges:** leave the image unframed. Do not add labels, captions, arrows, dimensions, logos, borders, registration marks, or UI elements.

## What every image should communicate

The viewer should be able to answer one question in under two seconds:

> What is the single architectural idea represented here?

The image should communicate the constraint value, not prescribe the user's final composition. Show a recognizable symbol, mass, or spatial relationship; do not solve the drawing exercise.

## Category rules

### Building values

Represent the building as a simplified hand-drawn object sketch, silhouette, or modest three-quarter view. Keep only the defining features:

- Garden shed → small pitched roof and simple door.
- Bus stop shelter → thin supports and a single canopy.
- Treehouse → compact room perched in a tree.
- Library → calm stacked volume with a quiet entrance.
- Cathedral → tall vertical nave or pointed roof silhouette.
- Grain silo complex → a small cluster of cylindrical vessels.

Avoid rooms, furniture, facade ornament, realistic materials, repeated windows, people, cars, and landscape detail. One or two tiny functional details, such as a door handle, are acceptable when they make the concept feel more human. The building should occupy roughly 45–65% of the square.

### Placement values

Represent only the site condition that defines the placement. Do not draw a recognizable building, facade, roof, door, or building type; the building constraint already supplies that information. Use a neutral marker only when needed to clarify a relationship: a small abstract rectangle, line, platform, or cut edge. The environment carries the meaning:

- Flat open field → one block resting on a straight ground line.
- Wooded clearing → one block surrounded by three or four tree trunks.
- Corner lot → two intersecting ground or street edges.
- Riverbank → one block beside a single irregular water edge.
- Steep cliffside → one block cantilevered over a strong diagonal drop.
- Floating on water → one block separated from the water surface with a clear reflection line.

Use only a few environmental marks. Do not turn the image into a landscape illustration. Placement images should function as composable site diagrams: answer “where does it go?” without answering “what is it?”

### Perspective values

Represent the drawing method as a minimal architectural diagram, not as a finished building scene. A generic block or wireframe is enough:

- Elevation → flat front face with no depth lines.
- Plan (top-down) → simple footprint seen from above.
- One-point perspective → receding edges converging toward one point.
- Two-point perspective → receding edges converging toward two points.
- Section (cut-through) → a sliced block showing one floor line.
- Axonometric → parallel receding edges, no vanishing points.
- Isometric → compact block with equal-looking diagonal axes.
- Three-point perspective → verticals also converge toward a third point.
- Worm's-eye view → underside of a block, viewed sharply upward.
- Bird's-eye / aerial → roof and footprint, viewed sharply downward.
- Exploded axon → two or three separated layers aligned vertically.
- Sectional perspective → cutaway block with a visible interior volume.

For perspective images, clarity of the construction system matters more than building identity. Keep the block generic and the geometry clean.

## Negative prompt

Do not generate: photorealism, architectural visualization, finished concept art, detailed floor plans, construction documents, realistic materials, color, grayscale shading, gradients, shadows, atmospheric perspective, people, furniture, cars, plants beyond the few marks required, text, labels, arrows, dimensions, logos, frames, borders, collage layouts, multiple alternative views, or a fully designed final building.

## Reusable prompt template

```text
Create a square 1:1 black-and-white visual cue for an architectural drawing prompt.
Concept: [CONSTRAINT VALUE].
Category: [BUILDING, PLACEMENT, or PERSPECTIVE].
Show only the simplest recognizable representation of this concept: [ONE-SENTENCE VISUAL IDEA].
Use a centered composition, plain white background, solid black architectural ink lines,
minimal detail, generous negative space, no frame, no text, no labels, no arrows,
no dimensions, no color, no grayscale shading, no realism, and no finished architectural drawing.
The result should read like a small, hand-drawn architectural sketch that is legible at
thumbnail size and leaves the final drawing open to the user. A restrained three-quarter
view is allowed; keep the object simple and unrendered.
``` 

## Example prompt to test

```text
Create a square 1:1 black-and-white visual cue for an architectural drawing prompt.
Concept: Garden shed.
Category: BUILDING.
Show a tiny simple shed as a single compact block in a restrained three-quarter view,
with one clear pitched roof and one plain door. Use only a few confident black
architectural ink lines, centered on a plain white background with generous empty space.
The image should feel like a simple hand-drawn architectural sketch: recognizable in two
seconds, human and slightly imperfect, but highly legible at thumbnail size.

Do not create a finished architectural drawing or a realistic shed. No color, no gray,
no shading, no texture, no landscaping, no trees, no furniture, no people, no extra
windows, no facade detail, no text, no labels, no arrows, no dimensions, no border, and
no frame. Leave the design intentionally incomplete so it suggests the concept without
determining the user's final sketch.
```

## Consistency checklist

Before accepting an image, verify:

- It is square and still readable when reduced to a small thumbnail.
- It uses only black marks on white.
- The intended value is identifiable without text.
- There is one dominant concept, not a collection of details.
- It leaves generous negative space.
- It does not look like a final architectural drawing.
- It uses the same visual grammar as the other category images.
