import { describe, it, expect } from 'vitest';
import { validatePassword } from '../lib/password';

describe('validatePassword', () => {
  it('rejects empty / undefined passwords', () => {
    expect(validatePassword('')).toMatch(/at least 8/);
    expect(validatePassword(undefined as any)).toMatch(/at least 8/);
  });

  it('rejects passwords shorter than 8 characters', () => {
    expect(validatePassword('Ab1')).toMatch(/at least 8/);
    expect(validatePassword('Abc123')).toMatch(/at least 8/);
  });

  it('rejects passwords without any letter', () => {
    expect(validatePassword('12345678')).toMatch(/letter/);
  });

  it('rejects passwords without any number', () => {
    expect(validatePassword('abcdefgh')).toMatch(/number/);
  });

  it('accepts a valid password', () => {
    expect(validatePassword('Password1')).toBeNull();
    expect(validatePassword('MyStr0ng!')).toBeNull();
    expect(validatePassword('abcdefg1')).toBeNull();
  });
});
