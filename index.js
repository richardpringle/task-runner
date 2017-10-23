'use strict';

class TaskRunner {
  /**
   * the TaskRunner class executes an iterable of functions in-order,
   * passing the next function as the callback of function in execution
   * @param  {iterable} fns
   * @param  {Function} cb callback to run at completion
   * @return {TaskRunner.prototype}
   */
  constructor(fns, cb) {
    if (typeof fns !== 'object' || !fns[Symbol.iterator]) {
      throw new Error('TaskRunner must be instantiated with an iterable');
    }

    if (typeof cb !== 'function') {
      throw new Error('TaskRunner must be instantiated with a callback');
    }

    this.fns = fns;
    this.cb = cb;
    this.iterator = fns[Symbol.iterator]();
    this.iterator.next(); // init
  };

  /**
   * When called, executes the next function in the queue
   * @param  {Error}    err
   */
  next(err) {
    if (err) return this.cb(err);

    let current = this.iterator.next();
    if (current.done) return this.cb();

    let next = this.next.bind(this);
    return current.value.call(this, next);
  };

  /**
   * execute the tasks in the task-runner
   */
  exec() {
    this.fns[0].call(this, this.next.bind(this));
  }

  /**
   * only call the callback once, no matter how many times callOnce is called
   * @param  {Number}   idx amount of times callOnce is called before calling the callback
   * @param  {Object}  [options]
   * @param  {Function} cb
   * @return {Function}
   */
  static callOnce(idx, options, cb) {
    if (typeof options === 'function') {
      cb = options;
      options = {};
    }

    let ctx = callOnceGenerator(idx, options, cb);
    let done = ctx.next.bind(ctx);
    done(); // init
    return done;
  }
}

module.exports = TaskRunner;

function * callOnceGenerator(idx, options, cb) {
  if (options.accumulateErrors) {
    const errors = [];

    while (idx--) {
      let err = yield;
      if (err) errors.push(err);
    }

    return cb(errors);
  }

  while (--idx) {
    let err = yield;
    if (err) return cb(err);
  }

  cb(yield);
};
