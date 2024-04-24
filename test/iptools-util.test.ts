import { expect, describe, test } from "vitest";

import { generateEmptyHeaderWithPayload, parseByteString } from "../src/lib/iptools/iptools-util";
import { ByteFieldState, InvalidByteStringError } from "../src/lib/iptools/iptools.types";

function findIndicesOfByteFieldState(arr: ByteFieldState[], value: ByteFieldState): number[] {
  return arr.reduce((acc: number[], curr: ByteFieldState, index: number) => {
    if (curr === value) {
      acc.push(index);
    }
    return acc;
  }, []);
}

describe("iptools-util", () => {
  describe("generateEmptyHeaderWithPayload", () => {
    test("evalutate correct length of packet data", () => {
      expect(generateEmptyHeaderWithPayload("ipv4_udp", 10).data.length).toBe(14 + 20 + 8 + 10);
      expect(generateEmptyHeaderWithPayload("ipv4_tcp", 10).data.length).toBe(14 + 20 + 20 + 10);
      expect(generateEmptyHeaderWithPayload("ipv6_udp", 10).data.length).toBe(14 + 40 + 8 + 10);
      expect(generateEmptyHeaderWithPayload("ipv6_tcp", 10).data.length).toBe(14 + 40 + 20 + 10);
    });

    test("confirm that correct fields are disabled", () => {
      expect(
        findIndicesOfByteFieldState(
          Object.values(generateEmptyHeaderWithPayload("ipv4_udp", 10).field_states),
          ByteFieldState.DISABLED,
        ),
      ).toEqual([24, 25, 40, 41]);
      expect(
        findIndicesOfByteFieldState(
          Object.values(generateEmptyHeaderWithPayload("ipv4_tcp", 10).field_states),
          ByteFieldState.DISABLED,
        ),
      ).toEqual([24, 25, 50, 51]);
      expect(
        findIndicesOfByteFieldState(
          Object.values(generateEmptyHeaderWithPayload("ipv6_udp", 10).field_states),
          ByteFieldState.DISABLED,
        ),
      ).toEqual([60, 61]);
      expect(
        findIndicesOfByteFieldState(
          Object.values(generateEmptyHeaderWithPayload("ipv6_tcp", 10).field_states),
          ByteFieldState.DISABLED,
        ),
      ).toEqual([70, 71]);
    });

    test("test with initially normal and disabled fields", () => {
      // all fields are disabled by default (disabled_fields = true)
      expect(generateEmptyHeaderWithPayload("ipv4_udp", 10, true).field_states).toEqual([
        ...Array(52).fill(ByteFieldState.DISABLED),
      ]);
      // all fields expect checksum are disabled (disabled_fields = false)
      expect(generateEmptyHeaderWithPayload("ipv4_udp", 10, false).field_states).toEqual([
        ...Array(24).fill(ByteFieldState.NORMAL),
        ...Array(2).fill(ByteFieldState.DISABLED),
        ...Array(14).fill(ByteFieldState.NORMAL),
        ...Array(2).fill(ByteFieldState.DISABLED),
        ...Array(10).fill(ByteFieldState.NORMAL),
      ]);
    });
  });

  describe("parseByteString", () => {
    test("testing example strings for correct results", () => {
      expect(parseByteString("DEADBEEF")).toEqual([222, 173, 190, 239]);
      expect(parseByteString("DE AD BE EF")).toEqual([222, 173, 190, 239]);
      expect(parseByteString("DE AD\nBE EF\n ")).toEqual([222, 173, 190, 239]);
      expect(parseByteString("AB__EF")).toEqual([171, -1, 239]);
      expect(parseByteString("__EF")).toEqual([-1, 239]);
      expect(parseByteString("AB__")).toEqual([171, -1]);
    });

    test("testing if invalid strings throw the correct error", () => {
      expect(() => parseByteString("")).toThrowError(InvalidByteStringError);
      expect(() => parseByteString("XYZ")).toThrowError(InvalidByteStringError);
      expect(() => parseByteString("-1")).toThrowError(InvalidByteStringError);
      expect(() => parseByteString("DEA")).toThrowError(InvalidByteStringError);
      expect(() => parseByteString("AB_EF")).toThrowError(InvalidByteStringError);
      expect(() => parseByteString("AB_E_F")).toThrowError(InvalidByteStringError);
      expect(() => parseByteString("AB_EF_01")).toThrowError(InvalidByteStringError);
    });
  });
});
