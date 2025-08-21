import { IModule, ModuleConfig, ModuleStatus } from '../types';
import { Logger } from '../utils/Logger';

export default abstract class Module implements IModule {
  public readonly id: string;
  public readonly name: string;
  public readonly version: string;
  protected status: ModuleStatus = ModuleStatus.UNINITIALIZED;
  protected logger: Logger;
  protected config: Record<string, any>;

  constructor(config: ModuleConfig) {
    this.id = config.id;
    this.name = config.name;
    this.version = config.version;
    this.config = config.config || {};
    this.logger = new Logger({ name: `${this.name}(${this.id})` });
  }

  public async initialize(): Promise<void> {
    if (this.status !== ModuleStatus.UNINITIALIZED) {
      throw new Error(`Module ${this.id} cannot be initialized from status: ${this.status}`);
    }

    this.status = ModuleStatus.INITIALIZING;
    this.logger.info(`Initializing module ${this.name} v${this.version}`);

    try {
      await this.onInitialize();
      this.status = ModuleStatus.RUNNING;
      this.logger.info(`Module ${this.name} initialized successfully`);
    } catch (error) {
      this.status = ModuleStatus.ERROR;
      this.logger.error(`Failed to initialize module ${this.name}:`, error);
      throw error;
    }
  }

  public async destroy(): Promise<void> {
    if (this.status === ModuleStatus.UNINITIALIZED) {
      return; // Already destroyed or never initialized
    }

    this.logger.info(`Destroying module ${this.name}`);

    try {
      await this.onDestroy();
      this.status = ModuleStatus.UNINITIALIZED;
      this.logger.info(`Module ${this.name} destroyed successfully`);
    } catch (error) {
      this.logger.error(`Failed to destroy module ${this.name}:`, error);
      throw error;
    }
  }

  public getStatus(): ModuleStatus {
    return this.status;
  }

  public getConfig(): Record<string, any> {
    return { ...this.config };
  }

  public setConfig(key: string, value: any): void {
    this.config[key] = value;
    this.logger.debug(`Configuration updated: ${key} = ${value}`);
  }

  // Abstract methods that must be implemented by subclasses
  protected abstract onInitialize(): Promise<void>;
  protected abstract onDestroy(): Promise<void>;

  // Optional lifecycle hooks
  protected async onStart(): Promise<void> {
    // Override in subclasses if needed
  }

  protected async onStop(): Promise<void> {
    // Override in subclasses if needed
  }

  protected async onError(error: Error): Promise<void> {
    this.logger.error(`Module ${this.name} encountered an error:`, error);
    this.status = ModuleStatus.ERROR;
  }
}
