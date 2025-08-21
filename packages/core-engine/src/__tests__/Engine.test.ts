import Engine from '../core/Engine'
import Module from '../core/Module'
import { ModuleStatus } from '../types'

// Test module implementation
class TestModule extends Module {
  public initialized = false
  public destroyed = false

  constructor() {
    super({
      id: 'test-module',
      name: 'Test Module',
      version: '1.0.0'
    })
  }

  protected async onInitialize(): Promise<void> {
    this.initialized = true
  }

  protected async onDestroy(): Promise<void> {
    this.destroyed = true
  }
}

describe('Engine', () => {
  let engine: Engine

  beforeEach(() => {
    engine = new Engine({
      name: 'Test Engine',
      version: '1.0.0',
      debug: false
    })
  })

  describe('constructor', () => {
    it('should create an engine with correct configuration', () => {
      expect(engine).toBeInstanceOf(Engine)
      expect(engine['name']).toBe('Test Engine')
      expect(engine['version']).toBe('1.0.0')
    })
  })

  describe('registerModule', () => {
    it('should register a module successfully', () => {
      const module = new TestModule()
      engine.registerModule(module)
      
      expect(engine.modules.has('test-module')).toBe(true)
      expect(engine.modules.get('test-module')).toBe(module)
    })

    it('should not register duplicate modules', () => {
      const module1 = new TestModule()
      const module2 = new TestModule()
      
      engine.registerModule(module1)
      engine.registerModule(module2)
      
      expect(engine.modules.size).toBe(1)
    })
  })

  describe('unregisterModule', () => {
    it('should unregister a module successfully', () => {
      const module = new TestModule()
      engine.registerModule(module)
      
      expect(engine.modules.has('test-module')).toBe(true)
      
      engine.unregisterModule('test-module')
      expect(engine.modules.has('test-module')).toBe(false)
    })

    it('should handle unregistering non-existent module', () => {
      expect(() => engine.unregisterModule('non-existent')).not.toThrow()
    })
  })

  describe('getModule', () => {
    it('should return registered module', () => {
      const module = new TestModule()
      engine.registerModule(module)
      
      const retrieved = engine.getModule('test-module')
      expect(retrieved).toBe(module)
    })

    it('should return undefined for non-existent module', () => {
      const retrieved = engine.getModule('non-existent')
      expect(retrieved).toBeUndefined()
    })
  })

  describe('start', () => {
    it('should start engine and initialize all modules', async () => {
      const module1 = new TestModule()
      const module2 = new TestModule()
      
      engine.registerModule(module1)
      engine.registerModule(module2)
      
      await engine.start()
      
      expect(module1.initialized).toBe(true)
      expect(module2.initialized).toBe(true)
      expect(module1.getStatus()).toBe(ModuleStatus.RUNNING)
      expect(module2.getStatus()).toBe(ModuleStatus.RUNNING)
    })

    it('should not start if already running', async () => {
      const module = new TestModule()
      engine.registerModule(module)
      
      await engine.start()
      await engine.start() // Second start should be ignored
      
      expect(module.initialized).toBe(true)
    })
  })

  describe('stop', () => {
    it('should stop engine and destroy all modules', async () => {
      const module1 = new TestModule()
      const module2 = new TestModule()
      
      engine.registerModule(module1)
      engine.registerModule(module2)
      
      await engine.start()
      await engine.stop()
      
      expect(module1.destroyed).toBe(true)
      expect(module2.destroyed).toBe(true)
    })

    it('should not stop if not running', async () => {
      const module = new TestModule()
      engine.registerModule(module)
      
      await engine.stop() // Should not throw
      expect(module.destroyed).toBe(false)
    })
  })

  describe('getStatus', () => {
    it('should return correct status when stopped', () => {
      const status = engine.getStatus()
      expect(status.running).toBe(false)
      expect(status.moduleCount).toBe(0)
      expect(status.modules).toEqual({})
    })

    it('should return correct status when running', async () => {
      const module = new TestModule()
      engine.registerModule(module)
      
      await engine.start()
      const status = engine.getStatus()
      
      expect(status.running).toBe(true)
      expect(status.moduleCount).toBe(1)
      expect(status.modules['test-module']).toBe(ModuleStatus.RUNNING)
    })
  })
})
