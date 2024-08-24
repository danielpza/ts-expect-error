import { formatDistanceStrict } from "date-fns";
import { oraPromise } from "ora";

export async function orap<T>(
  fn: () => Promise<T>,
  { text }: { text: string },
): Promise<T> {
  const startTime = Date.now();
  return oraPromise(fn, {
    text,
    successText: () =>
      `${text}. Took ${formatDistanceStrict(startTime, Date.now())}`,
  });
}
