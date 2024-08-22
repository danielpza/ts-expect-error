import { run } from "./index.js";

const [, , entry] = process.argv;

await run({ entry });
