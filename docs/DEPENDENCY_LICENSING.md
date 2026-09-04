# Dependency licensing review

Run `npm run licenses`. The generated inventory records all locked dependency entries, versions, license expressions, development/production scope, commercial compatibility conditions, notice paths, and notice hashes for installed packages. Optional packages for other platforms are reviewed from lockfile license metadata and explicitly marked. THIRD_PARTY_NOTICES.txt retains installed upstream notices. Regenerate on each deployment platform to collect that platform's binary notices. The package lock pins the full dependency graph.

Phase A commercial activation remains prohibited regardless of dependency licenses. This review is an engineering inventory of the current unmodified dependency usage; it is not commercial launch approval.

- MIT, MIT-0, ISC, Apache-2.0, BSD, 0BSD, Unlicense, and the enumerated permissive combinations: retain required notices; Apache patent/NOTICE obligations apply.
- node-forge's `(BSD-3-Clause OR GPL-2.0)` uses the BSD option; this project does not select GPL.
- lightningcss and its native packages: MPL-2.0 file-level copyleft. No upstream files are modified. Preserve notices and covered-source access when distributing binaries; Formation Zero source files are separate. [Mozilla's official FAQ](https://www.mozilla.org/en-US/MPL/2.0/FAQ/) explains the distinction.
- Next.js pulls sharp/native libvips packages under combined Apache/MIT/LGPL expressions. They remain unmodified server/build dependencies, are not imported into mobile or browser code, and no images or image processing feature is implemented. Server operation does not distribute these binaries to visitors. Before distributing a server/container or native binary that includes them, retain corresponding sources/notices and satisfy replacement/relinking requirements under the [LGPL](https://www.gnu.org/licenses/lgpl-3.0.html). See [sharp installation documentation](https://sharp.pixelplumbing.com/install/). The current foundation has no binary distribution or commercial deployment.
- Embedded PostgreSQL is local/test tooling: wrapper MIT, packaged binaries Apache-2.0 packaging plus PostgreSQL and included dependency notices. Production uses independently provisioned PostgreSQL. Preserve upstream binary distribution notices if redistributing local tooling.

The license checker rejects unreviewed license expressions rather than accepting arbitrary packages. License compatibility does not approve fitness content, media, brand use, or government material. UNKNOWN content rights remain non-publishable.

Security overrides: `tsup → esbuild 0.28.2` fixes GHSA-g7r4-m6w7-qqqr; `xcode → uuid 11.1.1` fixes GHSA-w5hq-g745-h8pq. xcode uses the CommonJS `uuid.v4` API retained by 11.1.1. React Native is overridden to 0.86.3 consistently with Expo SDK 57 to prevent incompatible duplicate peer resolutions. Native prebuild, doctor and exports validate these choices; revisit them when upstream updates.
