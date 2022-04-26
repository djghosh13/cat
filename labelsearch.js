const ODD_LABEL_SET = [
    ["D", "Definition"],
    ["C", "Clue"],
    ["K", "Keyword"],
    ["X", "Extra"]
].sort((a, b) => a[0].length - b[0].length);

const EVEN_LABEL_SET = [
    ["L", "Literal"],
    ["S", "Synonym"],
    ["A", "Abbreviation"],
    
    ["LS", "Letter selection"],
    ["W", "Wordplay"],
    ["AN", "Anagram"],
    ["H", "Hidden clue"],
    ["HP", "Homophone"],

    ["U", "Unknown"],
    ["X", "Extra"]
].sort((a, b) => a[0].length - b[0].length);

class LabelSearch {
    constructor(level) {
        this.search = "";
        this.base = (level == 0) ? []
            : (level % 2 == 0) ? EVEN_LABEL_SET
            : ODD_LABEL_SET;
        this.valid = this.base;
    }

    update(key) {
        if (key == "Backspace") {
            this.search = this.search.slice(0, this.search.length - 1);
            this.valid = this.base.filter(label => label[0].startsWith(this.search));
        } else {
            let newSearch = this.search + key.toUpperCase();
            let newValid = this.base.filter(label => label[0].startsWith(newSearch));
            if (newValid.length) {
                this.search = newSearch;
                this.valid = newValid;
            }
        }
    }

    confirm() {
        if (this.search.length && this.valid.length) return this.valid[0][0];
        return null;
    }
}
