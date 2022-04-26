class Renderer {
    constructor(cat, ctx) {
        this.cat = cat;
        this.ctx = ctx;
    }

    renderTokens(tokenList, answer) {
        // Generate entry
        this.cat.querySelector(".answer").innerText = answer;
        this.cat.querySelector(".wordlist").innerHTML = "";

        if (tokenList == null) return;

        let entryElement = document.createElement("div");
        entryElement.classList.add("clue-entry");
        
        let spaceElement = document.createElement("div");
        spaceElement.classList.add("clue-space");

        for (let token of tokenList) {
            entryElement.appendChild(spaceElement.cloneNode());
            // Insert word
            let tokenElement = document.createElement("div");
            tokenElement.classList.add("clue-token");
            tokenElement.innerText = token;
            entryElement.appendChild(tokenElement);
        }
        entryElement.appendChild(spaceElement.cloneNode());
        this.cat.querySelector(".wordlist").appendChild(entryElement);
    }

    updateCursor(position) {
        let spaces = this.cat.querySelector(".wordlist").querySelectorAll(".clue-space");
        spaces.forEach((spaceElement, index) => {
            spaceElement.classList.toggle("cursor", index == position);
        });
    }

    updateMarkers(markers) {
        let spaces = this.cat.querySelector(".wordlist").querySelectorAll(".clue-space");
        spaces.forEach((spaceElement, index) => {
            spaceElement.classList.toggle("marked", markers.has(index));
        });
    }

    updateSelectedTokens(node) {
        let left = node.leftmost(), right = node.rightmost();
        let tokens = this.cat.querySelector(".wordlist").querySelectorAll(".clue-token");
        tokens.forEach((tokenElement, index) => {
            tokenElement.classList.toggle("active", left <= index && index <= right);
        });
        let spaces = this.cat.querySelector(".wordlist").querySelectorAll(".clue-space");
        spaces.forEach((spaceElement, index) => {
            spaceElement.classList.toggle("boundary", index == left || index == right + 1);
        });
    }

    renderTree(root, selectedNode = null) {
        // Re-render entire tree
        let container = this.cat.querySelector(".treenodes");
        container.innerHTML = "";

        if (root == null) return this.refreshTree();
        selectedNode = selectedNode || root;
        this.updateSelectedTokens(selectedNode);

        let currentNodes = [root];
        while (currentNodes.length) {
            let levelElement = document.createElement("div");
            levelElement.classList.add("treelevel");

            let nextNodes = [];
            for (let node of currentNodes) {
                let nodeElement = document.createElement("div");
                nodeElement.classList.add("node");
                nodeElement.classList.toggle("selected", node == selectedNode);
                nodeElement.innerHTML = node.label;
                if (node.isTerminal) {
                    nodeElement.setAttribute("data-terminal", "terminal");
                    nodeElement.setAttribute("data-start-index", node.children[0]);
                    nodeElement.setAttribute("data-end-index", node.children[1]);
                } else {
                    nodeElement.setAttribute("data-start-index", nextNodes.length);
                    nodeElement.setAttribute("data-end-index", nextNodes.length + node.children.length);
                }
                nodeElement.setAttribute("data-bound-left", node.leftmost());
                nodeElement.setAttribute("data-bound-right", node.rightmost());
                levelElement.appendChild(nodeElement);
                if (!node.isTerminal) {
                    nextNodes.push(...node.children);
                }
            }
            currentNodes = nextNodes;
            container.appendChild(levelElement);
        }

        this.refreshTree();
    }

    refreshTree() {
        // Re-compute node positions and re-render edges
        const nodeContainer = this.cat.querySelector(".treenodes");
        const leafElements = Array.from(this.cat.querySelector(".wordlist").querySelectorAll(".clue-token"));

        // New node positions
        nodeContainer.querySelectorAll(".node").forEach(nodeElement => {
            let xLeft = leafElements[nodeElement.getAttribute("data-bound-left")].getBoundingClientRect().left;
            let xRight = leafElements[nodeElement.getAttribute("data-bound-right")].getBoundingClientRect().right;
            let position = (xLeft + xRight) / 2 - nodeElement.offsetWidth / 2 - nodeElement.offsetParent.getBoundingClientRect().left;
            nodeElement.style.left = `${position}px`;
        });

        // Draw edges
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.strokeStyle = "#000000";
        this.ctx.lineWidth = 3;

        nodeContainer.querySelectorAll(".treelevel").forEach((levelElement, level) => {
            levelElement.querySelectorAll(".node").forEach((nodeElement, index) => {
                for (let target = Number(nodeElement.getAttribute("data-start-index"));
                        target < Number(nodeElement.getAttribute("data-end-index")); target++) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(...this.getNodePosition(level, index));
                    if (nodeElement.hasAttribute("data-terminal")) {
                        this.ctx.lineTo(...this.getLeafPosition(target));
                    } else {
                        this.ctx.lineTo(...this.getNodePosition(level + 1, target));
                    }
                    this.ctx.closePath();
                    this.ctx.stroke();
                }
            });
        });
    }
    
    getNodePosition(level, index) {
        let node = this.cat.querySelector(".treenodes").querySelectorAll(".treelevel")[level].querySelectorAll(".node")[index];
        let rect = node.getBoundingClientRect();
        return [rect.left + rect.width / 2, rect.top + rect.height / 2];
    }
    
    getLeafPosition(index) {
        let node = this.cat.querySelector(".wordlist").querySelectorAll(".clue-token")[index];
        let rect = node.getBoundingClientRect();
        if (this.cat.classList.contains("top-down")) {
            return [rect.left + rect.width / 2, rect.top + 1];
        }
        return [rect.left + rect.width / 2, rect.bottom - 1];
    }
}
