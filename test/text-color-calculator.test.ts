import { expect, describe, test } from "vitest";

import { getIdealTextColor } from "../src/lib/text-color-calculator";

describe("text-color-calculator", () => {
  test("test getIdealTextColor for different backgrounds", () => {
    expect(getIdealTextColor("#000000")).toBe("#ffffff");
    expect(getIdealTextColor("#ffffff")).toBe("#000000");
    expect(getIdealTextColor("#ff0000")).toBe("#ffffff");
    expect(getIdealTextColor("#707070")).toBe("#ffffff");
    expect(getIdealTextColor("#808080")).toBe("#000000");
  });

  test("test getIdealTextColor for three-letter hex colors", () => {
    expect(getIdealTextColor("#000")).toBe("#ffffff");
    expect(getIdealTextColor("#fff")).toBe("#000000");
  });

  test("test getIdealTextColor for invalid backgrounds", () => {
    expect(getIdealTextColor("")).toBe("#000000");
    expect(getIdealTextColor("ffffff")).toBe("#000000");
    expect(getIdealTextColor("#")).toBe("#000000");
    expect(getIdealTextColor("#beef")).toBe("#000000");
    expect(getIdealTextColor("#xyzabc")).toBe("#000000");
    expect(getIdealTextColor("invalid")).toBe("#000000");
    expect(getIdealTextColor("#invalid")).toBe("#000000");
  });
});
