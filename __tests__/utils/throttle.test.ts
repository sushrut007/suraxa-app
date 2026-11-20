import { throttle } from '../../src/utils/throttle';

describe('Throttle Utility', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('invokes the function immediately on the first call (leading edge)', () => {
    const callback = jest.fn();
    const throttled = throttle(callback, 150);

    throttled(10);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(10);
  });

  it('throttles rapid consecutive calls to at most once per 150 ms', () => {
    const callback = jest.fn();
    const throttled = throttle(callback, 150);

    throttled(1);
    throttled(2);
    throttled(3);

    // Only the first call executed immediately
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(1);

    // Advance 100 ms (still inside throttle window)
    jest.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(1);

    // Advance remaining 50 ms to hit 150 ms
    jest.advanceTimersByTime(50);
    expect(callback).toHaveBeenCalledTimes(2);
    // Crucial requirement: guaranteed trailing call with the final value on release!
    expect(callback).toHaveBeenLastCalledWith(3);
  });

  it('always sends the final value on release', () => {
    const callback = jest.fn();
    const throttled = throttle(callback, 150);

    throttled('first');
    throttled('second');
    throttled('final-released-value');

    jest.advanceTimersByTime(150);
    expect(callback).toHaveBeenLastCalledWith('final-released-value');
  });

  it('cancels pending trailing invocation when cancel() is called', () => {
    const callback = jest.fn();
    const throttled = throttle(callback, 150);

    throttled(1);
    throttled(2);
    expect(callback).toHaveBeenCalledTimes(1);

    throttled.cancel();
    jest.advanceTimersByTime(200);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('immediately executes pending trailing invocation when flush() is called', () => {
    const callback = jest.fn();
    const throttled = throttle(callback, 150);

    throttled('initial');
    throttled('flushed-value');
    expect(callback).toHaveBeenCalledTimes(1);

    throttled.flush();
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenLastCalledWith('flushed-value');
  });
});
