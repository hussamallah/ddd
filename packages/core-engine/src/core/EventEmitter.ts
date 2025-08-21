import { IEventEmitter } from '../types';

export default class EventEmitter implements IEventEmitter {
  private events: Map<string, Function[]> = new Map();

  public on(event: string, listener: Function): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(listener);
  }

  public off(event: string, listener: Function): void {
    if (!this.events.has(event)) {
      return;
    }

    const listeners = this.events.get(event)!;
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }

    // Remove the event if no listeners remain
    if (listeners.length === 0) {
      this.events.delete(event);
    }
  }

  public emit(event: string, ...args: any[]): void {
    if (!this.events.has(event)) {
      return;
    }

    const listeners = this.events.get(event)!;
    listeners.forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  public once(event: string, listener: Function): void {
    const onceWrapper = (...args: any[]) => {
      listener(...args);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }

  public removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  public listenerCount(event: string): number {
    return this.events.get(event)?.length || 0;
  }

  public eventNames(): string[] {
    return Array.from(this.events.keys());
  }
}
