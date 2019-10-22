import { MultiProgress } from "../lib/progress";
import { MultiProgressInstance } from "../lib/progress";
import { randomSpinner } from "../lib/spinner";

(async () => {
  const progress = new MultiProgress();

  const test = (time: number) => {
    const promise = new Promise(r => setTimeout(r, time * 1000));

    const instance = new MultiProgressInstance(
      time.toString(),
      randomSpinner().frames
    ).attachTo(promise);

    setTimeout(() => progress.addProgress(instance), time * 250);

    return promise;
  };

  progress.start();

  await Promise.all(new Array(20).fill(0).map((x, i) => test(i)));

  progress.stop();
})();
