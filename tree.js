class Tree {
    constructor(label, children, isTerminal) {
        this.label = label;
        this.children = children;
        this.isTerminal = isTerminal;
    }

    descend(splits) {
        if (!this.isTerminal) throw new Error("Can only split terminal nodes for now");
        if (splits[0] <= 0 || splits[splits.length - 1] >= this.children[this.children.length - 1]) {
            throw new Error("Splits out of bounds");
        }
        let bounds = [this.children[0], ...splits, this.children[1]];
        let newChildren = [];
        for (let i = 0; i < bounds.length - 1; i++) {
            newChildren.push(new Tree("?", [bounds[i], bounds[i + 1]], true));
        }
        this.isTerminal = false;
        this.children = newChildren;
    }

    collapse() {
        if (this.isTerminal) return;
        this.children = [this.leftmost(), this.rightmost() + 1];
        this.isTerminal = true;
    }

    leftmost() {
        return this.isTerminal ? this.children[0] : this.children[0].leftmost();
    }

    rightmost() {
        return this.isTerminal ? this.children[1] - 1 : this.children[this.children.length - 1].rightmost();
    }

    static create(length) {
        return new Tree("T", [0, length], true);
    }

    toObject(tokenList) {
        let children = [];
        if (this.isTerminal) {
            for (let i = this.children[0]; i < this.children[1]; i++) {
                children.push({
                    "type": "T",
                    "index": i,
                    "value": tokenList[i]
                });
            }
        } else {
            for (let child of this.children) {
                children.push(child.toObject(tokenList));
            }
        }
        return {
            "type": "N",
            "label": this.label,
            "children": children
        };
    }

    static fromObject(object, tokenList) {
        if (object["children"][0]["type"] == "T") {
            return new Tree(
                object["label"],
                [object["children"][0]["index"], object["children"][object["children"].length - 1]["index"] + 1],
                true
            );
        }
        return new Tree(
            object["label"],
            object["children"].map(node => Tree.fromObject(node, tokenList)),
            false
        );
    }
}
