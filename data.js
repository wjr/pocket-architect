// data.js — content only. No logic lives here.
const DATA = {
  building: [
    { label: 'Garden shed', difficulty: 'easy', tip: 'One simple gable — get the door and roof pitch right before anything else.' },
    { label: 'Bus stop shelter', difficulty: 'easy', tip: 'A roof on slim supports. Practice clean, parallel lines.' },
    { label: 'Treehouse', difficulty: 'easy', tip: 'Let the structure hug the trunk; show how it bears on the branches.' },
    { label: 'Row house (terrace)', difficulty: 'easy', tip: 'Repeat one bay; repetition reads as a street.' },
    { label: 'Beach hut', difficulty: 'easy', tip: 'Small footprint — proportion and a single accent color carry it.' },
    { label: 'Library', difficulty: 'medium', tip: 'Stack reading rooms for tall, quiet volume; mark the entry clearly.' },
    { label: 'Art museum', difficulty: 'medium', tip: 'Contrast daylit galleries with a calm, processional lobby.' },
    { label: 'Hillside cabin', difficulty: 'medium', tip: 'Let the slope do the work — step the floors down the hill.' },
    { label: 'Greenhouse', difficulty: 'medium', tip: 'Light structure, lots of glazing; show the frame, not walls.' },
    { label: 'Lakeside villa', difficulty: 'medium', tip: 'Open the long side to the water; push service spaces to the back.' },
    { label: 'Observatory', difficulty: 'medium', tip: 'A heavy base, a light dome — the contrast is the drawing.' },
    { label: 'Train station', difficulty: 'medium', tip: 'A long clear span overhead; lead the eye down the platform.' },
    { label: 'Cathedral', difficulty: 'hard', tip: 'Push verticality — tall nave, pointed arches; let columns carry the eye up.' },
    { label: 'Skyscraper', difficulty: 'hard', tip: 'Establish a clear structural grid and a readable top and base.' },
    { label: 'Opera house', difficulty: 'hard', tip: 'A grand public foyer wrapping a sealed auditorium mass.' },
    { label: 'Grain silo complex', difficulty: 'hard', tip: 'Cluster cylinders; let silhouette and spacing do the talking.' }
  ],

  placement: [
    { label: 'Flat open field', difficulty: 'easy', tip: 'Nothing competes — the building alone defines the horizon.' },
    { label: 'Suburban cul-de-sac', difficulty: 'easy', tip: 'Setbacks, driveways, and neighbors frame the lot.' },
    { label: 'Wooded clearing', difficulty: 'easy', tip: 'Trees as verticals around the building; dappled ground.' },
    { label: 'Quiet residential street', difficulty: 'easy', tip: 'A row of context buildings sets the scale.' },
    { label: 'Corner lot', difficulty: 'easy', tip: 'Two public edges — decide which face leads.' },
    { label: 'Dense urban alley', difficulty: 'medium', tip: 'Tight walls, deep shadows, very little sky.' },
    { label: 'Rooftop garden', difficulty: 'medium', tip: 'The roof is the site; show parapets and the city beyond.' },
    { label: 'Riverbank', difficulty: 'medium', tip: 'One edge is water — reflect it and soften the bank.' },
    { label: 'Desert plain', difficulty: 'medium', tip: 'Flat, glaring ground; shade and mass matter more than detail.' },
    { label: 'Reclaimed marsh', difficulty: 'medium', tip: 'Raise the building on piers; show water and reeds below.' },
    { label: 'Town square', difficulty: 'medium', tip: 'A framed void — the surrounding facades define the space.' },
    { label: 'Bridge over a road', difficulty: 'medium', tip: 'Span and structure above, traffic movement below.' },
    { label: 'Steep cliffside', difficulty: 'hard', tip: 'Show the dramatic drop; cantilever out over the edge.' },
    { label: 'Floating on water', difficulty: 'hard', tip: 'No ground line — reflections and waterline do everything.' },
    { label: 'Cut into a hillside', difficulty: 'hard', tip: 'Partly buried; show the retaining wall and the excavated face.' },
    { label: 'Dense city intersection', difficulty: 'hard', tip: 'Four corners of tall context; manage overlapping facades.' }
  ],

  perspective: [
    { label: 'Elevation', difficulty: 'easy', tip: 'Straight-on, flat facade. No depth — focus on proportion and symmetry.' },
    { label: 'Plan (top-down)', difficulty: 'easy', tip: "Bird's-eye footprint. Show circulation and room relationships, not height." },
    { label: 'One-point perspective', difficulty: 'easy', tip: 'One vanishing point on the horizon; depth lines converge there, horizontals and verticals stay parallel.' },
    { label: 'Two-point perspective', difficulty: 'medium', tip: 'Two vanishing points on the horizon line. Keep all verticals truly vertical.' },
    { label: 'Section (cut-through)', difficulty: 'medium', tip: 'Slice the building vertically. Draw floor plates and the volume between them.' },
    { label: 'Axonometric', difficulty: 'medium', tip: 'No vanishing points — parallel lines stay parallel. Rotate the plan and project upward at a fixed angle.' },
    { label: 'Isometric', difficulty: 'medium', tip: 'A special axon: all three axes at equal angles. Clean, diagrammatic massing.' },
    { label: 'Three-point perspective', difficulty: 'hard', tip: 'Add a third vanishing point above or below so even verticals converge — use it for looming or top-down drama.' },
    { label: "Worm's-eye view", difficulty: 'hard', tip: 'Looking steeply up. Exaggerate undersides and foreshorten height to make it loom.' },
    { label: "Bird's-eye / aerial", difficulty: 'hard', tip: 'Looking steeply down. Reveal roof forms and how the building meets the ground.' },
    { label: 'Exploded axon', difficulty: 'hard', tip: 'Pull the layers apart vertically — floors, roof, context — to show how it assembles.' },
    { label: 'Sectional perspective', difficulty: 'hard', tip: 'Cut open in section, then draw the interior in perspective — structure plus spatial depth.' }
  ]
};

if (typeof window !== 'undefined') window.DATA = DATA;
if (typeof module !== 'undefined' && module.exports) module.exports = { DATA };
