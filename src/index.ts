import path from "node:path";

import { formatDistanceStrict } from "date-fns";
import { globby } from "globby";
import { oraPromise } from "ora";
import { Project, type SourceFile } from "ts-morph";

import { ignoreErrors } from "./ignoreErrors.js";

function removeIgnoreErrors(files: SourceFile[]) {
  for (const file of files) {
    file.replaceWithText(
      file
        .getText()
        .replaceAll(/\n( |\t)+\/\/ @ts-expect-error.*/g, "")
        .replaceAll(/\/\/ @ts-expect-error.*/g, "")
        .replaceAll(/\/\* @ts-expect-error.*\*\//g, ""),
    );
  }
}

async function orap<T>(
  fn: () => Promise<T>,
  { text }: { text: string },
): Promise<T> {
  const startTime = Date.now();
  return oraPromise(fn, {
    text,
    successText: () =>
      `${text}. Took ${formatDistanceStrict(startTime, Date.now())}`,
  });
}

export async function run({
  entry = ["."],
  removeCurrentChecks = false,
  cwd = process.cwd(),
}: { entry?: string[]; removeCurrentChecks?: boolean; cwd?: string } = {}) {
  // TODO only glob files if entry is a directory, otherwise use files from the tsconfig.json
  const files = await globby(entry, {
    expandDirectories: {
      extensions: ["ts"],
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
