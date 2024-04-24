export const InvalidByteStringError = new Error("Invalid byte string");
export const PacketLengthMismatchError = new Error("Packet data lengths do not match");
export const InvalidHeaderLengthError = new Error("Invalid header length");
export const IncompleteHeaderError = new Error("Incomplete header data");

export const ProtocolCombinationNames = ["ipv4_udp", "ipv4_tcp", "ipv6_udp", "ipv6_tcp"] as const;
export type ProtocolCombinations = (typeof ProtocolCombinationNames)[number];

export enum ByteFieldState {
  NORMAL,
  DISABLED,
  HIGHLIGHTED,
  HIDDEN,
  DISABLED_INVISIBLE, // Functionally disabled, but not darkening effect
}

export enum HeaderType {
  ETHERNET,
  IPV4,
  IPV6,
  UDP,
  TCP,
  PAYLOAD,
}

export type HeaderMapping = {
  start: number;
  end: number;
  hdr: HeaderType;
  color: string;
};

export type PacketData = {
  data: number[];
  header_mappings: HeaderMapping[];
  field_states: { [field: number]: ByteFieldState };
};

export type ChecksumResult = {
  protocol: string;
  checksum: number;
};

export type DeltaSection = {
  hdr: HeaderType;
  start: number;
  end: number;
  original_data: number[];
  modified_data: number[];
};
