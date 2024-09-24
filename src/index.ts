import path from "node:path";

import { globby } from "globby";
import { Project } from "ts-morph";

import { ignoreErrors } from "./ignoreErrors.js";
import { removeIgnoreErrors } from "./removeIgnoreErrors.js";
import { orap } from "./helpers.js";

export async function run({
  entry = ["."],
  removeCurrentChecks = false,
  cwd = process.cwd(),
}: { entry?: string[]; removeCurrentChecks?: boolean; cwd?: string } = {}) {
  // TODO only glob files if entry is a directory, otherwise use files from the tsconfig.json
  const files = await globby(entry, {
    expandDirectories: {
      extensions: ["ts", "tsx"],
    },
    cwd,
    gitignore: true,
    ignore: ["node_modules/"],
  });

  const project = await orap(
    async () =>
      new Project({ tsConfigFilePath: path.resolve(cwd, "tsconfig.json") }),
    { text: "Loading Project" },
  );

  if (removeCurrentChecks)
    await orap(
      async () =>
        removeIgnoreErrors(
          files
            .map((file) => project.getSourceFile(path.resolve(cwd, file)))
            .filter((file) => !!file),
        ),
      { text: "Removing previous @ts-expect-error comments" },
    );

  const diagnostics = await orap(
    async () =>
      project.getPreEmitDiagnostics().filter((diagnostic) => {
        const filePath = diagnostic.getSourceFile()?.getFilePath();
        if (!filePath) throw new Error("Expected file path");
        return files.includes(path.relative(cwd, filePath));
      }),
    {
      text: "Getting Diagnostics",
    },
  );

  console.log(`Found ${diagnostics.length} diagnostics`);

  await orap(async () => ignoreErrors(diagnostics), {
    text: "Ignoring Errors",
  });

  await orap(() => project.save(), { text: "Saving Changes" });
}
