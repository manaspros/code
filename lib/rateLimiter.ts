/**
 * Rate limiter for API calls
 * Ensures we don't exceed API rate limits
 */

class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private requestsPerMinute: number;
  private delayBetweenRequests: number;

  constructor(requestsPerMinute: number = 30) {
    this.requestsPerMinute = requestsPerMinute;
    // Calculate delay in ms: 60000ms / requests per minute
    this.delayBetweenRequests = Math.ceil(60000 / requestsPerMinute);
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const task = this.queue.shift();

    if (task) {
      await task();
      // Wait before processing next request
      await this.delay(this.delayBetweenRequests);
    }

    // Process next item
    this.processQueue();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getQueueLength(): number {
    return this.queue.length;
  }
}

// Create a global rate limiter for Gemini API calls
// Using 28 RPM to be safe (gemini-2.0-flash-lite has 30 RPM limit, leaving small buffer)
export const geminiRateLimiter = new RateLimiter(28);
