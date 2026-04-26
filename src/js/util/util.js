/**
 * Linearly interpolates between two values.
 * @param {number} a - Start value.
 * @param {number} b - End value.
 * @param {number} n - Interpolation factor.
 * @returns {number}
 */
export const lerp = (a, b, n) => (1 - n) * a + n * b;

/**
 * Maps a value from one range to another.
 * @param {number} x - The value to map.
 * @param {number} a - Source range start.
 * @param {number} b - Source range end.
 * @param {number} c - Target range start.
 * @param {number} d - Target range end.
 * @returns {number}
 */
export const map = (x, a, b, c, d) => (x - a) * (d - c) / (b - a) + c;

/**
 * Gets the distance between two points.
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {number}
 */
export const getDistance = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

/**
 * Generates a random float between min and max.
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export const getRandomFloat = (min, max) => Math.random() * (max - min) + min;

/**
 * Generates a random integer between min and max.
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
