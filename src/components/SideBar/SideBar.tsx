import { ByteFieldState } from "@/lib/iptools/iptools.types";
import { ByteEdit } from "../DataEditor/DataEditor";
import "./SideBar.css";

type SideBarProps = {
  protocols: string;
  enableDelta: boolean;
};

export default function SideBar(props: SideBarProps) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Legend</h2>

      <h3 className="text-lg m-1">Headers</h3>
      <div className="headerLegend" style={{ backgroundColor: "#99aa66" }}>
        <p>Ethernet</p>
      </div>
      <div className="headerLegend" style={{ backgroundColor: "#66aa99" }} hidden={!props.protocols.includes("ipv4")}>
        <p>IPv4</p>
      </div>
      <div className="headerLegend" style={{ backgroundColor: "#aa9966" }} hidden={!props.protocols.includes("ipv6")}>
        <p>IPv6</p>
      </div>
      <div className="headerLegend" style={{ backgroundColor: "#aa6699" }} hidden={!props.protocols.includes("udp")}>
        <p>UDP</p>
      </div>
      <div className="headerLegend" style={{ backgroundColor: "#6699aa" }} hidden={!props.protocols.includes("tcp")}>
        <p>TCP</p>
      </div>

      <h3 className="text-lg m-1">Fields</h3>
      <div className="space-x-2">
        <ByteEdit
          byte={-1}
          state={ByteFieldState.NORMAL}
          backgroundColor=""
          dataChanged={() => {}}
          input_id="dummy-byteedit-00"
        />
        <span className="font-bold">May edit</span>
      </div>
      <div className="space-x-2" hidden={!props.enableDelta}>
        <ByteEdit
          byte={-1}
          state={ByteFieldState.HIGHLIGHTED}
          backgroundColor=""
          dataChanged={() => {}}
          input_id="dummy-byteedit-01"
        />
        <span className="font-bold">Must edit</span>
      </div>
      <div className="space-x-2">
        <ByteEdit
          byte={-1}
          state={ByteFieldState.DISABLED}
          backgroundColor=""
          dataChanged={() => {}}
          input_id="dummy-byteedit-02"
        />
        <span className="font-bold">Mustn't edit</span>
      </div>
    </div>
  );
}
