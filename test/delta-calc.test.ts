import { expect, describe, test } from "vitest";

import { getDeltaChunks, calculateDeltaChecksum } from "../src/lib/iptools/delta-calc";
import { HeaderType } from "@/lib/iptools/iptools.types";
import { calculateStandaloneChecksum } from "@/lib/iptools/checksum-calc";

// Test data: IPv4+UDP, mid-header data changes, includes pseudo-header changes
// ip_src=0xDEADBEEF -> 0xDEADBABE | udp=0xCAFE -> 0x7EA0 | payload=-1, 0xABCD -> -1, 0x4711 (odd position)
const EXAMPLE_PACKETS_1 = {
  original_data: [
    // Ethernet
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    // IPv4
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0xde, 0xad, 0xbe, 0xef, -1, -1, -1, -1,
    // UDP
    -1, -1, 0xca, 0xfe, -1, -1, -1, -1,
    // Payload
    -1, 0xab, 0xcd, -1, -1, -1, -1, -1, -1, -1, -1,
  ],
  modified_data: [
    // Ethernet
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    // IPv4
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0xde, 0xad, 0xba, 0xbe, -1, -1, -1, -1,
    // UDP
    -1, -1, 0x7e, 0xa0, -1, -1, -1, -1,
    // Payload
    -1, 0x47, 0x11, -1, -1, -1, -1, -1, -1, -1, -1,
  ],
  header_mappings: [
    { start: 0, end: 13, hdr: 0, color: "#99aa66" }, // Ethernet
    { start: 14, end: 33, hdr: 1, color: "#66aa99" }, // IPv4
    { start: 34, end: 41, hdr: 3, color: "#aa6699" }, // UDP
    { start: 42, end: 52, hdr: 5, color: "0" }, // Payload
  ],
  field_states: Array(52).fill(0),
};
const EXAMPLE_PACKETS_1_CHUNKS = [
  {
    hdr: HeaderType.IPV4,
    start: 26,
    end: 29,
    original_data: [0xde, 0xad, 0xbe, 0xef],
    modified_data: [0xde, 0xad, 0xba, 0xbe],
  },
  {
    hdr: HeaderType.UDP,
    start: 36,
    end: 37,
    original_data: [0xca, 0xfe],
    modified_data: [0x7e, 0xa0],
  },
  {
    hdr: HeaderType.PAYLOAD,
    start: 43,
    end: 44,
    original_data: [0xab, 0xcd],
    modified_data: [0x47, 0x11],
  },
];
const EXAMPLE_PACKETS_1_DELTAS = [
  { protocol: "IPv4", checksum: 0x0431 },
  { protocol: "UDP", checksum: 0x0cf4 },
];

describe("delta-calc", () => {
  describe("getDeltaChunks", () => {
    /* test getDeltaChunks with a packet where the data is in the middle
     * of the packet, but not at the beginning or end of any header
     */
    test("test mid-header data chunks", () => {
      expect(
        getDeltaChunks(
          {
            data: EXAMPLE_PACKETS_1.original_data,
            header_mappings: EXAMPLE_PACKETS_1.header_mappings,
            field_states: EXAMPLE_PACKETS_1.field_states,
          },
          {
            data: EXAMPLE_PACKETS_1.modified_data,
            header_mappings: EXAMPLE_PACKETS_1.header_mappings,
            field_states: EXAMPLE_PACKETS_1.field_states,
          },
        ),
      ).toEqual(EXAMPLE_PACKETS_1_CHUNKS);
    });

    /* test getDeltaChunks with a packet where a data chunk starts at
     * the end of header n and ends at the beginning of header n+1
     * (included due bug in previous implementation where last chunk was not included)
     */
    test("test header-overlapping data chunks", () => {});

    /* test getDeltaChunks with a packet where all fields are filled */
    test("test with all fields filled", () => {});
  });

  describe("calculateDeltaChecksum", () => {
    test("test checksum delta", () => {
      // calculate checksum delta by substracting the original checksum from the modified checksum
      const r1 = calculateStandaloneChecksum({
        data: EXAMPLE_PACKETS_1.modified_data.map((num) => (num === -1 ? 0 : num)),
        header_mappings: EXAMPLE_PACKETS_1.header_mappings,
        field_states: EXAMPLE_PACKETS_1.field_states,
      });
      const r2 = calculateStandaloneChecksum({
        data: EXAMPLE_PACKETS_1.original_data.map((num) => (num === -1 ? 0 : num)),
        header_mappings: EXAMPLE_PACKETS_1.header_mappings,
        field_states: EXAMPLE_PACKETS_1.field_states,
      });
      const sub_delta = [
        {
          protocol: "IPv4",
          checksum: (r1[0].checksum - r2[0].checksum) & 0xffff,
        },
        {
          protocol: "UDP",
          checksum: (r1[1].checksum - r2[1].checksum) & 0xffff,
        },
      ];

      // verify calculateStandaloneChecksum again as you cannot test too much
      expect(sub_delta).toEqual(EXAMPLE_PACKETS_1_DELTAS);

      expect(
        calculateDeltaChecksum(
          {
            data: EXAMPLE_PACKETS_1.original_data,
            header_mappings: EXAMPLE_PACKETS_1.header_mappings,
            field_states: EXAMPLE_PACKETS_1.field_states,
          },
          {
            data: EXAMPLE_PACKETS_1.modified_data,
            header_mappings: EXAMPLE_PACKETS_1.header_mappings,
            field_states: EXAMPLE_PACKETS_1.field_states,
          },
        ),
      ).toEqual(sub_delta);
    });
  });
});
