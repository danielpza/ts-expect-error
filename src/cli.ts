import { parseArgs } from "node:util";

import pkgJson from "../package.json";
import { run } from "./index.js";

const [, , ...args] = process.argv;

const options = parseArgs({
  args,
  allowPositionals: true,
  options: {
    "remove-current-checks": {
      type: "boolean",
      short: "r",
    },
    version: {
      type: "boolean",
      short: "v",
    },
    help: {
      type: "boolean",
      short: "h",
    },
  },
});

const {
  positionals: [entry],
  values: { "remove-current-checks": removeCurrentChecks, help, version },
} = options;

if (help) {
  console.log(`\
ts-expect-error <glob> [...options]

options
  -h, --help                   Show this help message.
  -v, --version                Display package version.
  -r, --remove-current-checks  Remove previously placed @ts-expect-error directives.
`);
  process.exit(0);
}

if (version) {
  console.log(pkgJson.version);
  process.exit(0);
}

await run({ entry, removeCurrentChecks });
