export const createImageMarker = (src: string, alt: string): HTMLElement => {
  const img = document.createElement("img");
  img.src = src;
  img.alt = alt;
  img.style.width = "24px";
  img.style.height = "24px";
  img.style.transform = "translate(0, 50%)"; // Center bottom point
  return img;
};
