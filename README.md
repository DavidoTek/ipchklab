# Internet Checksum Lab

Internet Checksum Lab is an educational web application built with open source technology like [React](https://react.dev/), [Vite](https://vitejs.dev/) and [shadcn/ui](https://ui.shadcn.com/).

It calculates the checksum of a single packet and the checksum delta between two packets. It can be used for educational purposes, such as teaching how checksums work in computer networks, as well as for debugging and testing purposes when developing network applications.

Developed for the [Networks and Communication Systems Group](https://www.ncs.wiwi.uni-due.de/) at the University of Duisburg-Essen, Germany in 2024.

## Running & Building

Requirements: Node, yarn

- Install dependencies: `yarn`
- Start the development server: `yarn dev`
- Run tests: `yarn test`
- Show test coverage: `yarn coverage`
- Release: `yarn build`
- List dependency licenses: `yarn licenses list`

## Features

### Calculating Checksums

Internet Checksum Lab allows calculating the checksums for whole packets with different protocols like IPv4, IPv6, UDP and TCP. The application thereby provides a dynamic user interface which automatically detects when a packet is complete or when data is changed and automatically recalculates the checksums.

### Calculating Deltas

In addition to the standalone checksum calculations, the application also provides a mode to calculate the checksum deltas between two packets. This mode can be handy when it comes to verifying whether a network application is properly updating checksums of modified packets. It is enough to enter partial packets and the application will automatically calculate by which value the checksum will change.

### Educational Mode & URL Parameters

Internet Checksum Lab offers an educational mode where the calculated checksums are not immediately displayed. Instead, it enables users to calculate the checksums themselves and verify them by entering them into a designated text field.

While it is possible to manually activate the educational mode and enter packets, in most cases, it is more sensible to provide a packet using URL parameters and let the user only solve the checksum. The following list of URL parameters are supported by Internet Checksum Lab:

| URL Parameter | Description                                                    | Example              |
| ------------- | -------------------------------------------------------------- | -------------------- |
| **protocols** | The protocol for the packets                                   | `protocols=ipv4_udp` |
| **plsize**    | The payload size in bytes                                      | `plsize=12`          |
| **endelta**   | Enable the delta mode                                          | `endelta=true`       |
| **edumode**   | Enable the educational mode                                    | `edumode=true`       |
| **lockui**    | Prevent the user from changing options the like protocols etc. | `lockui=true`        |
| **lockedit**  | Prevent the user from editing the packet data                  | `lockedit=true`      |
| **pkgone**    | Packet data for the left packet (`__` for an empty field)      | `pkgone=ABCD__34`    |
| **pkgtwo**    | Packet data for the right packet                               | `pkgtwo=DEADBEEF`    |
