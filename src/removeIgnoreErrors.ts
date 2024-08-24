import type { SourceFile } from "ts-morph";

export function removeIgnoreErrors(files: SourceFile[]) {
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
