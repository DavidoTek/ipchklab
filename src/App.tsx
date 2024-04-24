import { useEffect, useState } from "react";
import { produce } from "immer";

import HeaderBar from "@/components/HeaderBar/HeaderBar";
import OptionSelector, { AppOptions } from "@/components/OptionSelector/OptionSelector";
import DataCalculator from "@/components/DataCalculator/DataCalculator";
import SideBar from "@/components/SideBar/SideBar";
import { ByteFieldState, ProtocolCombinationNames, ProtocolCombinations } from "@/lib/iptools/iptools.types";
import { byteStringRegex, generatePacketFromByteString } from "@/lib/iptools/iptools-util";

type AppProps = {
  versionName: string;
  repoUrl: string;
  sp: URLSearchParams;
};

function App(props: AppProps) {
  const [appOptions, setAppOptions] = useState<AppOptions>({
    protocols: "ipv4_udp",
    payloadSize: 9,
    enableDelta: false,
    educationalMode: false,
    educationalModePacketData: undefined,
    lockUi: false,
  });

  useEffect(() => {
    const p_protocols = props.sp.get("protocols") || "";
    const pi_plsize = parseInt(props.sp.get("plsize") || "");
    const p_endelta = props.sp.get("endelta");
    const p_edumode = props.sp.get("edumode");
    const p_lockui = props.sp.get("lockui") || "";
    const p_lockedit = props.sp.get("lockedit") || "";
    const p_pkgone = props.sp.get("pkgone") || "";
    const p_pkgtwo = props.sp.get("pkgtwo") || "";

    setAppOptions((appOptions) =>
      produce(appOptions, (draft) => {
        if (ProtocolCombinationNames.indexOf(p_protocols as ProtocolCombinations) !== -1) {
          draft.protocols = p_protocols as ProtocolCombinations;
        }
        if (pi_plsize >= 0) {
          draft.payloadSize = pi_plsize;
        }
        if (p_endelta === "true") draft.enableDelta = true;
        if (p_edumode === "true") draft.educationalMode = true;
        if (p_lockui === "true") draft.lockUi = true;

        if (byteStringRegex.test(p_pkgone) && p_pkgone.length !== 0) {
          let left_packet_data = generatePacketFromByteString(draft.protocols, draft.payloadSize, p_pkgone);
          let right_packet_data = undefined;
          if (byteStringRegex.test(p_pkgtwo) && p_pkgtwo.length !== 0) {
            right_packet_data = generatePacketFromByteString(draft.protocols, draft.payloadSize, p_pkgtwo);
          } else {
            right_packet_data = generatePacketFromByteString(draft.protocols, draft.payloadSize, p_pkgone);
          }

          if (p_lockedit === "true") {
            left_packet_data = produce(left_packet_data, (draft2) => {
              for (let i = 0; i < draft2.data.length; i++) {
                if (draft2.field_states[i] === ByteFieldState.DISABLED) continue;
                draft2.field_states[i] = ByteFieldState.DISABLED_INVISIBLE;
              }
            });
            right_packet_data = produce(right_packet_data, (draft2) => {
              for (let i = 0; i < draft2.data.length; i++) {
                if (draft2.field_states[i] === ByteFieldState.DISABLED) continue;
                draft2.field_states[i] = ByteFieldState.DISABLED_INVISIBLE;
              }
            });
          }

          draft.educationalModePacketData = [left_packet_data, right_packet_data];
        }
      }),
    );
  }, [props.sp]);

  return (
    <div>
      {/* Header Bar */}
      <header className="mb-3">
        <HeaderBar {...props} />
      </header>

      <div className="p-3 md:flex">
        {/* Content Area */}
        <div className="flex-1">
          <OptionSelector value={appOptions} onChange={setAppOptions} />

          <DataCalculator {...appOptions} />
        </div>

        {/* Side Bar */}
        <div className="w-64 pt-5 mt-8 md:mt-0 md:pt-0 md:pl-3 border-t-2 md:border-t-0 border-l-0 md:border-l-2 border-gray-300">
          <SideBar protocols={appOptions.protocols} enableDelta={appOptions.enableDelta} />
        </div>
      </div>
    </div>
  );
}

export default App;
