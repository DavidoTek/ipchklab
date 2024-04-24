import { ChecksumResult, DeltaSection, PacketData, PacketLengthMismatchError } from "./iptools.types";

import { calculateStandaloneChecksum } from "./checksum-calc";

/**
 * Calculates the delta checksum for the modified packet data.
 * Uses the standalone checksum calculation to calculate the original and modified
 * checksums, then subtracts the original checksum from the modified checksum.
 * (-1) are treated as 0 in the checksum calculation.
 * @param {PacketData} original_packet_data The original packet data.
 * @param {PacketData} modified_packet_data The modified packet data.
 * @returns {ChecksumResult[]} An array of ChecksumResult objects, each containing the protocol and checksum value.
 * @throws {PacketLengthMismatchError} If the packet data lengths do not match.
 */
export function calculateDeltaChecksum(
  original_packet_data: PacketData,
  modified_packet_data: PacketData,
): ChecksumResult[] {
  if (original_packet_data.data.length !== modified_packet_data.data.length) throw PacketLengthMismatchError;

  // create a shallow copy of the packet data, except the data array which is a deep copy replacing (-1) with (0).
  const original_packet_data_copy = {
    data: original_packet_data.data.map((num) => (num === -1 ? 0 : num)),
    header_mappings: original_packet_data.header_mappings,
    field_states: original_packet_data.field_states,
  };
  const modified_packet_data_copy = {
    data: modified_packet_data.data.map((num) => (num === -1 ? 0 : num)),
    header_mappings: modified_packet_data.header_mappings,
    field_states: modified_packet_data.field_states,
  };

  const checksum_result_original = calculateStandaloneChecksum(original_packet_data_copy);
  const checksum_result_modified = calculateStandaloneChecksum(modified_packet_data_copy);

  if (checksum_result_original.length !== checksum_result_modified.length) throw PacketLengthMismatchError;

  const checksums: ChecksumResult[] = [];

  for (let i = 0; i < checksum_result_original.length; i++) {
    const original = checksum_result_original[i];
    const modified = checksum_result_modified[i];

    if (original.protocol !== modified.protocol) throw PacketLengthMismatchError;

    checksums.push({
      protocol: original.protocol,
      checksum: (modified.checksum - original.checksum) & 0xffff,
    });
  }

  return checksums;
}

/**
 * Returns a list of all free-standing data sections.
 * @param {PacketData} original_packet_data The original packet data.
 * @param {PacketData} modified_packet_data The modified packet data.
 * @returns {DeltaSection[]} An array of DeltaSection objects, each containing the header type, start and end indices, and the original and modified data.
 * @throws {PacketLengthMismatchError} If the packet data lengths do not match.
 */
export function getDeltaChunks(original_packet_data: PacketData, modified_packet_data: PacketData): DeltaSection[] {
  if (original_packet_data.data.length !== modified_packet_data.data.length) throw PacketLengthMismatchError;

  const delta_sections: DeltaSection[] = [];

  for (let i = 0; i < original_packet_data.header_mappings.length; i++) {
    const hdr = original_packet_data.header_mappings[i];
    const hdr2 = modified_packet_data.header_mappings[i];
    if (hdr.hdr !== hdr2.hdr || hdr.start !== hdr2.start || hdr.end !== hdr2.end) throw PacketLengthMismatchError;

    let start = -1;

    for (let j = hdr.start; j <= hdr.end; j++) {
      if (original_packet_data.data[j] !== -1 && modified_packet_data.data[j] === -1) return [];
      if (original_packet_data.data[j] === -1 && modified_packet_data.data[j] === -1) {
        if (start !== -1) {
          delta_sections.push({
            hdr: hdr.hdr,
            start: start,
            end: j - 1,
            original_data: original_packet_data.data.slice(start, j),
            modified_data: modified_packet_data.data.slice(start, j),
          });
          start = -1;
        }
      } else {
        if (start === -1) start = j;
      }
      if (j === hdr.end) {
        if (start !== -1) {
          delta_sections.push({
            hdr: hdr.hdr,
            start: start,
            end: j,
            original_data: original_packet_data.data.slice(start, j + 1),
            modified_data: modified_packet_data.data.slice(start, j + 1),
          });
        }
      }
    }
  }

  return delta_sections;
}
