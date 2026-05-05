/**
 * ANSI color output with TTY/NO_COLOR awareness.
 *
 * When stdout is not a terminal (piped, :! in Neovim, etc.) or
 * NO_COLOR is set, all color functions become pass-throughs.
 *
 * Import this instead of @std/fmt/colors throughout the project.
 */

import * as stdColors from "@std/fmt/colors";

const noColor = !Deno.stdout.isTerminal() || Deno.env.get("NO_COLOR") !== undefined;

type ColorFn = (text: string) => string;

/** Identity function — returns the input unchanged. */
const id: ColorFn = (s) => s;

function makeColorFn(fn: ColorFn): ColorFn {
    return noColor ? id : fn;
}

export const reset: ColorFn = makeColorFn(stdColors.reset);
export const bold: ColorFn = makeColorFn(stdColors.bold);
export const dim: ColorFn = makeColorFn(stdColors.dim);
export const italic: ColorFn = makeColorFn(stdColors.italic);
export const underline: ColorFn = makeColorFn(stdColors.underline);

export const black: ColorFn = makeColorFn(stdColors.black);
export const red: ColorFn = makeColorFn(stdColors.red);
export const green: ColorFn = makeColorFn(stdColors.green);
export const yellow: ColorFn = makeColorFn(stdColors.yellow);
export const blue: ColorFn = makeColorFn(stdColors.blue);
export const magenta: ColorFn = makeColorFn(stdColors.magenta);
export const cyan: ColorFn = makeColorFn(stdColors.cyan);
export const white: ColorFn = makeColorFn(stdColors.white);
export const gray: ColorFn = makeColorFn(stdColors.gray);

export const brightRed: ColorFn = makeColorFn(stdColors.brightRed);
export const brightGreen: ColorFn = makeColorFn(stdColors.brightGreen);
export const brightYellow: ColorFn = makeColorFn(stdColors.brightYellow);
export const brightBlue: ColorFn = makeColorFn(stdColors.brightBlue);
export const brightMagenta: ColorFn = makeColorFn(stdColors.brightMagenta);
export const brightCyan: ColorFn = makeColorFn(stdColors.brightCyan);
export const brightWhite: ColorFn = makeColorFn(stdColors.brightWhite);

export const bgBlack: ColorFn = makeColorFn(stdColors.bgBlack);
export const bgRed: ColorFn = makeColorFn(stdColors.bgRed);
export const bgGreen: ColorFn = makeColorFn(stdColors.bgGreen);
export const bgYellow: ColorFn = makeColorFn(stdColors.bgYellow);
export const bgBlue: ColorFn = makeColorFn(stdColors.bgBlue);
export const bgMagenta: ColorFn = makeColorFn(stdColors.bgMagenta);
export const bgCyan: ColorFn = makeColorFn(stdColors.bgCyan);
export const bgWhite: ColorFn = makeColorFn(stdColors.bgWhite);
