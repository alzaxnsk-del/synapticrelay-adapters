"""
Test manifest validation for the Python adapter.
"""
import json
import os
import sys

# Allow import from parent path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from synapticrelay.manifest import ManifestBuilder, validate_manifest


def test_supplier_manifest_valid():
    """Supplier manifest with capabilities should be valid."""
    manifest = (
        ManifestBuilder("Test Agent", "python", "1.0.0")
        .role("supplier")
        .health_endpoint("http://localhost:8000/health")
        .invoke_endpoint("http://localhost:8000/invoke")
        .add_capability("test", "Test capability")
        .build()
    )
    result = validate_manifest(manifest)
    assert result["valid"], f"Expected valid, got errors: {result.get('errors')}"


def test_buyer_manifest_valid():
    """Buyer manifest without capabilities should be valid."""
    manifest = (
        ManifestBuilder("Buyer Agent", "python", "1.0.0")
        .role("buyer")
        .health_endpoint("http://localhost:8000/health")
        .build()
    )
    result = validate_manifest(manifest)
    assert result["valid"], f"Expected valid, got errors: {result.get('errors')}"


def test_supplier_without_capabilities_invalid():
    """Supplier without capabilities should fail validation."""
    manifest = (
        ManifestBuilder("Bad Agent", "python", "1.0.0")
        .role("supplier")
        .health_endpoint("http://localhost:8000/health")
        .build()
    )
    result = validate_manifest(manifest)
    assert not result["valid"], "Expected invalid — supplier has no capabilities"


def test_spec_version_present():
    """Manifest should always have specVersion 1.0."""
    manifest = (
        ManifestBuilder("Test", "python", "1.0.0")
        .role("buyer")
        .health_endpoint("http://localhost:8000/health")
        .build()
    )
    assert manifest["specVersion"] == "1.0"


def test_example_manifest_schema():
    """Example supplier manifest should pass schema validation."""
    schema_path = os.path.join(
        os.path.dirname(__file__),
        "..", "..", "..", "spec", "examples", "supplier-manifest.json"
    )
    if os.path.exists(schema_path):
        with open(schema_path) as f:
            manifest = json.load(f)
        result = validate_manifest(manifest)
        assert result["valid"], f"Example manifest invalid: {result.get('errors')}"


if __name__ == "__main__":
    test_supplier_manifest_valid()
    test_buyer_manifest_valid()
    test_supplier_without_capabilities_invalid()
    test_spec_version_present()
    test_example_manifest_schema()
    print("✅ All Python manifest tests passed!")
