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
  },
});

const {
  positionals: [entry],
  values: { "remove-current-checks": removeCurrentChecks },
} = options;

await run({ entry, removeCurrentChecks });
