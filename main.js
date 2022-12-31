const defaultData = Object.freeze({
    "name": "No Puzzle",
    "clues": [["BLANK", "No clues loaded"]]
});

var lastDropTarget = null;
var cat = null;
var catinfo = null;
var canvas = null, ctx = null;

var renderer = null;
var dataset = null;


function init(data = null) {
    if (data != null) {
        // Initialize dataset
        dataset = Dataset.from(data);
    }
    catinfo.querySelector(".puzzlename").innerHTML = "";
    let searchLink = document.createElement("a");
    searchLink.setAttribute("href", dataset.searchLink);
    searchLink.setAttribute("target", "_blank");
    searchLink.innerHTML = dataset.formattedName;
    catinfo.querySelector(".puzzlename").appendChild(searchLink);
    catinfo.querySelector(".progress .total").innerText = dataset.length;
    catinfo.querySelector(".progress .current").innerText = dataset.entryIndex + 1;

    // Initialize tree builder
    window.builder = new TreeBuilder(renderer);
    builder.import(dataset.currentEntry);
    builder.renderAll();

    window.setTimeout(window.resizeBy, 0, 0, 0);

    document.removeEventListener("keydown", keyInput);
    document.addEventListener("keydown", keyInput);
}


function keyInput(event) {
    let prevent = true;
    if (event.ctrlKey || event.metaKey) {
        if (!event.shiftKey && event.key == "s") dataset.download();
        else if (!event.shiftKey && event.key == "z") builder.undo();
        else prevent = false;
    } else if (event.key == "Tab") {
        nextEntry(event.shiftKey);
    } else {
        if (event.key == "Backspace" || event.key.match(/^[a-z]$/i)) {
            builder.updateLabel(event.key);
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
}

function dropHandler(event) {
    event.preventDefault();
    document.querySelector(".dropzone").classList.remove("active");
    let reader = new FileReader();
    reader.readAsText(event.dataTransfer.files[0]);
    reader.onloadend = () => {
        try {
            dataset = new Dataset(JSON.parse(reader.result));
            init();
        } catch (e) {
            console.error(e);
            init(defaultData);
        }
    }
}

function nextEntry(reverse) {
    dataset.currentEntry["parse"] = builder.export();
    dataset.nextEntry(reverse);
    builder.import(dataset.currentEntry);
    catinfo.querySelector(".progress .current").innerText = dataset.entryIndex + 1;
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

    // Bind drag-drop
    window.addEventListener("dragenter", function(event) {
        lastDropTarget = event.target;
        document.querySelector(".dropzone").classList.add("active");
    });
    window.addEventListener("dragleave", function(event) {
        if (event.target === lastDropTarget || event.target === document) {
            document.querySelector(".dropzone").classList.remove("active");
        }
    });
    window.addEventListener("drop", dropHandler);
    window.addEventListener("dragover", function (event) {
        event.preventDefault();
        event.stopPropagation();
    });

    // Load data
    let params = new URLSearchParams(window.location.search);
    let paramString = params.has("cryptic") ? `?cryptic=${params.get("cryptic")}` :
        params.has("quiptic") ? `?quiptic=${params.get("quiptic")}` :
        "";
    let url = "cgi-bin/getpuzzle.py" + paramString;
    fetch(url).then(response => {
        console.log("Success!");
        return response.json();
    }, reason => {
        console.error("Failed to fetch puzzle, using default");
        console.error(reason);
        init();
    }).then(init);
});

window.addEventListener("resize", () => {
    canvas.setAttribute("width", document.body.offsetWidth);
    canvas.setAttribute("height", document.body.offsetHeight);
    renderer.resizeTokens();
    renderer.refreshTree();
});
