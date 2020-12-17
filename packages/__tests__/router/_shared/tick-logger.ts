export function startTickLogging(window: Window, callback: (tick: number) => void): () => void {
  const nextTickMessageName = 'nextTick';

  let tick = 0;

  const handleTick = (event: MessageEvent) => {
    console.log(nextTickMessageName, tick);
    if (event !== null && event.source === window && event.data === nextTickMessageName) {
      event.stopPropagation();
      callback(tick++);
      window.postMessage(nextTickMessageName, '*');
    }
  };

  window.addEventListener('message', handleTick, false);

  window.postMessage(nextTickMessageName, '*');

  // let doTick = true;
  // let promiseTick = 0;
  // const handlePromiseTick = (tick: number) => {
  //   console.log('promise tick', promiseTick++);

  //   if (doTick) {
  //     Promise.resolve(promiseTick).then(handlePromiseTick).catch(err => { throw err; });
  //   }
  // };

  // Promise.resolve(promiseTick).then(handlePromiseTick).catch(err => { throw err; });

  return () => {
    window.removeEventListener('message', handleTick, false);
    // doTick = false;
  };
}
