// Replace Conditional with Polymorphism
// -------------------------------------
// BEFORE: a type-code switch repeated across multiple functions. Every new shape
// forces edits to area() AND name() AND any future per-type function — the
// "repeated switch" / shotgun-surgery smell.
//
// AFTER: each type owns its behavior behind a common interface. Adding a shape is
// purely additive (Open/Closed); no existing function is touched.
//
// This is illustrative TypeScript. Compile with `tsc` or read as reference.

// ===== BEFORE =================================================================
type ShapeData =
  | { kind: "circle"; r: number }
  | { kind: "square"; side: number }
  | { kind: "rect"; w: number; h: number };

function areaBefore(s: ShapeData): number {
  switch (s.kind) {
    case "circle": return Math.PI * s.r ** 2;
    case "square": return s.side ** 2;
    case "rect": return s.w * s.h;
    default: throw new Error("unknown shape");
  }
}

function nameBefore(s: ShapeData): string {
  switch (s.kind) {           // the SAME switch, duplicated — change one, hunt the rest
    case "circle": return "Circle";
    case "square": return "Square";
    case "rect": return "Rectangle";
    default: throw new Error("unknown shape");
  }
}

// ===== AFTER ==================================================================
interface Shape {
  area(): number;
  name(): string;
}

class Circle implements Shape {
  constructor(private readonly r: number) {}
  area(): number { return Math.PI * this.r ** 2; }
  name(): string { return "Circle"; }
}

class Square implements Shape {
  constructor(private readonly side: number) {}
  area(): number { return this.side ** 2; }
  name(): string { return "Square"; }
}

class Rectangle implements Shape {
  constructor(private readonly w: number, private readonly h: number) {}
  area(): number { return this.w * this.h; }
  name(): string { return "Rectangle"; }
}

// Adding a Triangle = add one class. areaBefore/nameBefore would each need a new
// case; here, no existing class changes. That is the payoff.

export { areaBefore, nameBefore, Shape, Circle, Square, Rectangle };
