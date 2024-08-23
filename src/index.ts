import { readFile, writeFile } from "node:fs/promises";
import { formatDistanceStrict } from "date-fns";
import { globby } from "globby";
import { oraPromise } from "ora";
import { Project } from "ts-morph";
import { ignoreErrors } from "./ignoreErrors.js";

async function removeIgnoreErrors(files: string[]) {
  for (const file of files) {
    const content = (await readFile(file, "utf-8")).toString();
    const newContent = content
      // .replaceAll(/\n\s+\/\/ @ts-expect-error .*\n/g, "\n")
      .replaceAll(/\/\/ @ts-expect-error.*/g, "")
      .replaceAll(/\/\* @ts-expect-error.*\*\//g, "");
    await writeFile(file, newContent);
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

export async function run({ entry = "." }: { entry?: string } = {}) {
  // TODO only glob files if entry is a directory, otherwise use files from the tsconfig.json
  const files = await globby(entry, {
    expandDirectories: {
      extensions: ["ts"],
    },
    gitignore: true,
  });

  await orap(async () => removeIgnoreErrors(files), {
    text: "Removing previous @ts-expect-error comments",
  });

  const project = await orap(
    async () => {
      const project = new Project({
        tsConfigFilePath: "tsconfig.json",
        // skipAddingFilesFromTsConfig: true,
      });
      // project.addSourceFilesAtPaths(files);
      return project;
    },
    { text: "Loading Project" },
  );

  const diagnostics = await orap(
    async () =>
      project
        .getPreEmitDiagnostics()
        .filter((diagnostic) =>
          files.includes(diagnostic.getSourceFile()?.getBaseName() ?? ""),
        ),
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
