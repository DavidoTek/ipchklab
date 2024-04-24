import { useEffect, useState } from "react";
import DataEditor, { ByteEdit } from "../DataEditor/DataEditor";

import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";

import { produce } from "immer";
import { ByteFieldState, ChecksumResult, PacketData, ProtocolCombinations } from "@/lib/iptools/iptools.types";
import { calculateDeltaChecksum } from "@/lib/iptools/delta-calc";
import { calculateStandaloneChecksum } from "@/lib/iptools/checksum-calc";
import { generateEmptyHeaderWithPayload, parseByteString } from "@/lib/iptools/iptools-util";

enum PacketSide {
  LEFT,
  RIGHT,
}

/**
 * Properties of the DataCalculator component
 * @property protocol - Protocol combinations for the data editor
 * @property payloadSize - Size of the payload in bytes
 * @property enableDelta - Show two data editors and calculate the checksum delta
 * @property educationalMode - Let the user type in a checksum and get feedback if it is correct
 * @property educationalModePacketData - Initial packet data. May have all fields set to disabled if desired. Works in non-educational mode too
 */
export type DataCalculatorProps = {
  protocols: ProtocolCombinations;
  payloadSize: number;
  enableDelta: boolean;
  educationalMode: boolean;
  educationalModePacketData?: [PacketData, PacketData?];
};

