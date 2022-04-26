class TreeBuilder {
    constructor(renderer) {
        this.renderer = renderer;

        this.level = 0;
        this.index = 0;

        this.labelSearch = new LabelSearch(this.level);
        this.cursor = -1;
        this.markers = new Set();
        
        this.answer = null;
        this.tokenList = null;
        this.root = null;
        this.bfs = null;
        this.history = [];
    }

    get currentTree() {
        return this.bfs[this.level][this.index];
    }

    export() {
        return this.root.toObject(this.tokenList);
    }

    import(data) {
        this.answer = data["answer"];
        this.tokenList = data["tokenList"];
        this.root = Tree.fromObject(data["parse"], this.tokenList);
        this.reset();
    }

    renderAll() {
        this.renderer.updateLabelList(this.labelSearch.base);
        this.renderer.renderTokens(this.tokenList, this.answer);
        this.renderer.updateCursor(this.cursor);
        this.renderer.updateMarkers(this.markers);
        this.renderer.renderTree(this.root, this.currentTree);
    }

    reset() {
        this.bfs = [[this.root]];
        this.history = [];
        for (let level = 0; level < this.bfs.length; level++) {
            for (let index = 0; index < this.bfs[level].length; index++) {
                if (!this.bfs[level][index].isTerminal) {
                    if (level == this.bfs.length - 1) this.bfs.push([]);
                    this.bfs[level + 1].push(...this.bfs[level][index].children);
                }
                this.history.push([level, index]);
            }
        }
        [this.level, this.index] = this.history.pop();

        this.resetLabelSearch();
        this.cursor = -1;
        this.markers = new Set();
        // Refresh
        this.renderAll();
    }

    resetLabelSearch() {
        this.labelSearch = new LabelSearch(this.level);
        this.renderer.updateLabelList(this.labelSearch.base)
    }

    cursorLeft() {
        let left = this.currentTree.leftmost(), right = this.currentTree.rightmost();
        if (left < right) {
            this.cursor = (this.cursor == -1) ? right
                : (this.cursor == left + 1) ? -1
                : this.cursor - 1;
        } else {
            this.cursor = -1;
        }
        // Refresh
        this.renderer.updateCursor(this.cursor);
    }

    cursorRight() {
        let left = this.currentTree.leftmost(), right = this.currentTree.rightmost();
        if (left < right) {
            this.cursor = (this.cursor == -1) ? left + 1
                : (this.cursor == right) ? -1
                : this.cursor + 1;
        } else {
            this.cursor = -1;
        }
        // Refresh
        this.renderer.updateCursor(this.cursor);
    }

    toggleMarker() {
        if (this.cursor == -1) return;
        if (this.markers.has(this.cursor)) this.markers.delete(this.cursor);
        else this.markers.add(this.cursor);
        // Refresh
        this.renderer.updateMarkers(this.markers);
    }

    nextTree() {
        if (this.index + 1 < this.bfs[this.level].length) {
            this.history.push([this.level, this.index]);
            this.index++;
        } else if (this.level + 1 < this.bfs.length) {
            this.history.push([this.level, this.index]);
            this.level++;
            this.index = 0;
        }

        this.resetLabelSearch();
        this.cursor = -1;
        this.markers = new Set();
        // Refresh
        this.renderer.updateCursor(this.cursor);
        this.renderer.updateMarkers(this.markers);
        this.renderer.renderTree(this.root, this.currentTree);
    }

    splitTree() {
        this.currentTree.descend(Array.from(this.markers).sort((a, b) => a - b));
        if (this.level == this.bfs.length - 1) this.bfs.push([]);
        this.bfs[this.level + 1].push(...this.currentTree.children);

        this.nextTree();
    }

    undo() {
        if (this.history.length) {
            let [prevLevel, prevIndex] = this.history.pop();
            this.level = prevLevel;
            this.index = prevIndex;
            if (!this.currentTree.isTerminal) {
                this.bfs[this.level + 1] = this.bfs[this.level + 1].filter(node => this.currentTree.children.indexOf(node) == -1);
                if (this.bfs[this.level + 1].length == 0) this.bfs.pop();
                this.currentTree.collapse();
            }
        }
        this.resetLabelSearch();
        this.cursor = -1;
        this.markers = new Set();
        // Refresh
        this.renderer.updateCursor(this.cursor);
        this.renderer.updateMarkers(this.markers);
        this.renderer.renderTree(this.root, this.currentTree);
    }

    updateLabel(key) {
        this.labelSearch.update(key);
        if (this.level != 0) {
            this.currentTree.label = this.labelSearch.search || "?";
            this.renderer.renderTree(this.root, this.currentTree);
        }
    }

    confirmLabel() {
        let label = this.labelSearch.confirm();
        if (label != null) {
            this.currentTree.label = label;
        }
        // Refresh
        this.resetLabelSearch();
        this.renderer.updateCursor(this.cursor);
        this.renderer.updateMarkers(this.markers);
        this.renderer.renderTree(this.root, this.currentTree);
    }
}
