/**
 * Intentional bugs to prove adaptive TypeScript tests catch real issues.
 */
export declare class Calculator {
    private history;
    add(a: number, b: number): number;
    subtract(a: number, b: number): number;
    multiply(a: number, b: number): number;
    divide(a: number, b: number): number;
    power(base: number, exponent: number): number;
    sqrt(value: number): number;
    getHistory(): string[];
    clearHistory(): void;
}
