export function getReadableTextColor(backgroundColor?: string | null) {
  const hex = normalizeHex(backgroundColor);
  if (!hex) return "#ffffff";
  const red = parseInt(hex.slice(0, 2), 16) / 255;
  const green = parseInt(hex.slice(2, 4), 16) / 255;
  const blue = parseInt(hex.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * toLinear(red) + 0.7152 * toLinear(green) + 0.0722 * toLinear(blue);
  return luminance > 0.52 ? "#0a1530" : "#ffffff";
}

function normalizeHex(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(trimmed)) {
    return trimmed.split("").map((char) => char + char).join("");
  }
  if (/^[0-9a-f]{6}$/i.test(trimmed)) return trimmed;
  return null;
}

function toLinear(value: number) {
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}
