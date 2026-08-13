export const TWO_DIGIT_PATTERN = /^\d{2}$/;
export const FOUR_DIGIT_PATTERN = /^\d{4}$/;
export const TWELVE_DIGIT_PATTERN = /^\d{12}$/;

export const validateTwoDigits = (value: string): boolean =>
  TWO_DIGIT_PATTERN.test(value);

export const validateFourDigits = (value: string): boolean =>
  FOUR_DIGIT_PATTERN.test(value);

export const validateTwelveDigits = (value: string): boolean =>
  TWELVE_DIGIT_PATTERN.test(value);
