var data = [["RAPSHEET", "Spare the criminal a list of his crimes (3,5)"], ["CONDOM", "Ex-pat changes first name to Charlie for some protection (6)"], ["RESULT", "Addict returns with essentially filthy product (6)"], ["PORPOISE", "Sea creature shows weak balance with oxygen originally depleted (8)"], ["SCRAPYARD", "Break up site calling for abolition of imperial measure (9)"], ["LOWRY", "Deep line used by this painter (5)"], ["TIMBER", "Deal with motorway getting flooded by river (6)"], ["PATINA", "Polish yearly statement acknowledging a lack of alternative options? (6)"], ["HAMLET", "Stop me wandering haphazardly through village (6)"], ["ALUMNI", "Endless slander I attributed to old girls and boys (6)"], ["SHINY", "Brilliant and popular among cast (5)"], ["MEGAPHONE", "Diplomatic tool for long distance communication (9)"], ["HANDSOFF", "They're mine workers on leave (5,3)"], ["ENIGMA", "Trendy bright female, at heart, is a poser (6)"], ["HEADON", "Direct progress (4,2)"], ["PUTRIGHT", "Straighten out to take left? The reverse actually (3,5)"], ["ACE", "Point of no return for champion (3)"], ["SAUNA", "Trained guardians removing grid where it gets quite hot (5)"], ["ENTRYLEVEL", "Get ground floor flat after application (5,5)"], ["TOPERS", "Troop learns to avoid the regular drinkers (6)"], ["CURT", "Rude sentry's edging away from royal greeting (4)"], ["NEOLOGISM", "Some log in with permutation of made up expression (9)"], ["OBSERVATION", "Reformed Serb covered in praise for comment (11)"], ["CATCHPHRASE", "Just like that, perhaps, net reportedly unravels (5,6)"], ["PARLIAMENT", "Congress makes standard complaint about India (10)"], ["MUMANDDAD", "Family bank Spooner dismissed as stupid and silly (3,3,3)"], ["BEEFUP", "Augment noise of horn by adding occasional flux (4,2)"], ["HEIDI", "She sounds out difficult note for singer (5)"], ["DOWN", "Not working \u2014 had to slow consumption in the end (4)"], ["MEH", "It expresses indifference about margin being raised? (3)"]];

var cat = null;
var catinfo = null;
var canvas = null, ctx = null;

var renderer = null;
var dataset = [];
var entryIndex = 0;


function init() {
    // Initialize dataset
    for (var i = 0; i < data.length; i++) {
        let [answer, clue] = data[i];
        let tokenList = clue.split(/\s+/);
        let length = tokenList.pop();
        dataset.push({
            "answer": reformatAnswer(answer, length),
            "clue": clue,
            "tokenList": tokenList,
            "parse": Tree.create(tokenList.length).toObject(tokenList),
            "done": false
        });
    }
    catinfo.querySelector(".progress .total").innerText = dataset.length;
    catinfo.querySelector(".progress .current").innerText = entryIndex + 1;

    // Initialize tree builder
    window.builder = new TreeBuilder(renderer);
    builder.import(dataset[entryIndex]);
    builder.renderAll();

    window.setTimeout(window.resizeBy, 0, 0, 0);

    document.addEventListener("keydown", event => {
        let prevent = true;
        if (event.ctrlKey || event.metaKey) {
            if (!event.shiftKey && event.key == "s") saveAllEntries();
            else if (!event.shiftKey && event.key == "z") builder.undo();
            else prevent = false;
        } else if (event.key == "Tab") {
            nextEntry(event.shiftKey ? -1 : 1);
        } else {
            if (event.key == "Backspace" || event.key.match(/^[a-z]$/i)) {
                builder.updateLabel(event.key);
            } else if (event.key == "Enter") {
                builder.confirmLabel();
                builder.nextTree();
            } else {
                switch (event.key) {
                    case "ArrowLeft":
                        builder.cursorLeft();
                        break;
                    case "ArrowRight":
                        builder.cursorRight();
                        break;
                    case "ArrowDown":
                        builder.toggleMarker();
                        break;
                    case "ArrowUp":
                        break;
                    case " ":
                        builder.confirmLabel();
                        builder.splitTree();
                        break;
                    default:
                        prevent = false;
                        break;
                }
            }
        }
        if (prevent) event.preventDefault();
    });
}


function reformatAnswer(answer, length) {
    answer = Array.from(answer);
    let newAnswer = [];
    for (let part of length.slice(1, -1).split(/([,-])/)) {
        if (isNaN(part)) newAnswer.push(part.replace(",", " "));
        else newAnswer = newAnswer.concat(answer.splice(0, +part));
    }
    return newAnswer.join("");
}

function nextEntry(direction) {
    dataset[entryIndex]["parse"] = builder.export();
    entryIndex = (entryIndex + dataset.length + direction) % dataset.length;
    builder.import(dataset[entryIndex]);
    catinfo.querySelector(".progress .current").innerText = entryIndex + 1;
}

function saveAllEntries() {
    let string = JSON.stringify(dataset);
    let blob = new Blob([string], {"type": "text/json"});
    let url = URL.createObjectURL(blob);

    let downloadLink = document.createElement("a");
    downloadLink.setAttribute("href", url);
    downloadLink.setAttribute("download", "cat_dataset.json");

    downloadLink.click();

    URL.revokeObjectURL(url);
}


window.addEventListener("DOMContentLoaded", () => {
    // Initialize renderer
    window.canvas = document.querySelector("canvas#graphics");
    canvas.setAttribute("width", document.body.offsetWidth);
    canvas.setAttribute("height", document.body.offsetHeight);
    window.ctx = canvas.getContext("2d");
    window.cat = document.querySelector("#cat");
    window.catinfo = document.querySelector("#info");
    window.renderer = new Renderer(cat, ctx);
    // Load data
    let puzzleID = new URLSearchParams(window.location.search).get("num");
    let url = "cgi-bin/getpuzzle.py" + (puzzleID ? `?num=${puzzleID}` : "");
    fetch(url).then(response => {
        console.log("Success!");
        return response.json();
    }, reason => {
        console.error("Failed to fetch puzzle, using default");
        console.error(reason);
        init();
    }).then(json => {
        data = json;
        init();
    });
});

window.addEventListener("resize", () => {
    canvas.setAttribute("width", document.body.offsetWidth);
    canvas.setAttribute("height", document.body.offsetHeight);
    renderer.refreshTree();
});
