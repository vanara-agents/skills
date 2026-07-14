// Extract Function (+ guard clauses + extract variable)
// ------------------------------------------------------
// A single long function doing validation, calculation, tax, and formatting,
// refactored into small named pieces. Behavior is identical — the demo at the
// bottom proves before === after for the same inputs.
//
// Run: node extract-function.before-after.js

// ---- BEFORE: one function, several jobs, nested conditionals -------------------
function invoiceLineBefore(item) {
  if (item) {
    if (item.qty > 0) {
      let total = item.qty * item.price;
      if (item.taxable) {
        total = total * 1.2; // what's 1.2? magic number
      }
      return item.name + ": $" + total.toFixed(2);
    }
  }
  return "invalid";
}

// ---- AFTER: guard clause + extracted, intent-named helpers ---------------------
const TAX_RATE = 0.2; // Replace Magic Literal with Symbolic Constant

const isValidItem = (item) => Boolean(item) && item.qty > 0; // Decompose Conditional

function lineTotal(item) {
  const subtotal = item.qty * item.price;          // Extract Variable
  return item.taxable ? subtotal * (1 + TAX_RATE) : subtotal;
}

const formatLine = (name, total) => `${name}: $${total.toFixed(2)}`;

function invoiceLineAfter(item) {
  if (!isValidItem(item)) return "invalid";        // guard clause flattens nesting
  return formatLine(item.name, lineTotal(item));
}

// ---- Proof the refactoring preserved behavior ---------------------------------
const cases = [
  { name: "Widget", qty: 3, price: 10, taxable: true },
  { name: "Gadget", qty: 2, price: 5, taxable: false },
  null,
  { name: "Empty", qty: 0, price: 99, taxable: true },
];

let allMatch = true;
for (const c of cases) {
  const before = invoiceLineBefore(c);
  const after = invoiceLineAfter(c);
  const ok = before === after;
  allMatch = allMatch && ok;
  console.log(`${ok ? "✓" : "✗"} ${JSON.stringify(c)} -> before:"${before}" after:"${after}"`);
}
console.log(allMatch ? "\nAll outputs identical — behavior preserved." : "\nMISMATCH — refactor changed behavior!");
process.exit(allMatch ? 0 : 1);
