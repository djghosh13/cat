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
    url = "https://www.theguardian.com/crosswords/cryptic/" + str(form.getvalue("num", random.randrange(27000, 28000)))

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
        if re.search(r"\([0-9\-,]+\)$", entry["clue"]):
            clues.append((entry["solution"], entry["clue"].strip().replace("  ", " ")))

    print("Content-Type: text/json")
    print()
    print(json.dumps(clues))


if __name__ == "__main__":
    try:
        _main()
    except Exception as e:
        print("Status: 400 Bad request")
        print("Content-Type: text/html")
        print()
        raise e