/**
 * ManifestBuilder tests.
 */

import { ManifestBuilder } from '../packages/core/src/manifest';

describe('ManifestBuilder', () => {
  test('builds a valid supplier manifest', () => {
    const manifest = new ManifestBuilder('Test Agent', 'python', '1.0.0')
      .setRole('supplier')
      .description('A test agent')
      .healthEndpoint('http://localhost:8000/health')
      .invokeEndpoint('http://localhost:8000/invoke')
      .addCapability({
        name: 'test-cap',
        description: 'Test capability',
      })
      .build();

    expect(manifest.specVersion).toBe('1.0');
    expect(manifest.runtime.name).toBe('Test Agent');
    expect(manifest.runtime.type).toBe('python');
    expect(manifest.role).toBe('supplier');
    expect(manifest.capabilities).toHaveLength(1);
    expect(manifest.endpoints.health).toBe('http://localhost:8000/health');
    expect(manifest.endpoints.invoke).toBe('http://localhost:8000/invoke');
  });

  test('builds a valid buyer manifest', () => {
    const manifest = new ManifestBuilder('Buyer Agent', 'node', '2.0.0')
      .setRole('buyer')
      .healthEndpoint('http://localhost:3000/health')
      .build();

    expect(manifest.role).toBe('buyer');
    expect(manifest.capabilities).toBeUndefined();
  });

  test('builds with all optional fields', () => {
    const manifest = new ManifestBuilder('Full Agent', 'openclaw', '3.0.0')
      .setRole('both')
      .description('A full-featured agent')
      .homepage('https://example.com')
      .healthEndpoint('http://localhost/health')
      .invokeEndpoint('http://localhost/invoke')
      .statusEndpoint('http://localhost/status')
      .webhookEndpoint('http://localhost/webhook')
      .addCapability({ name: 'cap1', description: 'Cap 1' })
      .invocation({ mode: 'async', timeoutMs: 60000 })
      .auth({ type: 'bearer', headerName: 'Authorization' })
      .settlement({ supported: true, methods: ['escrow'] })
      .meta({ custom: 'value' })
      .build();

    expect(manifest.runtime.homepage).toBe('https://example.com');
    expect(manifest.invocation?.mode).toBe('async');
    expect(manifest.auth?.type).toBe('bearer');
    expect(manifest.settlement?.supported).toBe(true);
    expect(manifest.metadata?.custom).toBe('value');
  });

  test('throws on invalid supplier without capabilities', () => {
    expect(() => {
      new ManifestBuilder('Bad Agent', 'python', '1.0.0')
        .setRole('supplier')
        .healthEndpoint('http://localhost/health')
        .invokeEndpoint('http://localhost/invoke')
        .build();
    }).toThrow();
  });

  test('buildUnchecked skips validation', () => {
    const manifest = new ManifestBuilder('Partial', 'python', '1.0.0')
      .setRole('supplier')
      .buildUnchecked();

    expect(manifest.specVersion).toBe('1.0');
    // Would normally fail validation but buildUnchecked allows it
  });
});
