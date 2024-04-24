import React, { useEffect } from "react";

import { getIdealTextColor } from "../../lib/text-color-calculator";
import { ByteFieldState, HeaderMapping } from "@/lib/iptools/iptools.types";

type ByteEditProps = {
  byte: number;
  state: ByteFieldState;
  backgroundColor: string;
  input_id: string;
  dataChanged: (byte: number) => void;
  fieldFull?: () => void; // Called when the field is full (i.e. 2 characters entered)
};

type DateEditorProps = {
  data: number[];
  headerMappings: HeaderMapping[];
  fieldStates: { [field: number]: ByteFieldState };
  renderAddress: boolean;
  title?: string;
  side: "left" | "right";
  dataChanged: (idx: number, byte: number) => void;
};

export function ByteEdit(props: ByteEditProps) {
  // Validate props
  if (props.byte < -1 || props.byte > 255) {
    throw new Error(`Invalid byte value ${props.byte} (must be between -1 and 255)`);
  }

  const [text, setText] = React.useState<string>("");

  const onTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value.toUpperCase();
    if (text.length > 2) return;
    if (!/^[0-9A-F]+$/.test(text) && text.length > 0) return;
    setText(text);
    if (text.length === 2 && props.fieldFull) props.fieldFull();
  };

  const onFieldBlur = () => {
    const byte = parseInt(text, 16);
    if (isNaN(byte)) {
      props.dataChanged(-1);
    } else {
      props.dataChanged(byte);
    }
  };

  useEffect(() => {
    const proptext = props.byte === -1 ? "" : props.byte.toString(16).toUpperCase().padStart(2, "0");
    setText(proptext);
  }, [props]);

  // Style depending on field state
  let extraClassName = "w-8 m-[3px] p-1 border-0 border-radius-6 text-center rounded-md font-bold placeholder-gray-500";
  if (props.state === ByteFieldState.NORMAL) extraClassName += " bg-slate-300";
  if (props.state === ByteFieldState.DISABLED) extraClassName += " bg-slate-300 brightness-75 saturate-50";
  if (props.state === ByteFieldState.HIGHLIGHTED) extraClassName += " bg-slate-300 placeholder-red-500";
  if (props.state === ByteFieldState.HIDDEN) extraClassName += " bg-slate-100";
  if (props.state === ByteFieldState.DISABLED_INVISIBLE) extraClassName += " bg-slate-300 hue-rotate-30";

  // Render
  return (
    <input
      type="text"
      id={props.input_id}
      placeholder={props.state !== ByteFieldState.HIDDEN ? "• •" : ""}
      value={text}
      onChange={onTextChange}
      onBlur={onFieldBlur}
      className={extraClassName}
      disabled={
        props.state === ByteFieldState.DISABLED ||
        props.state === ByteFieldState.HIDDEN ||
        props.state === ByteFieldState.DISABLED_INVISIBLE
      }
      style={{
        backgroundColor: props.backgroundColor,
        color: getIdealTextColor(props.backgroundColor),
      }}
    />
  );
}

function DataEditorWrapped(props: DateEditorProps) {
  const numBytes = props.data.length;
  const numRows = Math.ceil(numBytes / 8);

  /* Validate props */

  for (const byte of props.data) {
    if (byte < -1 || byte > 255) {
      throw new Error(`Invalid byte value ${byte} (must be between -1 and 255)`);
    }
  }

  for (const headerMapping of props.headerMappings) {
    if (headerMapping.start < 0 || headerMapping.start >= numBytes) {
      throw new Error(
        `Invalid header mapping start index ${headerMapping.start} (must be between 0 and ${numBytes - 1})`,
      );
    }
    if (headerMapping.end < 0 || headerMapping.end >= numBytes) {
      throw new Error(`Invalid header mapping end index ${headerMapping.end} (must be between 0 and ${numBytes - 1})`);
    }
    if (headerMapping.start > headerMapping.end) {
      throw new Error(
        `Invalid header mapping start index ${headerMapping.start} (must be less than or equal to ${headerMapping.end})`,
      );
    }
    if (headerMapping.color.length === 0) {
      throw new Error(`Invalid header mapping color "${headerMapping.color}" (must be non-empty)`);
    }
  }

  for (const idx in props.fieldStates) {
    if (parseInt(idx) < 0 || parseInt(idx) >= numBytes) {
      throw new Error(`Invalid field state index ${idx} (must be between 0 and ${numBytes - 1})`);
    }
  }

  /* Render */

  return (
    <div>
      {props.title && props.renderAddress && <span className="inline-block w-0 lg:w-16"></span>}
      {props.title && <span className="underline decoration-dashed">{props.title}</span>}
      {Array.from({ length: numRows }, (_, rowIndex) => (
        <div key={rowIndex}>
          {props.renderAddress && (
            <span className="inline-block w-0 lg:w-16 text-gray-600 dark:text-gray-400 invisible lg:visible">
              {(rowIndex * 8).toString(16).padStart(4, "0")}
            </span>
          )}
          {Array.from({ length: 8 }, (_, colIndex) => {
            const byteIndex = rowIndex * 8 + colIndex;
            const byte = byteIndex < numBytes ? props.data[byteIndex] : -1;
            const state =
              byteIndex < numBytes ? props.fieldStates[byteIndex] || ByteFieldState.NORMAL : ByteFieldState.HIDDEN;
            const backgroundColor =
              byteIndex < numBytes
                ? props.headerMappings.find((mapping) => byteIndex >= mapping.start && byteIndex <= mapping.end)
                    ?.color || ""
                : "";
            return (
              <ByteEdit
                key={colIndex}
                byte={byte}
                state={state}
                backgroundColor={backgroundColor}
                input_id={`byteedit-${props.side}-${byteIndex}`}
                dataChanged={(byte) => {
                  props.dataChanged(byteIndex, byte);
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default function DataEditor(props: DateEditorProps) {
  try {
    return DataEditorWrapped(props);
  } catch (e) {
    return (
      // @ts-expect-error type of error is unknown, but we know it has a message
      <div className="DataEditor-error">Could not Render the DataEditor: {e.message}</div>
    );
  }
}
