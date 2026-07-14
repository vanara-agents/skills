# Before / After Transformations

A reference set of small, behavior-preserving refactorings with the reasoning for each. Tests stay
green across every one.

## 1. Decompose a conditional

```javascript
// BEFORE — the condition's meaning is unclear at the call site
if (date < plan.summerStart || date > plan.summerEnd) {
  charge = quantity * plan.regularRate + plan.regularServiceCharge;
} else {
  charge = quantity * plan.summerRate;
}
```

```javascript
// AFTER — intention-revealing functions; the if/else now reads like prose
const isSummer = (date) => !(date < plan.summerStart || date > plan.summerEnd);
const summerCharge  = () => quantity * plan.summerRate;
const regularCharge = () => quantity * plan.regularRate + plan.regularServiceCharge;

charge = isSummer(date) ? summerCharge() : regularCharge();
```

**Why behavior is preserved:** the boolean and both arithmetic branches are identical; only their
names and placement changed.

## 2. Replace a type-code switch with a lookup table

```python
# BEFORE — repeated dispatch, easy to forget a case
def shipping_cost(kind, weight):
    if kind == "ground":
        return weight * 1.0
    elif kind == "air":
        return weight * 2.5
    elif kind == "freight":
        return weight * 0.6
    raise ValueError(kind)
```

```python
# AFTER — data, not control flow
RATES = {"ground": 1.0, "air": 2.5, "freight": 0.6}

def shipping_cost(kind, weight):
    if kind not in RATES:
        raise ValueError(kind)
    return weight * RATES[kind]
```

**Why behavior is preserved:** same rate per kind, same `ValueError` for unknown kinds.

## 3. Introduce a parameter object

```typescript
// BEFORE — four loosely-related params that always travel together
function drawRect(x: number, y: number, w: number, h: number) { /* ... */ }
drawRect(0, 0, 100, 40);
```

```typescript
// AFTER — one cohesive concept
interface Rect { x: number; y: number; w: number; h: number; }
function drawRect(r: Rect) { /* ...same body, reading r.x etc... */ }
drawRect({ x: 0, y: 0, w: 100, h: 40 });
```

**Why behavior is preserved:** the same four values reach the same body; only the call shape changed.

## 4. Inline a needless variable, then rename for clarity

```go
// BEFORE
tmp := basePrice * taxRate
return tmp
```

```go
// AFTER
return basePrice * taxRate
```

**Why behavior is preserved:** `tmp` was a pure alias with no other use; removing it changes nothing.

## Reading these

Each transformation is the kind of step the agent takes one at a time: small, obviously
behavior-preserving, and trivially revertible if a test goes red. None of them changes output for any
input — that is the defining property of a refactor.
