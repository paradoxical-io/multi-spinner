import { spinners } from "./spinner";
import * as logUpdate from "log-update";
import chalk from "chalk";
import * as os from "os";

/**
 * An instance of a progress handler
 */
export class MultiProgressInstance {
  private stopped = false;
  private success = false;
  private tick = 0;
  private _completionMessage: string = "";
  get completionMessage(): string {
    return this._completionMessage;
  }

  /**
   *
   * @param message The message to display
   * @param frames Optional array of strings to use as the frames
   * @param format A custom formatter to display instead of the default
   */
  constructor(
    readonly message: string,
    readonly frames: string[] = spinners.dots7.frames,
    readonly format:
      | ((x: MultiProgressInstance) => string)
      | undefined = undefined
  ) {}

  /**
   * Stops this handler, if success is false marks as an error
   * @param success
   * @param completionMessage Option message to show on completion
   */
  stop(success = true, completionMessage?: string) {
    this._completionMessage = completionMessage
      ? completionMessage
      : success
      ? "OK"
      : "ERROR";
    this.success = success;
    this.stopped = true;
  }

  /**
   * Attaches this progress handler as a watcher onto the promise
   *
   * @param p
   * @param completionMessage Option message to show on completion
   */
  attachTo<T>(
    p: Promise<T>,
    completionMessage?: string
  ): MultiProgressInstance {
    p.then(x => this.stop(true, completionMessage)).catch(x =>
      this.stop(false, completionMessage)
    );
    return this;
  }

  /**
   * Whether or not this instance is stopped and if so is it a success
   */
  isStopped(): { success: boolean } | undefined {
    if (!this.stopped) {
      return undefined;
    }

    return { success: this.success };
  }

  /**
   * Consume and return the next frame
   */
  nextFrame(): string {
    const frame = this.frames[this.tick];
    this.tick = (this.tick + 1) % this.frames.length;
    return frame;
  }
}

/**
 * A multi progress container
 */
export class MultiProgress {
  private timeoutCallback?: NodeJS.Timeout;
  private logger = logUpdate.create(process.stdout);
  private instances: MultiProgressInstance[] = [];
  constructor() {}

  /**
   * Adds a progress handler to the instance list
   * @param instance
   */
  addProgress(instance: MultiProgressInstance) {
    this.instances.push(instance);
  }

  /**
   * Once started renders progress at the interval
   */
  start(intervalMS = 100) {
    this.timeoutCallback = setInterval(this.render, intervalMS);
  }

  /**
   * Stops rendering
   */
  stop() {
    if (this.timeoutCallback) {
      clearInterval(this.timeoutCallback);
    }

    this.render();
  }

  private render = () => {
    if (this.instances.length === 0) {
      return;
    }

    const data = this.instances
      .map(i => {
        const method = i.format || this.format;
        return method(i);
      })
      .join(os.EOL);

    this.logger(data);
  };

  private format(instance: MultiProgressInstance) {
    const state = instance.isStopped();

    if (state) {
      return `${instance.message}: ${
        state.success
          ? chalk.green(instance.completionMessage)
          : chalk.red(instance.completionMessage)
      }`;
    } else {
      return `${instance.message} ${instance.nextFrame()}`;
    }
  }
}
