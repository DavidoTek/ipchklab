import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function AboutDialog(props: { versionName: string; repoUrl: string }) {
  return (
    <Dialog>
      <DialogTrigger>
        <u>About</u>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Internet Checksum Lab</DialogTitle>
          <DialogDescription>
            Internet Checksum Lab is an educational web application. It calculates the checksum of a single packet, as
            well as the checksum delta between two packets. It can be used for educational purposes, such as teaching
            how checksums work in computer networks, as well as for debugging and testing purposes when developing
            network applications.
            <br />
            <br />
            Checksum delta is the amount by which the checksum of a packet changes when fields are modified.
            <br />
            <br />
            Developed for the Networks and Communication Systems Group at the University of Duisburg-Essen, Germany in
            2024.
            <br />
            <br />
            MIT licensed - Source Code:{" "}
            <a className="underline text-blue-500" href={props.repoUrl} target="_blank">
              {props.repoUrl}
            </a>
            <p className="text-xs pt-1">Build: {props.versionName}</p>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
