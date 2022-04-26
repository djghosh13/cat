# Cryptic Crossword Grammar

## Variables

### General

| Variable | Name | Explanation |
|----------|------|-------------|
| `R` | Root | Only used for root node |
| `D` | Definition | Contains definition only, no further breakdown |
| `C` | Clue | Any clue type, has one child specifying type |
| `X` | Extra | Marks filler or connector words |

### Clue types

Still deciding on how specific the breakdown for different types of letter manipulation should be.

| Variable | Name | Explanation |
|----------|------|-------------|
| `T` | Transformation | Select, remove, or rearrange characters from a single phrase |
| `M` | Merge | Combine two or more phrases together |
| `AN` | Anagram | Arbitrary rearrangement of characters (special case of `T`) |
| `CH` | Charades | Concatenate phrases together (special case of `M`)
| `H` | Hidden | Answer hidden within a phrase |
| `HP` | Homophone | Answer sounds like a different phrase |

### Terminal variables

| Variable | Name | Explanation |
|----------|------|-------------|
| `L` | Literal | Letters in the phrase are used as is |
| `S` | Synonym | Phrase is a synonym for another term |
| `A` | Abbreviation | Some words are commonly used to stand for a single letter, without any clue-in |
| `K` | Keyword | Part of the clue-in to signal a type of clue |
| `U` | Unknown | Terminal to mark a subphrase that cannot be parsed |


## Rules

Unlike normal EBNF specifications, order is unimportant for the below ruleset. The connector variable `X` can be inserted anywhere.

```ebnf
S         ::=  D D | D C;
D         ::=  <token>+;
C         ::=  clue_type | terminal;
clue_type ::=  C+ K*;
terminal  ::=  <token>+;
```