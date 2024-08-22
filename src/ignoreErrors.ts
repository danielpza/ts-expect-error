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

export function ignoreErrors(diagnostics: Diagnostic<ts.Diagnostic>[]) {
  let carry = 0;
  let previousLineNumber: number | undefined;
  for (const diagnostic of diagnostics) {
    const file = diagnostic.getSourceFile();
    let start = diagnostic.getStart();
    if (!file) throw new Error("Expected diagnostic to have a source file");
    if (!start) throw new Error("Expected diagnostic to have a start position");

    let node = file.getChildAtPos(start);
    if (!node) throw new Error("Expected diagnostic to have a node");

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
}
