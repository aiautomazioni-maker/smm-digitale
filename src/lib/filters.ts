export const MAGIC_FILTERS = [
    { name: "Normal", filter: "none" },
    { name: "Vintage", filter: "sepia(0.5) contrast(1.2) brightness(0.9)" },
    { name: "Cyber", filter: "hue-rotate(180deg) contrast(1.5) saturate(2)" },
    { name: "Golden", filter: "sepia(0.3) saturate(1.5) contrast(1.1)" },
    { name: "B&W Drama", filter: "grayscale(1) contrast(1.5) brightness(0.8)" },
];

// Helper to apply filter to canvas (if we were doing real image processing)
// For now we just use CSS filter on the image display.
