/* Generates packet data for a given protocol combination and payload length. For use with DataEditor */

import { InternetHeaderConstants } from "./header.constants";
import {
  ByteFieldState,
  HeaderMapping,
  HeaderType,
  InvalidByteStringError,
  PacketData,
  ProtocolCombinations,
} from "./iptools.types";

export const byteStringRegex: RegExp = /^(([0-9A-Fa-f][0-9A-Fa-f])|_{2})+$/;

/**
 * Generates empty packet data for a given protocol combination and payload length. For use with DataEditor
 * @param {ProtocolCombinations} protocols The protocol combination to generate the packet data for
 * @param {number} payload_length The length of the payload
 * @param {boolean=} [disabled_fields=false] The initial state of the fields (default: false)
 * @returns {PacketData} The generated packet data
 */
export function generateEmptyHeaderWithPayload(
  protocols: ProtocolCombinations,
  payload_length: number,
  disabled_fields?: boolean,
): PacketData {
  const data: number[] = [];
  const header_mappings: HeaderMapping[] = [];
  const field_states: { [field: number]: ByteFieldState } = [];

  const initial_field_state = disabled_fields ? ByteFieldState.DISABLED : ByteFieldState.NORMAL;

  let next_header_begin = 0;

  for (let i = 0; i < InternetHeaderConstants.ethernet_frame_length; i++) {
    data.push(-1);
    field_states[i] = initial_field_state;
  }
  header_mappings.push({
    start: 0,
    end: InternetHeaderConstants.ethernet_frame_length - 1,
    hdr: HeaderType.ETHERNET,
    color: "#99aa66",
  });
  next_header_begin = InternetHeaderConstants.ethernet_frame_length;

  if (protocols.indexOf("ipv4") !== -1) {
    // Fill IPv4 header with empty fields
    for (let i = 0; i < InternetHeaderConstants.ipv4_length; i++) {
      data.push(-1);
      field_states[next_header_begin + i] = initial_field_state;
    }
    // Disable IPv4 checksum fields
    for (let i = 0; i < InternetHeaderConstants.ipv4_checksum_length; i++) {
      field_states[next_header_begin + InternetHeaderConstants.ipv4_checksum_offset + i] = ByteFieldState.DISABLED;
    }
    // Add IPv4 header mapping
    header_mappings.push({
      start: next_header_begin,
      end: next_header_begin + InternetHeaderConstants.ipv4_length - 1,
      hdr: HeaderType.IPV4,
      color: "#66aa99",
    });
    next_header_begin += InternetHeaderConstants.ipv4_length;
  } else if (protocols.indexOf("ipv6") !== -1) {
    // Fill IPv6 header with empty fields
    for (let i = 0; i < InternetHeaderConstants.ipv6_length; i++) {
      data.push(-1);
      field_states[next_header_begin + i] = initial_field_state;
    }
    // Add IPv6 header mapping
    header_mappings.push({
      start: next_header_begin,
      end: next_header_begin + InternetHeaderConstants.ipv6_length - 1,
      hdr: HeaderType.IPV6,
      color: "#aa9966",
    });
    next_header_begin += InternetHeaderConstants.ipv6_length;
  }

  if (protocols.indexOf("udp") !== -1) {
    // Fill UDP header with empty fields
    for (let i = 0; i < InternetHeaderConstants.udp_length; i++) {
      data.push(-1);
      field_states[next_header_begin + i] = initial_field_state;
    }
    // Disable UDP checksum fields
    for (let i = 0; i < InternetHeaderConstants.udp_checksum_length; i++) {
      field_states[next_header_begin + InternetHeaderConstants.udp_checksum_offset + i] = ByteFieldState.DISABLED;
    }
    // Add UDP header mapping
    header_mappings.push({
      start: next_header_begin,
      end: next_header_begin + InternetHeaderConstants.udp_length - 1,
      hdr: HeaderType.UDP,
      color: "#aa6699",
    });
    next_header_begin += InternetHeaderConstants.udp_length;
  } else if (protocols.indexOf("tcp") !== -1) {
    // Fill TCP header with empty fields
    for (let i = 0; i < InternetHeaderConstants.tcp_length; i++) {
      data.push(-1);
      field_states[next_header_begin + i] = initial_field_state;
    }
    // Disable TCP checksum fields
    for (let i = 0; i < InternetHeaderConstants.tcp_checksum_length; i++) {
      field_states[next_header_begin + InternetHeaderConstants.tcp_checksum_offset + i] = ByteFieldState.DISABLED;
    }
    // Add TCP header mapping
    header_mappings.push({
      start: next_header_begin,
      end: next_header_begin + InternetHeaderConstants.tcp_length - 1,
      hdr: HeaderType.TCP,
      color: "#6699aa",
    });
    next_header_begin += InternetHeaderConstants.tcp_length;
  }

  for (let i = 0; i < payload_length; i++) {
    data.push(-1);
    field_states[next_header_begin + i] = initial_field_state;
  }
  // Add PAYLOAD header mapping
  if (payload_length > 0) {
    header_mappings.push({
      start: next_header_begin,
      end: next_header_begin + payload_length - 1,
      hdr: HeaderType.PAYLOAD,
      color: "#CBD5E1", // bg-slate-300
    });
  }

  return {
    data: data,
    header_mappings: header_mappings,
    field_states: field_states,
  };
}

/**
 * Convertes a byte string to a number array. Removes spaces and newlines. E.g., "DE AD BE EF" -> [222, 173, 190, 239]
 * @param {string} packet_string The byte string to convert
 * @returns {number[]} The number array
 * @throws {InvalidByteStringError} If the byte string is invalid
 */
export function parseByteString(packet_string: string): number[] {
  const text = packet_string.replace(/\s/g, "").toUpperCase();
  if (!byteStringRegex.test(text) || text.length === 0) throw InvalidByteStringError;
  /* v8 ignore next - match result will always be non-null */
  return text.match(/.{1,2}/g)?.map((byte) => (byte === "__" ? -1 : parseInt(byte, 16))) || [];
}

/**
 * Generates packet data from a byte string for a given protocol combination and payload length. For use with DataEditor
 * @param {ProtocolCombinations} protocols The protocol combination to generate the packet data for
 * @param {number} payload_length The length of the payload
 * @param {string} byte_string The byte string to convert
 * @param {boolean=} [disabled_fields=false] The initial state of the fields (default: false)
 * @returns {PacketData} The generated packet data
 */
export function generatePacketFromByteString(
  protocols: ProtocolCombinations,
  payload_length: number,
  byte_string: string,
) {
  const initial_packet = generateEmptyHeaderWithPayload(protocols, payload_length, false);

  const byte_sequence = parseByteString(byte_string);

  for (let i = 0; i < Math.min(initial_packet.data.length, byte_sequence.length); i++) {
    if (initial_packet.field_states[i] == ByteFieldState.DISABLED) continue;
    initial_packet.data[i] = byte_sequence[i];
  }

  return initial_packet;
}
