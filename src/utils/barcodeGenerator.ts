import { BarcodeCounter } from "../models/BarcodeCounter";
import { ProductVariant } from "../models/ProductVariant";
import { AppError } from "./AppError";
import {
  validateFourDigits,
  validateTwoDigits,
  validateTwelveDigits,
} from "./digitValidators";

const MAX_SERIAL = 9999;
const MAX_GENERATION_ATTEMPTS = 5;

/**
 * Computes 2 check digits from a 10-digit base string.
 * Uses ISO 7064 Mod 97,10: check = 98 - (numericValue mod 97), zero-padded to 2 digits.
 */
export const computeCheckDigits = (base10: string): string => {
  if (base10.length !== 10 || !/^\d{10}$/.test(base10)) {
    throw new AppError("Barcode base must be exactly 10 digits", 400);
  }

  const remainder = Number(BigInt(base10) % 97n);
  const check = (98 - remainder) % 97;

  return String(check).padStart(2, "0");
};

export const buildBarcode = (
  categoryPrefix: string,
  sizeCode: string,
  serial: number
): string => {
  const serialPart = String(serial).padStart(4, "0");
  const base10 = `${categoryPrefix}${sizeCode}${serialPart}`;
  const checkDigits = computeCheckDigits(base10);

  return `${base10}${checkDigits}`;
};

export const verifyBarcodeCheckDigits = (barcode: string): boolean => {
  if (!validateTwelveDigits(barcode)) {
    return false;
  }

  const base10 = barcode.slice(0, 10);
  const expectedCheck = barcode.slice(10, 12);

  return computeCheckDigits(base10) === expectedCheck;
};

const reserveNextSerial = async (
  categoryPrefix: string,
  sizeCode: string
): Promise<number> => {
  const counter = await BarcodeCounter.findOneAndUpdate(
    { categoryPrefix, sizeCode },
    { $inc: { lastSerial: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  if (!counter || counter.lastSerial > MAX_SERIAL) {
    throw new AppError(
      `Serial limit reached for prefix ${categoryPrefix} and size code ${sizeCode}`,
      409
    );
  }

  return counter.lastSerial;
};

const isBarcodeAvailable = async (barcode: string): Promise<boolean> => {
  const existing = await ProductVariant.exists({ barcode });
  return existing === null;
};

/**
 * Generates a unique 12-digit barcode:
 * [Category Prefix: 2][Size Code: 4][Serial: 4][Check Digits: 2]
 *
 * Example: "120038000105" => prefix "12", size "0038", serial "0001", check "05"
 *
 * Serial allocation uses an atomic MongoDB counter per (prefix, sizeCode) pair,
 * with collision checks against existing variant barcodes.
 */
export const generate12DigitBarcode = async (
  categoryPrefix: string,
  sizeCode: string
): Promise<string> => {
  if (!validateTwoDigits(categoryPrefix)) {
    throw new AppError("Category prefix must be exactly 2 digits", 400);
  }

  if (!validateFourDigits(sizeCode)) {
    throw new AppError("Size code must be exactly 4 digits", 400);
  }

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const serial = await reserveNextSerial(categoryPrefix, sizeCode);
    const barcode = buildBarcode(categoryPrefix, sizeCode, serial);

    if (await isBarcodeAvailable(barcode)) {
      return barcode;
    }
  }

  throw new AppError(
    "Unable to generate a unique barcode after multiple attempts",
    409
  );
};
