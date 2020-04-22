import { TPEG, PAsm, ParseTree, generate } from './puppy-pasm';
export {ParseTree}
// pegtree pasmcc -g puppy.tpeg -f ts > puppy-pasm.ts
// npx ts-node puppy-pasm.ts

export const PuppyParser = generate(TPEG(), 'Source')
//console.log(PuppyParser('1+2*3'))

const pRule = PAsm.pRule;
const pRef = PAsm.pRef;
const pEmpty = PAsm.pEmpty;
const pChar = PAsm.pChar;
const pRange = PAsm.pRange;
const pAny = PAsm.pAny;
//const pAnd = PAsm.pAnd;
const pNot = PAsm.pNot;
const pMany = PAsm.pMany;
const pOneMany = PAsm.pOneMany;
const pOption = PAsm.pOption;
const pSeq = PAsm.pSeq;
const pSeq2 = PAsm.pSeq2;
const pSeq3 = PAsm.pSeq3;
//const pSeq4 = PAsm.pSeq4;
const pOre = PAsm.pOre;
const pOre2 = PAsm.pOre2;
//const pOre3 = PAsm.pOre3;
//const pOre4 = PAsm.pOre4;
const pNode = PAsm.pNode;
const pEdge = PAsm.pEdge;
const pFold = PAsm.pFold;
const pManyRange = PAsm.pManyRange;

export const TPEG2 = (peg?: any) => {
  if (peg === undefined) {
    peg = {}
  }
  pRule(peg, "NAME", pSeq2(pRange("_", "AZaz"), pManyRange("_", "AZaz09")))
  pRule(peg, "_ParamType", pSeq2(pChar("["), pFold("", pSeq3(pManyRange(" \t", ""), pOption(pSeq2(pRef(peg, "Type"), pMany(pSeq2(pSeq2(pChar(","), pManyRange(" \t", "")), pRef(peg, "Type"))))), pSeq2(pChar("]"), pManyRange(" \t", ""))), "ParamType", -1)))
  pRule(peg, "PrimaryType", pOre2(pSeq2(pSeq2(pChar("("), pNode(pSeq3(pManyRange(" \t", ""), pOption(pSeq2(pRef(peg, "Type"), pMany(pSeq2(pSeq2(pChar(","), pManyRange(" \t", "")), pRef(peg, "Type"))))), pSeq2(pChar(")"), pManyRange(" \t", ""))), "TupleType", -1)), pMany(pRef(peg, "_ParamType"))), pSeq3(pNode(pRef(peg, "NAME"), "BaseType", 0), pManyRange(" \t", ""), pMany(pRef(peg, "_ParamType")))))
  pRule(peg, "FuncType", pSeq2(pRef(peg, "PrimaryType"), pMany(pSeq2(pChar("->"), pFold("", pSeq2(pManyRange(" \t", ""), pRef(peg, "Type")), "FuncType", -2)))))
  pRule(peg, "Type", pSeq2(pRef(peg, "FuncType"), pOption(pFold("", pOneMany(pSeq2(pSeq2(pChar("|"), pManyRange(" \t", "")), pRef(peg, "Type"))), "UnionType", 0))))
  return peg
}

export const TypeParser = PAsm.generate(TPEG2({}), 'Type');
