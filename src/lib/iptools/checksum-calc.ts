import { InternetHeaderConstants } from "./header.constants";
import {
  ChecksumResult,
  HeaderType,
  IncompleteHeaderError,
  InvalidHeaderLengthError,
  PacketData,
} from "./iptools.types";

/**
 * Calculates the standalone checksum for each header in the packet data.
 * @param {PacketData} packet_data The packet data containing the headers.
 * @returns {ChecksumResult[]} An array of ChecksumResult objects, each containing the protocol and checksum value.
 */
export function calculateStandaloneChecksum(packet_data: PacketData): ChecksumResult[] {
  const checksums: ChecksumResult[] = [];

  for (let i = 0; i < packet_data.header_mappings.length; i++) {
    const hdr = packet_data.header_mappings[i];

    try {
      if (hdr.hdr === HeaderType.ETHERNET) {
        // no checksum
      } else if (hdr.hdr === HeaderType.IPV4) {
        checksums.push({
          protocol: "IPv4",
          checksum: calculateIPv4Checksum(packet_data, i),
        });
      } else if (hdr.hdr === HeaderType.UDP) {
        checksums.push({
          protocol: "UDP",
          checksum: calculateUDPChecksum(packet_data, i),
        });
      } else if (hdr.hdr === HeaderType.TCP) {
        checksums.push({
          protocol: "TCP",
          checksum: calculateTCPChecksum(packet_data, i),
        });
      }
    } catch (error) {
      if (error === IncompleteHeaderError) continue;
      else throw error;
    }
  }

  return checksums;
}

/**
 * Calculates the IPv4 checksum for the specified header in the packet data.
 * @param {PacketData} packet_data The packet data containing the headers.
 * @param {number} idx The index of the IPv4 header to calculate the checksum for.
 * @returns {number} The calculated IPv4 checksum.
 * @throws {InvalidHeaderLengthError} If the header length is invalid.
 * @throws {IncompleteHeaderError} If the header is incomplete (contains -1).
 */
function calculateIPv4Checksum(packet_data: PacketData, idx: number): number {
  const hdr = packet_data.header_mappings[idx];
  const header_data = packet_data.data.slice(hdr.start, hdr.end + 1);

  if (header_data.length !== InternetHeaderConstants.ipv4_length) throw InvalidHeaderLengthError;

  header_data[InternetHeaderConstants.ipv4_checksum_offset] = 0;
  header_data[InternetHeaderConstants.ipv4_checksum_offset + 1] = 0;

  let checksum = 0;
  for (let i = 0; i < InternetHeaderConstants.ipv4_length; i += 2) {
    if (header_data[i] === -1 || header_data[i + 1] === -1) throw IncompleteHeaderError;
    checksum += (header_data[i] << 8) + header_data[i + 1];
  }
  checksum = (checksum & 0xffff) + (checksum >> 16);
  checksum = (checksum & 0xffff) + (checksum >> 16);
  checksum = ~checksum;
  return checksum & 0xffff;
}

/**
 * Calculates the pseudo header sum for the specified OSI layer 4 header in the packet data.
 * @param {PacketData} packet_data The packet data containing the headers.
 * @param {number} osi4_hdr_idx The index of the OSI layer 4 (UDP/TCP) header.
 * @param {number} protocol The protocol number (17 for UDP, 6 for TCP).
 * @returns {number} The calculated pseudo header sum.
 * @throws {IncompleteHeaderError} If the header is incomplete (contains -1).
 */
function calculatePseudoHeaderSum(packet_data: PacketData, osi4_hdr_idx: number, protocol: number): number {
  const hdr = packet_data.header_mappings[osi4_hdr_idx];
  const payload_data = packet_data.data.slice(hdr.end + 1);

  const osi4_header_length = hdr.end - hdr.start + 1;

  let checksum = 0;

  for (const hdr2 of packet_data.header_mappings) {
    if (hdr2.hdr === HeaderType.IPV4) {
      let src_ip_sum = 0;
      let dst_ip_sum = 0;

      for (let i = 0; i < 4; i += 2) {
        const ip_byte_lo = packet_data.data[hdr2.start + InternetHeaderConstants.ipv4_src_ip_offset + i];
        const ip_byte_hi = packet_data.data[hdr2.start + InternetHeaderConstants.ipv4_src_ip_offset + i + 1];
        if (ip_byte_lo === -1 || ip_byte_hi === -1) throw IncompleteHeaderError;
        src_ip_sum += (ip_byte_lo << 8) + ip_byte_hi;
      }

      for (let i = 0; i < 4; i += 2) {
        const ip_byte_lo = packet_data.data[hdr2.start + InternetHeaderConstants.ipv4_dest_ip_offset + i];
        const ip_byte_hi = packet_data.data[hdr2.start + InternetHeaderConstants.ipv4_dest_ip_offset + i + 1];
        if (ip_byte_lo === -1 || ip_byte_hi === -1) throw IncompleteHeaderError;
        dst_ip_sum += (ip_byte_lo << 8) + ip_byte_hi;
      }

      checksum += src_ip_sum;
      checksum += dst_ip_sum;

      // checksum += 0;  // reserved
      checksum += protocol; // protocol
      checksum += osi4_header_length + payload_data.length;
      break;
    } else if (hdr2.hdr === HeaderType.IPV6) {
      const next_header = packet_data.data[hdr2.start + 6];
      if (next_header === -1) throw IncompleteHeaderError;

      let src_ip_sum = 0;
      let dst_ip_sum = 0;

      for (let i = 0; i < 16; i += 2) {
        const ip_byte_lo = packet_data.data[hdr2.start + InternetHeaderConstants.ipv6_src_ip_offset + i];
        const ip_byte_hi = packet_data.data[hdr2.start + InternetHeaderConstants.ipv6_src_ip_offset + i + 1];
        if (ip_byte_lo === -1 || ip_byte_hi === -1) throw IncompleteHeaderError;
        src_ip_sum += (ip_byte_lo << 8) + ip_byte_hi;
      }

      for (let i = 0; i < 16; i += 2) {
        const ip_byte_lo = packet_data.data[hdr2.start + InternetHeaderConstants.ipv6_dest_ip_offset + i];
        const ip_byte_hi = packet_data.data[hdr2.start + InternetHeaderConstants.ipv6_dest_ip_offset + i + 1];
        if (ip_byte_lo === -1 || ip_byte_hi === -1) throw IncompleteHeaderError;
        dst_ip_sum += (ip_byte_lo << 8) + ip_byte_hi;
      }

      const upper_layer_length = osi4_header_length + payload_data.length;

      checksum += src_ip_sum;
      checksum += dst_ip_sum;
      checksum += upper_layer_length;
      checksum += next_header;

      break;
    }
  }

  return checksum;
}

