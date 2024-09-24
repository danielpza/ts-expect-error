import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";

import { Project } from "ts-morph";

import { ignoreErrors } from "./ignoreErrors";

test("should work", (t) => {
  const PROJECT_ROOT = path.resolve(
    import.meta.dirname,
    "__fixtures__/sample-project",
  );

  const project = new Project({
    tsConfigFilePath: path.resolve(PROJECT_ROOT, "tsconfig.json"),
  });

  const diagnostics = project.getPreEmitDiagnostics();
  ignoreErrors(diagnostics);

  const sourceFile = project.getSourceFile("index.ts");
  assert(sourceFile, "File should exist");
  assert.equal(
    sourceFile.getText(),
    `\
let a = 10;

// @ts-expect-error TS(2322) FIXME: Type 'string' is not assignable to type 'number'.
a = "foo";

// @ts-expect-error TS(2322) FIXME: Type 'string' is not assignable to type 'number'.
const b: number = "foo";

// multiple errors in the same line
// @ts-expect-error TS(2588) FIXME: Cannot assign to 'b' because it is a constant.
b = "foo"; b = 'bar';
`,
  );
  const file2 = project.getSourceFile("file-2.ts");
  assert(file2);
  assert.equal(
    file2.getText(),
    // FIXME it's removing the first comment
    `\
let a = 10;

// @ts-expect-error TS(2322) FIXME: Type 'string' is not assignable to type 'number'.
a = "foo";
`,
  );
});

test("tsx", (t) => {
  const PROJECT_ROOT = path.resolve(
    import.meta.dirname,
    "__fixtures__/sample-project-react",
  );

  const project = new Project({
    tsConfigFilePath: path.resolve(PROJECT_ROOT, "tsconfig.json"),
  });

  const diagnostics = project.getPreEmitDiagnostics();
  ignoreErrors(diagnostics);

  const sourceFile = project.getSourceFile("index.tsx");
  assert(sourceFile, "File should exist");
  assert.equal(
    sourceFile.getText(),
    `\
function Component() {
  const doc = "foo"

// @ts-expect-error TS(2339) FIXME: Property 'foo' does not exist on type '"foo"'.
  doc.foo

  return <>
{/* @ts-expect-error TS(2304) FIXME: Cannot find name 'Foo'. */}
    <Foo bar={bas} />
{/* @ts-expect-error TS(2339) FIXME: Property 'foo' does not exist on type '"foo"'. */}
    {doc.foo}
  </>;
}

export default Component
`,
  );
});
