import { ILogger } from '../types';

interface LoggerConfig {
  name: string;
  debug?: boolean;
  level?: 'debug' | 'info' | 'warn' | 'error';
}

export default class Logger implements ILogger {
  private name: string;
  private debug: boolean;
  private level: string;

  constructor(config: LoggerConfig) {
    this.name = config.name;
    this.debug = config.debug || false;
    this.level = config.level || 'info';
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(level: string, message: string, args: any[]): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.name}]`;
    const formattedArgs = args.length > 0 ? args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ') : '';
    
    return `${prefix} ${message} ${formattedArgs}`.trim();
  }

  public info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, args));
    }
  }

  public warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, args));
    }
  }

  public error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, args));
    }
  }

  public debug(message: string, ...args: any[]): void {
    if (this.debug && this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, args));
    }
  }

  public setLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.level = level;
  }

  public setDebug(enabled: boolean): void {
    this.debug = enabled;
  }

  public getConfig(): LoggerConfig {
    return {
      name: this.name,
      debug: this.debug,
      level: this.level as any
    };
  }
}
