class Dataset {
    constructor(dataset) {
        this.name = dataset["name"];
        this.entries = [];
        this.entryIndex = 0;

        // Filter
        for (let entry of dataset["entries"]) {
            if (["answer", "clue", "tokenList", "parse", "done"].every(k => k in entry)) {
                this.entries.push(entry);
            } else {
                console.error("Invalid entry", entry);
            }
        }
        if (!this.entries.length) {
            throw new Error("No valid entries");
        }
    }

    get currentEntry() {
        return this.entries[this.entryIndex];
    }

    get length() {
        return this.entries.length;
    }

    get formattedName() {
        let spacePos = this.name.indexOf(" ", Math.floor(this.name.length / 2));
        if (spacePos != -1) {
            return this.name.substring(0, spacePos) + "<br />" + this.name.substring(spacePos);
        }
        return this.name;
    }

    get searchLink() {
        let query = `guardian ${this.name.toLowerCase()} site:fifteensquared.net`.replace(/ (\d+) /, " \"$1\" ");
        return `https://www.google.com/search?q=${query.replaceAll(" ", "+")}`;
    }

    nextEntry(reverse) {
        let dir = reverse ? -1 : 1;
        this.entryIndex = (this.entryIndex + dir + this.entries.length) % this.entries.length;
    }

    download() {
        let string = JSON.stringify({
            "name": this.name,
            "entries": this.entries
        });
        let blob = new Blob([string], {"type": "text/json"});
        let url = URL.createObjectURL(blob);

        let downloadLink = document.createElement("a");
        downloadLink.setAttribute("href", url);
        downloadLink.setAttribute("download", `${this.name.replaceAll(" ", "")}_cat.json`);

        downloadLink.click();

        URL.revokeObjectURL(url);
    }

    static from(data) {
        return new Dataset({
            "name": data["name"],
            "entries": data["clues"].map(([answer, clue]) => {
                let tokenList = clue.split(/\s+/);
                let length = tokenList.pop();
                return {
                    "answer": Dataset.reformatAnswer(answer, length),
                    "clue": clue,
                    "tokenList": tokenList,
                    "parse": Tree.create(tokenList.length).toObject(tokenList),
                    "done": false
                };
            })
        });
    }

    static reformatAnswer(answer, length) {
        answer = Array.from(answer);
        let newAnswer = [];
        for (let part of length.slice(1, -1).split(/([,-])/)) {
            if (isNaN(part)) newAnswer.push(part.replace(",", " "));
            else newAnswer = newAnswer.concat(answer.splice(0, +part));
        }
        return newAnswer.join("");
    }
}
