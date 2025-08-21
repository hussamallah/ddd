import { IValidator, ValidationResult } from '../types';

export default class Validator implements IValidator {
  public validate(data: any, schema: any): ValidationResult {
    const errors: string[] = [];
    
    try {
      this.validateSchema(data, schema, '', errors);
    } catch (error) {
      errors.push(`Validation error: ${error}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateSchema(data: any, schema: any, path: string, errors: string[]): void {
    if (schema === null || schema === undefined) {
      return;
    }

    if (typeof schema === 'function') {
      // Custom validation function
      try {
        const result = schema(data);
        if (result !== true) {
          errors.push(`${path}: ${result || 'Validation failed'}`);
        }
      } catch (error) {
        errors.push(`${path}: Validation function error: ${error}`);
      }
      return;
    }

    if (typeof schema === 'string') {
      // Type validation
      this.validateType(data, schema, path, errors);
      return;
    }

    if (Array.isArray(schema)) {
      // Array validation
      this.validateArray(data, schema, path, errors);
      return;
    }

    if (typeof schema === 'object') {
      // Object validation
      this.validateObject(data, schema, path, errors);
      return;
    }
  }

  private validateType(data: any, expectedType: string, path: string, errors: string[]): void {
    const actualType = Array.isArray(data) ? 'array' : typeof data;
    
    if (expectedType === 'any') {
      return;
    }

    if (expectedType === 'string' && typeof data !== 'string') {
      errors.push(`${path}: Expected string, got ${actualType}`);
    } else if (expectedType === 'number' && typeof data !== 'number') {
      errors.push(`${path}: Expected number, got ${actualType}`);
    } else if (expectedType === 'boolean' && typeof data !== 'boolean') {
      errors.push(`${path}: Expected boolean, got ${actualType}`);
    } else if (expectedType === 'object' && (typeof data !== 'object' || data === null || Array.isArray(data))) {
      errors.push(`${path}: Expected object, got ${actualType}`);
    } else if (expectedType === 'array' && !Array.isArray(data)) {
      errors.push(`${path}: Expected array, got ${actualType}`);
    }
  }

  private validateArray(data: any, schema: any[], path: string, errors: string[]): void {
    if (!Array.isArray(data)) {
      errors.push(`${path}: Expected array, got ${typeof data}`);
      return;
    }

    if (schema.length === 0) {
      return; // Empty schema means any array is valid
    }

    // Validate each item against the first schema in the array
    data.forEach((item, index) => {
      this.validateSchema(item, schema[0], `${path}[${index}]`, errors);
    });
  }

  private validateObject(data: any, schema: Record<string, any>, path: string, errors: string[]): void {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      errors.push(`${path}: Expected object, got ${typeof data}`);
      return;
    }

    // Check required fields
    for (const [key, value] of Object.entries(schema)) {
      if (key.startsWith('required_')) {
        const fieldName = key.substring(9);
        if (!(fieldName in data)) {
          errors.push(`${path}.${fieldName}: Required field missing`);
        }
        continue;
      }

      if (key.startsWith('optional_')) {
        const fieldName = key.substring(10);
        if (fieldName in data) {
          this.validateSchema(data[fieldName], value, `${path}.${fieldName}`, errors);
        }
        continue;
      }

      // Regular field validation
      if (key in data) {
        this.validateSchema(data[key], value, `${path}.${key}`, errors);
      } else if (schema[`required_${key}`]) {
        errors.push(`${path}.${key}: Required field missing`);
      }
    }
  }

  // Convenience methods for common validations
  public isString(value: any): boolean {
    return typeof value === 'string';
  }

  public isNumber(value: any): boolean {
    return typeof value === 'number' && !isNaN(value);
  }

  public isBoolean(value: any): boolean {
    return typeof value === 'boolean';
  }

  public isObject(value: any): boolean {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  public isArray(value: any): boolean {
    return Array.isArray(value);
  }

  public isEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  public isUrl(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  public minLength(value: string, min: number): boolean {
    return value.length >= min;
  }

  public maxLength(value: string, max: number): boolean {
    return value.length <= max;
  }

  public range(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }
}
