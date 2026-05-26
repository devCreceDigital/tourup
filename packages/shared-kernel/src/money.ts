import { Decimal } from "decimal.js";

export type CurrencyCode = "PEN" | "USD";

export type Money = {
  readonly decimal: string;
  readonly currency: CurrencyCode;
};

const decimalPattern = /^-?\d+(\.\d{1,2})?$/;

export function createMoney(decimal: string, currency: CurrencyCode = "PEN"): Money {
  if (!decimalPattern.test(decimal)) {
    throw new Error("Invalid money decimal representation.");
  }
  const value = new Decimal(decimal);
  return Object.freeze({ decimal: value.toFixed(2), currency });
}

export function moneyToMinorUnits(money: Money): bigint {
  const minorUnits = new Decimal(money.decimal).mul(100);
  if (!minorUnits.isInteger()) {
    throw new Error("Money cannot be converted to minor units without precision loss.");
  }
  return BigInt(minorUnits.toFixed(0));
}
