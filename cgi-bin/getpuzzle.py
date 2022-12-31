#!/usr/bin/python3

"""Retrieve a puzzle from The Guardian and return a list of clues and answers."""

import cgi
import cgitb
import json
import random
import re
from collections import namedtuple
import bs4
import requests


cgitb.enable()
CrypticClue = namedtuple("CrypticClue", ["answer", "clue"])


def _main():
    # Get URL
    form = cgi.FieldStorage()
    if "cryptic" in form:
        url = f"https://www.theguardian.com/crosswords/cryptic/{form.getfirst('cryptic')}"
    elif "quiptic" in form:
        url = f"https://www.theguardian.com/crosswords/quiptic/{form.getfirst('quiptic')}"
    else:
        url = f"https://www.theguardian.com/crosswords/cryptic/{random.randrange(27000, 28000)}"

    # Download HTML
    r = requests.get(url)
    assert r.status_code == 200

    # Parse HTML and retrieve puzzle
    document = bs4.BeautifulSoup(r.text, "lxml")
    puzzletext = document.select_one("div.js-crossword")["data-crossword-data"]
    puzzle = json.loads(puzzletext)

    # Extract list of clues
    clues = []
    for entry in puzzle["entries"]:
        if entry["id"] != entry["group"][0]:
            continue
        solution = entry["solution"]
        for otherid in entry["group"][1:]:
            otherentry, *_ = filter(lambda e, i=otherid: e["id"] == i, puzzle["entries"])
            solution += otherentry["solution"]
        clues.append(CrypticClue(solution, entry["clue"].strip().replace("  ", " ").replace("\u00ad", "")))

    puzzlename = " ".join(re.sub(r"[^A-Za-z0-9]", "", word.capitalize()) for word in puzzle["name"].split())
    output = {
        "name": puzzlename,
        "clues": clues
    }

    print("Content-Type: text/json")
    print()
    print(json.dumps(output))


if __name__ == "__main__":
    try:
        _main()
    except Exception as e:
        print("Status: 400 Bad request")
        print("Content-Type: text/html")
        print()
        raise e
