// A complete, AAA-structured unit test written BEFORE the implementation.
// Framework-agnostic shape shown with Vitest/Jest-style globals — adapt imports to the
// runner the repository already uses. The point is the structure, not the library.
//
// Behavior under test: applyDiscount(price, percentOff)
//   - subtracts a percentage discount and rounds to 2 decimal places
//   - returns the original price when percentOff is 0   (boundary: identity)
//   - returns 0 when percentOff is 100                  (boundary: full discount)
//   - throws RangeError when percentOff < 0 or > 100    (failure mode)

import { describe, it, expect } from 'vitest';
import { applyDiscount } from '../src/pricing';

// A small factory keeps tests readable and resilient to signature changes.
const cents = (n: number) => Math.round(n * 100) / 100;

describe('applyDiscount', () => {
  // --- Happy path ---------------------------------------------------------
  it('subtracts a percentage discount and rounds to two decimals', () => {
    // Arrange
    const price = 49.99;
    const percentOff = 10;

    // Act
    const result = applyDiscount(price, percentOff);

    // Assert
    expect(result).toBe(cents(44.991)); // 44.99
  });

  // --- Boundaries ---------------------------------------------------------
  it('returns the original price when the discount is zero', () => {
    expect(applyDiscount(20, 0)).toBe(20);
  });

  it('returns zero when the discount is one hundred percent', () => {
    expect(applyDiscount(20, 100)).toBe(0);
  });

  // --- Failure modes ------------------------------------------------------
  it('throws RangeError when the discount exceeds one hundred percent', () => {
    // The throw IS the observable behavior — assert on it directly.
    expect(() => applyDiscount(10, 150)).toThrow(RangeError);
  });

  it('throws RangeError when the discount is negative', () => {
    expect(() => applyDiscount(10, -5)).toThrow(RangeError);
  });
});

// Notes on why this is a good test file:
// - Each test has one Act and asserts a real, observable outcome (no "didn't throw" tests).
// - Boundaries (0, 100) and error modes (negative, > 100) are covered, not just happy path.
// - No time, randomness, network, or shared state — fully deterministic and order-independent.
// - Names state the behavior, so the suite reads as a specification of applyDiscount.
