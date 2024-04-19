/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
/* eslint-disable @typescript-eslint/no-explicit-any */

declare module 'logic-solver' {
    type NumTerm = number
    type NameTerm = string
    type Term = NumTerm | NameTerm
    type NestedFormulasOrTerms = Formula | Term | NestedFormulasOrTerms[]
    type NestedFormulasOrTermsOrBits = Formula | Term | Bits | NestedFormulasOrTermsOrBits[]
    export class Formula {
        private constructor()
    }

    // VARIABLES
    export interface Solver {
        getVarNum(vname: NameTerm, noCreate?: boolean): number
        getVarName(vnum: NumTerm): string
    }

    // TERMS
    export const TRUE: '$T'
    export const FALSE: '$F'
    export function isTerm(x: any): boolean
    export function isNameTerm(x: any): boolean
    export function isNumTerm(x: any): boolean
    export interface Solver {
        toNameTerm(t: Term): NameTerm
        toNumTerm(t: Term, noCreate?: boolean): NumTerm
    }

    // FORMULAS
    export function isFormula(x: any): boolean
    export function not<T extends Formula | Term>(operand: T): T
    export function or(...operands: NestedFormulasOrTerms[]): Formula | Term
    export function and(...operands: NestedFormulasOrTerms[]): Formula | Term
    export function xor(...operands: NestedFormulasOrTerms[]): Formula | Term
    export function implies(operand1: Formula | Term, operand2: Formula | Term): Formula | Term
    export function equiv(operand1: Formula | Term, operand2: Formula | Term): Formula | Term
    export function exactlyOne(...operands: NestedFormulasOrTerms[]): Formula | Term
    export function atMostOne(...operands: NestedFormulasOrTerms[]): Formula | Term

    // SOLVER
    export class Solver {
        constructor()
        require(...args: NestedFormulasOrTerms[])
        forbid(...args: NestedFormulasOrTerms[])
        solve(): Solution | null
        solveAssuming(formula: Formula | Term): Solution | null
    }
    export function disablingAssertions<T>(f: () => T): T

    // SOLUTION
    class Solution {
        private constructor()
        getMap(): {[key: string]: boolean}
        getTrueVars(): string[]
        evaluate(formulaOrBits: Formula | Term): boolean
        evaluate(formulaOrBits: Bits): number
        getFormula(): Formula | Term
        getWeightedSum(formulas: (Formula | Term)[], weights: number | number[]): number
        ignoreUnknownVariables()
    }

    // OPTIMIZATION
    export interface Solver {
        minimizeWeightedSum(solution: Solution, formulas: (Formula | Term)[], weights: number | number[]): Solution
        maximizeWeightedSum(solution: Solution, formulas: (Formula | Term)[], weights: number | number[]): Solution    
    }

    // BITS (INTEGERS)
    export class Bits {
        readonly bits: (Formula | Term)[]
        constructor(formulaArray: (Formula | Term)[])
    }
    export function isBits(x: any): boolean
    export function constantBits(wholeNumber: number): Bits
    export function variableBits(baseName: string, N: number): Bits
    export function equalBits(bits1: Bits, bits2: Bits): Formula
    export function lessThan(bits1: Bits, bits2: Bits): Formula | Term
    export function lessThanOrEqual(bits1: Bits, bits2: Bits): Formula | Term
    export function greaterThan(bits1: Bits, bits2: Bits): Formula | Term
    export function greaterThanOrEqual(bits1: Bits, bits2: Bits): Formula | Term
    export function sum(...operands: NestedFormulasOrTermsOrBits[]): Bits
    export function weightedSum(formulas: (Formula | Term)[], weights: number | number[]): Bits
}
