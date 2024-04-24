import { produce } from "immer";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import CustomCombobox from "@/components/ui/custom-combobox";
import { DataCalculatorProps } from "@/components/DataCalculator/DataCalculator";

import { ProtocolCombinations } from "@/lib/iptools/iptools.types";

export type AppOptions = DataCalculatorProps & {
  lockUi: boolean;
};

type OptionSelectorProps = {
  value: AppOptions;
  onChange: (value: AppOptions) => void;
};

export default function OptionSelector(props: OptionSelectorProps) {
  return (
    <div className="xl:flex xl:space-x-6 space-y-1 xl:space-y-0">
      <div className="flex items-center space-x-2">
        <label className="w-24 xl:w-auto">Protocols:</label>
        <CustomCombobox
          entries={[
            { label: "IPv4 + UDP", value: "ipv4_udp" },
            { label: "IPv4 + TCP", value: "ipv4_tcp" },
            { label: "IPv6 + UDP", value: "ipv6_udp" },
            { label: "IPv6 + TCP", value: "ipv6_tcp" },
          ]}
          value={props.value.protocols}
          setValue={(v: string) => {
            props.onChange(
              produce(props.value, (draft) => {
                draft.protocols = v as ProtocolCombinations;
              }),
            );
          }}
          disabled={props.value.lockUi}
        />
      </div>

      <div className="flex items-center space-x-2">
        <label htmlFor="input-payload-size" className="w-24 xl:w-auto whitespace-nowrap">
          Payload Size:
        </label>
        <Input
          id="input-payload-size"
          type="number"
          min={0}
          max={100}
          value={props.value.payloadSize}
          className="w-[200px]"
          onChange={(e) => {
            if (parseInt(e.currentTarget.value).toString() !== e.currentTarget.value) return;
            if (parseInt(e.currentTarget.value) < 0) return;
            props.onChange(
              produce(props.value, (draft) => {
                draft.payloadSize = parseInt(e.currentTarget.value);
              }),
            );
          }}
          disabled={props.value.lockUi}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          checked={props.value.enableDelta}
          onCheckedChange={(checked) => {
            props.onChange(
              produce(props.value, (draft) => {
                draft.enableDelta = checked === false ? false : true;
              }),
            );
          }}
          id="chk-enable-delta"
          disabled={props.value.lockUi}
        />
        <label htmlFor="chk-enable-delta" className="whitespace-nowrap">
          Enable Delta
        </label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          checked={props.value.educationalMode}
          onCheckedChange={(checked) => {
            props.onChange(
              produce(props.value, (draft) => {
                draft.educationalMode = checked === false ? false : true;
              }),
            );
          }}
          id="chk-edumode"
          disabled={props.value.lockUi}
        />
        <label htmlFor="chk-edumode" className="whitespace-nowrap">
          Educational Mode
        </label>
      </div>
    </div>
  );
}
