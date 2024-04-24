import { expect, describe, test } from "vitest";

import { calculateStandaloneChecksum } from "../src/lib/iptools/checksum-calc";

// Test data: IPv4+UDP
const EXAMPLE_PACKET_1 = {
  data: [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 69, 0, 0, 38, 212, 168, 64, 0, 64, 17, 104, 28, 127, 0, 0, 1, 127, 0, 0,
    1, 201, 68, 48, 57, 0, 18, 254, 37, 72, 69, 76, 76, 79, 87, 79, 82, 76, 68,
  ],
  header_mappings: [
    { start: 0, end: 13, hdr: 0, color: "#99aa66" }, // Ethernet
    { start: 14, end: 33, hdr: 1, color: "#66aa99" }, // IPv4
    { start: 34, end: 41, hdr: 3, color: "#aa6699" }, // UDP
    { start: 42, end: 52, hdr: 5, color: "0" }, // Payload
  ],
  field_states: [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
};
const EXAMPLE_PACKET_1_CHECKSUM_RESULT = [
  {
    protocol: "IPv4",
    checksum: 0x681c,
  },
  {
    protocol: "UDP",
    checksum: 0x88ca,
  },
];

// Test data: IPv6+UDP
const EXAMPLE_PACKET_2 = {
  data: [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 134, 221, 96, 3, 32, 229, 0, 18, 17, 64, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 196, 220, 48, 57, 0, 18, 0, 37, 72, 69, 76, 76, 79, 87, 79,
    82, 76, 68,
  ],
  header_mappings: [
    { start: 0, end: 13, hdr: 0, color: "#99aa66" }, // Ethernet
    { start: 14, end: 53, hdr: 2, color: "#aa9966" }, // IPv6
    { start: 54, end: 61, hdr: 3, color: "#aa6699" }, // UDP
    { start: 62, end: 71, hdr: 5, color: "0" }, // Payload
  ],
  field_states: [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
};
const EXAMPLE_PACKET_2_CHECKSUM_RESULT = [
  {
    protocol: "UDP",
    checksum: 0x8b33,
  },
];

// Test data: IPv4+TCP
const EXAMPLE_PACKET_3 = {
  data: [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 69, 0, 0, 62, 125, 3, 64, 0, 64, 6, 100, 222, 172, 16, 0, 92, 172, 16, 0,
    92, 192, 122, 48, 57, 245, 192, 64, 36, 94, 53, 130, 86, 128, 24, 1, 4, 89, 9, 0, 0, 1, 1, 8, 10, 74, 108, 213, 143,
    74, 108, 213, 143, 72, 101, 108, 108, 111, 87, 111, 114, 108, 100,
  ],
  header_mappings: [
    { start: 0, end: 13, hdr: 0, color: "#99aa66" }, // Ethernet
    { start: 14, end: 33, hdr: 1, color: "#66aa99" }, // IPv4
    { start: 34, end: 53, hdr: 4, color: "#6699aa" }, // TCP
    { start: 54, end: 63, hdr: 5, color: "0" }, // Payload
  ],
  field_states: [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
};
const EXAMPLE_PACKET_3_CHECKSUM_RESULT = [
  {
    protocol: "IPv4",
    checksum: 0x64de,
  },
  {
    protocol: "TCP",
    checksum: 0xd5b1,
  },
];

// Test data: IPv6+TCP
const EXAMPLE_PACKET_4 = {
  data: [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 134, 221, 96, 3, 203, 126, 0, 42, 6, 64, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 198, 128, 87, 73, 220, 123, 130, 110, 214, 14, 42, 245,
    128, 24, 1, 4, 0, 50, 0, 0, 1, 1, 8, 10, 218, 85, 97, 29, 218, 85, 97, 29, 72, 101, 108, 108, 111, 87, 111, 114,
    108, 100,
  ],
  header_mappings: [
    { start: 0, end: 13, hdr: 0, color: "#99aa66" }, // Ethernet
    { start: 14, end: 53, hdr: 2, color: "#aa9966" }, // IPv6
    { start: 54, end: 73, hdr: 4, color: "#6699aa" }, // TCP
    { start: 74, end: 83, hdr: 5, color: "0" }, // Payload
  ],
  field_states: [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
  ],
};
const EXAMPLE_PACKET_4_CHECKSUM_RESULT = [
  {
    protocol: "TCP",
    checksum: 0x8107,
  },
];

describe("checksum-calc", () => {
  test("test IPv4+UDP with calculateStandaloneChecksum", () => {
    expect(calculateStandaloneChecksum(EXAMPLE_PACKET_1)).toEqual(EXAMPLE_PACKET_1_CHECKSUM_RESULT);
  });

  test("test IPv6+UDP with calculateStandaloneChecksum", () => {
    expect(calculateStandaloneChecksum(EXAMPLE_PACKET_2)).toEqual(EXAMPLE_PACKET_2_CHECKSUM_RESULT);
  });

  test("test IPv4+TCP with calculateStandaloneChecksum", () => {
    expect(calculateStandaloneChecksum(EXAMPLE_PACKET_3)).toEqual(EXAMPLE_PACKET_3_CHECKSUM_RESULT);
  });

  test("test IPv6+TCP with calculateStandaloneChecksum", () => {
    expect(calculateStandaloneChecksum(EXAMPLE_PACKET_4)).toEqual(EXAMPLE_PACKET_4_CHECKSUM_RESULT);
  });
});
