import { ModeToggle } from "@/components/mode-toggle";
import AboutDialog from "@/components/HeaderBar/AboutDialog";

export default function HeaderBar(props: { versionName: string; repoUrl: string }) {
  return (
    <div className="bg-accent h-12 flex items-center shadow-md">
      <img src="logo.svg" height={48} alt="Logo" className="logo" />
      <h2 className="text-xl md:text-2xl font-bold">Internet Checksum Lab</h2>

      <div className="flex ml-auto m-1 space-x-2">
        <AboutDialog {...props} />

        <ModeToggle />
      </div>
    </div>
  );
}