export default function DataCalculator(props: DataCalculatorProps) {
  const { toast } = useToast();

  const [leftPacketData, setLeftPacketData] = useState<PacketData>({ data: [], header_mappings: [], field_states: {} });
  const [rightPacketData, setRightPacketData] = useState<PacketData>({
    data: [],
    header_mappings: [],
    field_states: {},
  });

  const [checksumResults, setChecksumResults] = useState<ChecksumResult[]>([]);
  const [eduModeResults, setEduModeResults] = useState<ChecksumResult[]>([]);

  const updateChecksums = () => {
    if (props.enableDelta) {
      const deltaChecksums = calculateDeltaChecksum(leftPacketData, rightPacketData);
      setChecksumResults(deltaChecksums);
      setEduModeResults(
        deltaChecksums.map((c) => {
          return { protocol: c.protocol, checksum: 0 };
        }),
      );
    } else {
      const leftChecksums = calculateStandaloneChecksum(leftPacketData);
      setChecksumResults(leftChecksums);
      setEduModeResults(
        leftChecksums.map((c) => {
          return { protocol: c.protocol, checksum: 0 };
        }),
      );
    }
  };

  const handleDataChange = (idx: number, byte: number, side: PacketSide) => {
    if (side === PacketSide.LEFT) {
      setLeftPacketData(
        produce(leftPacketData, (draft) => {
          draft.data[idx] = byte;
        }),
      );

      // Highlight the corresponding byte in the right packet if field is not empty
      if (props.enableDelta) {
        setRightPacketData(
          produce(rightPacketData, (draft) => {
            draft.field_states[idx] = byte === -1 ? ByteFieldState.DISABLED : ByteFieldState.HIGHLIGHTED;
            if (byte === -1) draft.data[idx] = -1;
          }),
        );
      }
    } else {
      setRightPacketData(
        produce(rightPacketData, (draft) => {
          draft.data[idx] = byte;
        }),
      );
    }
  };

  const handleCopyPacket = (side: PacketSide) => {
    const packet_data = side === PacketSide.LEFT ? leftPacketData : rightPacketData;

    const hex_string = packet_data.data
      .map((byte) => (byte === -1 ? 0 : byte))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join(" ")
      .toUpperCase();

    navigator.clipboard
      .writeText(hex_string)
      .then(() => {
        toast({
          description: "Copied the " + (side === PacketSide.LEFT ? "original" : "modified") + " packet as HEX string",
        });
      })
      .catch(() => {
        toast({
          description: "Could not copy to your clipboard",
        });
      });
  };

  const handleClearPacket = (side: PacketSide) => {
    if (side === PacketSide.LEFT) {
      const packet_data_normal = generateEmptyHeaderWithPayload(props.protocols, props.payloadSize);
      const packet_data_disabled = generateEmptyHeaderWithPayload(props.protocols, props.payloadSize, true);

      setLeftPacketData(packet_data_normal);
      setRightPacketData(packet_data_disabled);
    } else {
      setRightPacketData(
        produce(rightPacketData, (draft) => {
          draft.data = Array(draft.data.length).fill(-1);
        }),
      );
    }
  };

  /* Recalculate the Checksums when the Data changes */
  useEffect(updateChecksums, [leftPacketData, rightPacketData, props.enableDelta]);

  /* Generate the initial packet data or load edu mode data (regenerate when properties change) */
  useEffect(() => {
    if (props.educationalModePacketData === undefined) {
      const packet_data_normal = generateEmptyHeaderWithPayload(props.protocols, props.payloadSize);
      const packet_data_disabled = generateEmptyHeaderWithPayload(props.protocols, props.payloadSize, true);

      setLeftPacketData(packet_data_normal);
      setRightPacketData(packet_data_disabled);
    } else {
      setLeftPacketData(props.educationalModePacketData[0]);
      if (props.educationalModePacketData[1] !== undefined) {
        setRightPacketData(props.educationalModePacketData[1]);
      } else {
        console.log("No right-side packet data provided, falling back to left packet data");
        setRightPacketData(props.educationalModePacketData[0]);
      }
    }
  }, [props]);

  /* Handle pasting */
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      let bytes: number[];

      try {
        const text = event.clipboardData?.getData("text") || "";
        bytes = parseByteString(text);
      } catch (error) {
        return;
      }

      const activeElementId = document.activeElement?.id || "";
      if (!activeElementId.startsWith("byteedit-")) return;

      const field_side = activeElementId.split("-")[1];
      const field_idx = parseInt(activeElementId.split("-")[2]);

      if (field_side === "left" && field_idx !== -1) {
        setLeftPacketData(
          produce(leftPacketData, (draft) => {
            for (let i = 0; i < bytes.length; i++) {
              const paste_position = i + field_idx;
              if (paste_position === draft.data.length) break;
              if (draft.field_states[paste_position] === ByteFieldState.DISABLED) continue;
              draft.data[paste_position] = bytes[i];
            }
          }),
        );
        if (props.enableDelta) {
          setRightPacketData(
            produce(rightPacketData, (draft) => {
              for (let i = 0; i < bytes.length; i++) {
                const paste_position = i + field_idx;
                if (paste_position === draft.data.length) break;
                if (leftPacketData.field_states[paste_position] === ByteFieldState.DISABLED) continue;
                draft.field_states[paste_position] =
                  bytes[i] === -1 ? ByteFieldState.DISABLED : ByteFieldState.HIGHLIGHTED;
              }
            }),
          );
        }
      } else if (field_side === "right" && field_idx !== -1) {
        setRightPacketData(
          produce(rightPacketData, (draft) => {
            for (let i = 0; i < bytes.length; i++) {
              const paste_position = i + field_idx;
              if (paste_position === draft.data.length) break;
              if (draft.field_states[paste_position] === ByteFieldState.DISABLED) continue;
              draft.data[paste_position] = bytes[i];
            }
          }),
        );
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [leftPacketData, rightPacketData, props.enableDelta]);

  return (
    <div className="grid gap-5">
      <div></div>

      <div className="lg:flex lg:gap-11">
        <ContextMenu>
          <ContextMenuTrigger>
            <DataEditor
              data={leftPacketData.data}
              headerMappings={leftPacketData.header_mappings}
              fieldStates={leftPacketData.field_states}
              dataChanged={(idx, byte) => {
                handleDataChange(idx, byte, PacketSide.LEFT);
              }}
              title={"Original Packet"}
              side={"left"}
              renderAddress={true}
            />
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onSelect={() => handleCopyPacket(PacketSide.LEFT)}>
              Copy packet as HEX stream
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => handleClearPacket(PacketSide.LEFT)}>Clear packet data</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {props.enableDelta ? (
          <ContextMenu>
            <ContextMenuTrigger>
              <DataEditor
                data={rightPacketData.data}
                headerMappings={rightPacketData.header_mappings}
                fieldStates={rightPacketData.field_states}
                dataChanged={(idx, byte) => {
                  handleDataChange(idx, byte, PacketSide.RIGHT);
                }}
                title={"Modified Packet"}
                side={"right"}
                renderAddress={false}
              />
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onSelect={() => handleCopyPacket(PacketSide.RIGHT)}>
                Copy packet as HEX stream
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => handleClearPacket(PacketSide.RIGHT)}>Clear packet data</ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ) : null}
      </div>

      <div>
        <h2 className="text-2xl font-bold">{props.enableDelta ? "Deltas" : "Checksums"}</h2>
        <Table className="w-[200px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Protocol</TableHead>
              <TableHead>Checksum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {checksumResults.map((cs, i) => {
              const hex_string = cs.checksum.toString(16).toUpperCase().padStart(4, "0");
              const hex_with_space = hex_string.slice(0, 2) + " " + hex_string.slice(2, 4);
              const pretty_checksum = cs.checksum === -1 ? "N/A" : hex_with_space;
              return (
                <TableRow key={i}>
                  <TableCell className="font-semibold">{cs.protocol}</TableCell>
                  <TableCell>
                    {props.educationalMode ? (
                      <div className="flex items-center gap-0.5">
                        <ByteEdit
                          byte={(eduModeResults[i].checksum >> 8) & 0xff}
                          state={ByteFieldState.HIGHLIGHTED}
                          backgroundColor=""
                          dataChanged={(n) => {
                            setEduModeResults(
                              produce((draft) => {
                                draft[i].checksum = (draft[i].checksum & 0xff) + (n << 8);
                                return draft;
                              }),
                            );
                          }}
                          input_id={`chk-byteedit-${i}-high`}
                        />
                        <ByteEdit
                          byte={eduModeResults[i].checksum & 0xff}
                          state={ByteFieldState.HIGHLIGHTED}
                          backgroundColor=""
                          dataChanged={(n) => {
                            setEduModeResults(
                              produce((draft) => {
                                draft[i].checksum = (draft[i].checksum & 0xff00) + n;
                                return draft;
                              }),
                            );
                          }}
                          input_id={`chk-byteedit-${i}-low`}
                        />
                        {checksumResults[i].checksum === eduModeResults[i].checksum ? (
                          <img src="assets/edu_true.svg" />
                        ) : (
                          <img src="assets/edu_false.svg" />
                        )}
                      </div>
                    ) : (
                      pretty_checksum
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
