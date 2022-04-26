# Cryptic Crossword Grammar

## Variables

### General-use

| Variable | Name | Explanation |
|----------|------|-------------|
| T | Top | Only used for root node |
| D | Definition | Contains definition only, no further breakdown |
| C | Clue | Clue portion, must be broken down into specific types |
| X | Extra | Marks filler or connector words |

### Clue types

Charades is currently not included because basically every clue type (except double definition) is "technically" charades. Still deciding on how specific the breakdown for different types of letter manipulation should be.

| Variable | Name | Explanation |
|----------|------|-------------|
| WP | Wordplay | Manipulation of two or more words or phrases |
| LS | Letter selection | Select or remove characters from one phrase |
| AN | Anagram | Arbitrary rearrangement of characters |
| HD | Hidden | Answer hidden within a phrase |
| HP | Homophone | Answer sounds like a different phrase |

### Terminal variables

| Variable | Name | Explanation |
|----------|------|-------------|
| L | Literal | Letters in the token(s) are used as is |
| S | Synonym | Phrase is a synonym for another term |
| A | Abbreviation | Some words are commonly used to stand for a single letter, without any clue-in |
| K | Keyword | Part of the clue-in to signal a type of clue |


## Rules

`SCT` and `CCT` stand for "Simple Clue Type" and "Complex Clue Type", respectively.
Unlike normal CFG specifications, order is unimportant for the below ruleset. For example, `CCT => C K C` is a valid parse. The connector variable `X` can be inserted anywhere.

```ebnf
S: D D | D C
C: (CCT | SCT)+
CCT: C+ K*
SCT: <token>+
K: <token>+
```