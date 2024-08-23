import type { Diagnostic, ts } from "ts-morph";

function getIgnoreComment(diagnostic: Diagnostic<ts.Diagnostic>) {
  const tsErrorCode = diagnostic.getCode();
  const prefix = "FIXME";

  let errorMessage = diagnostic.getMessageText();
  if (typeof errorMessage !== "string") {
    errorMessage = errorMessage.getMessageText();
  }
  errorMessage = errorMessage.split("\n")[0];

  return `// @ts-expect-error TS(${tsErrorCode}) ${prefix}: ${errorMessage}\n`;
}

// Object.groupBy "polyfill"
function groupBy<T>(
  array: T[],
  getKey: (item: T) => string,
): Record<string, T[]> {
  let result: Record<string, T[]> = {};
  for (const item of array) {
    const key = getKey(item);
    result[key] ??= [];
    result[key].push(item);
  }
  return result;
}

export function ignoreErrors(diagnostics: Diagnostic<ts.Diagnostic>[]) {
  const groupByFile = groupBy(diagnostics, (diagnostic) => {
    const name = diagnostic.getSourceFile()?.getFilePath();
    if (name === undefined) throw new Error("Expected file name");
    return name;
  });
  for (const [fileName, fileDiagnostics] of Object.entries(groupByFile)) {
    let carry = 0;
    let previousLineNumber: number | undefined;
    try {
      for (const diagnostic of fileDiagnostics) {
        const file = diagnostic.getSourceFile();
        let start = diagnostic.getStart();
        if (file === undefined)
          throw new Error("Expected diagnostic to have a source file");
        if (start === undefined)
          throw new Error("Expected diagnostic to have a start position");

        let node = file.getChildAtPos(start);
        if (node === undefined)
          throw new Error("Expected diagnostic to have a node");

        const ignoreComment = getIgnoreComment(diagnostic);

        start += carry;

        const line = file.getLineAndColumnAtPos(start).line;
        if (line === previousLineNumber) continue;
        previousLineNumber = line + 1;

        file.insertText(
          start - file.getLengthFromLineStartAtPos(start),
          ignoreComment,
        );

        carry += ignoreComment.length;
      }
    } catch (error) {
      throw new Error(`Error processing ${fileName}`, { cause: error });
    }
  }
}
