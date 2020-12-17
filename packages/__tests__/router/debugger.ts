class Test {
  public constructor(public id: string) {}
}

function main() {
  const t = new Test('testing');
  console.log('Test', t.id);
}
