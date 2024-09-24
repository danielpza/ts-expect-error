function Component() {
  const doc = "foo"

  doc.foo

  return <>
    <Foo bar={bas} />
    {doc.foo}
  </>;
}

export default Component