/**
 * Calculates the UDP checksum for the specified header in the packet data.
 * @param {PacketData} packet_data The packet data containing the headers.
 * @param {number} idx The index of the UDP header to calculate the checksum for.
 * @returns {number} The calculated UDP checksum.
 * @throws {InvalidHeaderLengthError} If the header length is invalid.
 * @throws {IncompleteHeaderError} If the header is incomplete (contains -1).
 */
function calculateUDPChecksum(packet_data: PacketData, idx: number): number {
  const hdr = packet_data.header_mappings[idx];
  const header_data = packet_data.data.slice(hdr.start, hdr.end + 1);
  const payload_data = packet_data.data.slice(hdr.end + 1);

  if (header_data.length !== InternetHeaderConstants.udp_length) throw InvalidHeaderLengthError;

  header_data[InternetHeaderConstants.udp_checksum_offset] = 0;
  header_data[InternetHeaderConstants.udp_checksum_offset + 1] = 0;

  let checksum = 0;

  // determine and add pseudo-header to checksum
  checksum += calculatePseudoHeaderSum(packet_data, idx, 17);

  // add udp header to checksum
  for (let i = 0; i < InternetHeaderConstants.udp_length; i += 2) {
    if (header_data[i] === -1 || header_data[i + 1] === -1) throw IncompleteHeaderError;
    checksum += (header_data[i] << 8) + header_data[i + 1];
  }

  // add payload to checksun
  for (let i = 0; i < payload_data.length - 1; i += 2) {
    if (payload_data[i] === -1 || payload_data[i + 1] === -1) throw IncompleteHeaderError;
    checksum += (payload_data[i] << 8) + payload_data[i + 1];
  }
  if (payload_data.length % 2 === 1) {
    if (payload_data[payload_data.length - 1] === -1) throw IncompleteHeaderError;
    checksum += payload_data[payload_data.length - 1] << 8;
  }

  checksum = (checksum & 0xffff) + (checksum >> 16);
  checksum = (checksum & 0xffff) + (checksum >> 16);
  checksum = ~checksum;
  return checksum & 0xffff;
}

/**
 * Calculates the TCP checksum for the specified header in the packet data.
 * @param {PacketData} packet_data The packet data containing the headers.
 * @param {number} idx The index of the TCP header to calculate the checksum for.
 * @returns {number} The calculated TCP checksum.
 * @throws {InvalidHeaderLengthError} If the header length is invalid.
 * @throws {IncompleteHeaderError} If the header is incomplete (contains -1).
 */
function calculateTCPChecksum(packet_data: PacketData, idx: number): number {
  const hdr = packet_data.header_mappings[idx];
  const header_data = packet_data.data.slice(hdr.start, hdr.end + 1);
  const payload_data = packet_data.data.slice(hdr.end + 1);

  if (header_data.length !== InternetHeaderConstants.tcp_length) throw InvalidHeaderLengthError;

  header_data[InternetHeaderConstants.tcp_checksum_offset] = 0;
  header_data[InternetHeaderConstants.tcp_checksum_offset + 1] = 0;

  let checksum = 0;

  // determine and add pseudo-header to checksum
  checksum += calculatePseudoHeaderSum(packet_data, idx, 6);

  // add tcp header to checksum
  for (let i = 0; i < InternetHeaderConstants.tcp_length; i += 2) {
    if (header_data[i] === -1 || header_data[i + 1] === -1) throw IncompleteHeaderError;
    checksum += (header_data[i] << 8) + header_data[i + 1];
  }

  // add payload to checksun
  for (let i = 0; i < payload_data.length - 1; i += 2) {
    if (payload_data[i] === -1 || payload_data[i + 1] === -1) throw IncompleteHeaderError;
    checksum += (payload_data[i] << 8) + payload_data[i + 1];
  }
  if (payload_data.length % 2 === 1) {
    if (payload_data[payload_data.length - 1] === -1) throw IncompleteHeaderError;
    checksum += payload_data[payload_data.length - 1] << 8;
  }

  checksum = (checksum & 0xffff) + (checksum >> 16);
  checksum = (checksum & 0xffff) + (checksum >> 16);
  checksum = ~checksum;
  return checksum & 0xffff;
}
