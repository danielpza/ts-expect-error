import { parseArgs } from "node:util";

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
    help: {
      type: "boolean",
      short: "h",
    },
  },
});

const {
  positionals: [entry],
  values: { "remove-current-checks": removeCurrentChecks, help },
} = options;

if (help) {
  console.log(`\
ts-expect-error <glob> [...options]

options
  -h, --help                   Show this help message.
  -r, --remove-current-checks  Remove previously placed @ts-expect-error directives.
`);
  process.exit(1);
}

await run({ entry, removeCurrentChecks });
