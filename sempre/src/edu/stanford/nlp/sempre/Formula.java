package edu.stanford.nlp.sempre;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.google.common.base.Function;
import fig.basic.LispTree;

/**
 * A Formula is a logical form, which is the result of semantic parsing. Current
 * implementation is lambda calculus with primitives like description logic and
 * DCS to lessen the use of variables.
 * <p/>
 * Important note: define hashCode() for each Formula which only depends on the
 * value, not on random bits (don't include object IDs or enums).
 *
 * @author Percy Liang
 */
public abstract class Formula {
  // Serialize as LispTree.
  public abstract LispTree toLispTree();

  // Recursively perform some operation on each formula.
  // Apply to formulas.  If |func| returns null, then recurse on children.
  public abstract Formula map(Function<Formula, Formula> func);

  @JsonValue
  public String toString() { return toLispTree().toString(); }

  @JsonCreator
  public static Formula fromString(String str) {
    return Formulas.fromLispTree(LispTree.proto.parseFromString(str));
  }

  @Override abstract public boolean equals(Object o);
  @Override abstract public int hashCode();

  public static Formula nullFormula = new PrimitiveFormula() {
      public LispTree toLispTree() { return LispTree.proto.newLeaf("null"); }
      @Override public boolean equals(Object o) { return this == o; }
      @Override public int hashCode() { return 0; }
  };
}
