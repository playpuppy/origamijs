import { ErrorLog } from './puppy';

export const enMessage: { [key: string]: (log: ErrorLog) => string } = {
  UndefinedParseTree: (log: ErrorLog) => `UndefinedParseTree: ${log.subject}`,
  TypeError: (log: ErrorLog) => {
    if (log.subject) {
      return `TypeError: type ${log.subject} or compatible its type is required`;
    } else {
      return `TypeError: type ${log.given} is not assignable to type ${log.request}`; // from TypeScript
    }
  },
  BinaryTypeError: (log: ErrorLog) =>
    `BinaryTypeError: invalid operands to binary expression ${log.subject} (${log.request} and ${log.given})`, // from Clang
  SyntaxError: (_log: ErrorLog) => 'SyntaxError',
  UnknownPackageName: (_log: ErrorLog) =>
    'UnknownPackageName: package not found',
  OnlyInFunction: (log: ErrorLog) =>
    `OnlyInFunction: ${log.subject} outside function`, // from Python
  OnlyInLoop: (log: ErrorLog) => `OnlyInLoop: ${log.subject} outside loop`, // from Python
  UndefinedName: (log: ErrorLog) =>
    `UndefinedName: use of undeclared identifier ${log.subject}`, // from Clang
  Immutable: (log: ErrorLog) => `Immutable: ${log.subject} is immutable value`,
  InferredPackage: (log: ErrorLog) =>
    `InferredPackage: ${log.subject} imported automatically`,
  UnknownName: (log: ErrorLog) =>
    `UnknownName: use of undeclared identifier ${log.subject}`, // from Clang
  NotFunction: (log: ErrorLog) =>
    `NotFunction: ${log.subject} is not a function`, // from Clang
  TooManyArguments: (_log: ErrorLog) =>
    `TooManyArguments: arguments are too many`,
  RequiredArguments: (_log: ErrorLog) =>
    `RequiredArguments: arguments are required`,
  CompileError: (log: ErrorLog) => `CompileError: ${log.subject}`,
  NLPSymbol: (log: ErrorLog) =>
    `NLPSymbol: This was interpreted as NLPSymbol ${log.subject}`,
};
