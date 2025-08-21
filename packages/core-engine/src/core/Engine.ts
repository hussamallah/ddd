import { IEngine, IModule, EngineConfig, ModuleStatus } from '../types';
import { EventEmitter } from './EventEmitter';
import { Logger } from '../utils/Logger';

export default class Engine implements IEngine {
  public modules: Map<string, IModule> = new Map();
  private eventEmitter: EventEmitter;
  private logger: Logger;
  private config: EngineConfig;
  private isRunning: boolean = false;

  constructor(config: EngineConfig) {
    this.config = config;
    this.eventEmitter = new EventEmitter();
    this.logger = new Logger({ name: config.name, debug: config.debug });
    
    // Register initial modules if provided
    if (config.modules) {
      config.modules.forEach(module => this.registerModule(module));
    }
  }

  public registerModule(module: IModule): void {
    if (this.modules.has(module.id)) {
      this.logger.warn(`Module ${module.id} is already registered`);
      return;
    }

    this.modules.set(module.id, module);
    this.logger.info(`Module ${module.id} registered successfully`);
    this.eventEmitter.emit('module:registered', module);
  }

  public unregisterModule(moduleId: string): void {
    const module = this.modules.get(moduleId);
    if (!module) {
      this.logger.warn(`Module ${moduleId} not found`);
      return;
    }

    if (this.isRunning) {
      this.logger.warn(`Cannot unregister module ${moduleId} while engine is running`);
      return;
    }

    this.modules.delete(moduleId);
    this.logger.info(`Module ${moduleId} unregistered successfully`);
    this.eventEmitter.emit('module:unregistered', moduleId);
  }

  public getModule(moduleId: string): IModule | undefined {
    return this.modules.get(moduleId);
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Engine is already running');
      return;
    }

    this.logger.info(`Starting engine ${this.config.name} v${this.config.version}`);
    this.isRunning = true;

    try {
      // Initialize all modules
      for (const [moduleId, module] of this.modules) {
        this.logger.info(`Initializing module: ${moduleId}`);
        await module.initialize();
        this.logger.info(`Module ${moduleId} initialized successfully`);
      }

      this.logger.info('Engine started successfully');
      this.eventEmitter.emit('engine:started');
    } catch (error) {
      this.logger.error('Failed to start engine:', error);
      this.isRunning = false;
      throw error;
    }
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Engine is not running');
      return;
    }

    this.logger.info('Stopping engine');
    this.isRunning = false;

    try {
      // Destroy all modules in reverse order
      const moduleArray = Array.from(this.modules.entries()).reverse();
      for (const [moduleId, module] of moduleArray) {
        this.logger.info(`Destroying module: ${moduleId}`);
        await module.destroy();
        this.logger.info(`Module ${moduleId} destroyed successfully`);
      }

      this.logger.info('Engine stopped successfully');
      this.eventEmitter.emit('engine:stopped');
    } catch (error) {
      this.logger.error('Failed to stop engine:', error);
      throw error;
    }
  }

  public getStatus(): { running: boolean; moduleCount: number; modules: Record<string, ModuleStatus> } {
    const modules: Record<string, ModuleStatus> = {};
    for (const [moduleId, module] of this.modules) {
      modules[moduleId] = module.getStatus();
    }

    return {
      running: this.isRunning,
      moduleCount: this.modules.size,
      modules
    };
  }

  public on(event: string, listener: Function): void {
    this.eventEmitter.on(event, listener);
  }

  public off(event: string, listener: Function): void {
    this.eventEmitter.off(event, listener);
  }
}
