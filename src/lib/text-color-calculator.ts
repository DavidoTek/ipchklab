const hexColorRegex = /^#?([a-f0-9]{6}|[a-f0-9]{3})$/;

/**
 * Calculate the ideal text color based on the background color.
 * See https://stackoverflow.com/a/11868159 (CC BY-SA 4.0)
 * @param {string} backgroundColor The background color
 * @returns {string} The ideal text color (either "#000000" or "#ffffff")
 */
export function getIdealTextColor(backgroundColor: string): string {
  if (!hexColorRegex.test(backgroundColor)) {
    return "#000000";
  }

  let red: number, green: number, blue: number;
  if (backgroundColor.length === 7) {
    red = parseInt(backgroundColor.slice(1, 3), 16);
    green = parseInt(backgroundColor.slice(3, 5), 16);
    blue = parseInt(backgroundColor.slice(5, 7), 16);
  } else {
    red = parseInt(backgroundColor[1], 16) * 17;
    green = parseInt(backgroundColor[2], 16) * 17;
    blue = parseInt(backgroundColor[3], 16) * 17;
  }

  // http://www.w3.org/TR/AERT#color-contrast
  const brightness = Math.round((red * 299 + green * 587 + blue * 114) / 1000);
  const textColour = brightness > 125 ? "#000000" : "#ffffff";

  return textColour;
}
