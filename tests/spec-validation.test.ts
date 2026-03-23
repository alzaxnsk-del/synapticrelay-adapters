/**
 * Spec validation tests — ensure example manifests pass validation.
 */

import { validateManifestFile, validateManifest } from '../packages/core/src/manifest';
import * as path from 'path';

const EXAMPLES_DIR = path.resolve(__dirname, '../spec/examples');

describe('Manifest Validation', () => {
  describe('Example manifests should be valid', () => {
    test('supplier manifest', () => {
      const result = validateManifestFile(path.join(EXAMPLES_DIR, 'supplier-manifest.json'));
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('buyer manifest', () => {
      const result = validateManifestFile(path.join(EXAMPLES_DIR, 'buyer-manifest.json'));
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('both-role manifest', () => {
      const result = validateManifestFile(path.join(EXAMPLES_DIR, 'both-manifest.json'));
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Invalid manifests should fail', () => {
    test('missing specVersion', () => {
      const result = validateManifest({
        runtime: { name: 'test', type: 'python', version: '1.0.0' },
        role: 'supplier',
        endpoints: { health: 'http://localhost/health' },
      });
      expect(result.valid).toBe(false);
    });

    test('invalid role', () => {
      const result = validateManifest({
        specVersion: '1.0',
        runtime: { name: 'test', type: 'python', version: '1.0.0' },
        role: 'invalid',
        endpoints: { health: 'http://localhost/health' },
      });
      expect(result.valid).toBe(false);
    });

    test('supplier without capabilities', () => {
      const result = validateManifest({
        specVersion: '1.0',
        runtime: { name: 'test', type: 'python', version: '1.0.0' },
        role: 'supplier',
        endpoints: {
          health: 'http://localhost/health',
          invoke: 'http://localhost/invoke',
        },
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path.includes('capabilities'))).toBe(true);
    });

    test('supplier without invoke endpoint', () => {
      const result = validateManifest({
        specVersion: '1.0',
        runtime: { name: 'test', type: 'python', version: '1.0.0' },
        role: 'supplier',
        capabilities: [{ name: 'test', description: 'test' }],
        endpoints: { health: 'http://localhost/health' },
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path.includes('invoke'))).toBe(true);
    });

    test('missing endpoints', () => {
      const result = validateManifest({
        specVersion: '1.0',
        runtime: { name: 'test', type: 'python', version: '1.0.0' },
        role: 'buyer',
      });
      expect(result.valid).toBe(false);
    });

    test('invalid runtime type', () => {
      const result = validateManifest({
        specVersion: '1.0',
        runtime: { name: 'test', type: 'invalid-type', version: '1.0.0' },
        role: 'buyer',
        endpoints: { health: 'http://localhost/health' },
      });
      expect(result.valid).toBe(false);
    });
  });
});
