#!/usr/bin/python3

import cgitb
from typing import Tuple
cgitb.enable()

import bs4
import cgi
import requests
import json
from collections import namedtuple


CrypticClue = namedtuple("CrypticClue", ["answer", "clue", "definition_span", "explanation"])


def _main():
    # Get URL
    form = cgi.FieldStorage()
    url = form.getvalue("url", "https://www.fifteensquared.net/2022/04/21/guardian-28737-anto/")

    # Download HTML
    r = requests.get(url)
    assert r.status_code == 200

    # Parse HTML and retrieve table
    document = bs4.BeautifulSoup(r.text, "lxml")
    content = document.select("div.entry-content")[0]

    # Choose extraction method
    clues = []
    table = extract_table(content)
    for row in extract_rows(table):
        clues.append(extract_clue(row))

    print("Content-Type: text/plain")
    print()
    print(clues)


def extract_table(content: bs4.Tag) -> bs4.Tag:
    """Extract a table or div containing all clues and answers."""
    possibilities = content.select("div.fts table") or content.select("table")
    return max(possibilities, key=lambda e: len(e("tr")))


def extract_rows(table: bs4.Tag):
    """Iterate over rows/clues."""
    rows = table.find_all("tr")
    heuristic = [len(row.find_all("td")) for row in rows]
    if ",".join(map(str, heuristic)).count("3,2") > 5:
        # Assume alternating clue and explanation
        for i, _ in enumerate(rows):
            if heuristic[i] != 3:
                continue
            _, answer, clue = rows[i].find_all("td")
            _, explanation = rows[i + 1].find_all("td")
            explanation = explanation.get_text()
            yield (answer, clue, explanation)
    else:
        # Assume clue and explanation together
        for row in rows:
            if heuristic[i] != 3:
                continue
            _, answer, clue = row.find_all("td")
            clue, *explanations = clue.contents
            explanation = "".join(tag.string or "" for tag in explanations)
            yield (answer, clue, explanation)


def extract_clue(row: Tuple[bs4.Tag, bs4.Tag, str]) -> CrypticClue:
    answer_cell, clue_cell, explanation = row
    answer_string = answer_cell.string.replace("\xa0", "-")
    explanation = explanation.strip()
    # Parse clue cell
    pass
    #
    return CrypticClue(answer_string, None, None, explanation)


def extract_type0(table: bs4.Tag):
    clues = []
    for row in table("tr"):
        if len(row("td")) != 3:
            continue
        # Extract answer and explanation
        _, answer_cell, clue_cell = row("td")
        answer = answer_cell.string.replace("\xa0", "-")
        clue_tag, *explanations = clue_cell.contents
        explanation = "".join(tag.string or "" for tag in explanations)
        assert clue_tag.name == "font"
        # Extract clue definition span
        defn_start_idx = 0
        for child in clue_tag.children:
            if isinstance(child, bs4.NavigableString):
                defn_start_idx += len(child.strip().split())
            elif isinstance(child, bs4.Tag) and child.name == "u":
                break
        defn_end_idx = defn_start_idx + len(clue_tag.find("u").string.strip().split())
        # Store answer, clue, explanation, and span
        clues.append((answer, clue_tag.get_text(), (defn_start_idx, defn_end_idx), explanation))
    return clues


def extract_fts(table: bs4.Tag):
    clues = []
    for row in table("tr"):
        # Extract explanation and append to previous clue if needed
        if len(row("td")) != 3:
            if "fts-subgroup" in row.get_attribute_list('class') and clues and not clues[-1][-1]:
                clues[-1] = clues[-1][:-1] + (row.get_text().strip(),)
            continue
        # Extract answer
        _, _, clue_cell = row("td")
        answer = table.select_one("span.fts-answer").string.replace("\xa0", "-")
        clue_tag = clue_cell.find("div")
        # Extract clue definition span
        defn_start_idx = 0
        for child in clue_tag.children:
            if isinstance(child, bs4.NavigableString):
                defn_start_idx += len(child.strip().split())
            elif isinstance(child, bs4.Tag):
                if "fts-definition" in child['class']:
                    break
                defn_start_idx += len(child.string.strip().split())
        defn_end_idx = defn_start_idx + len(clue_tag.select_one("span.fts-definition").string.strip().split())
        # Store answer, clue, and span
        clues.append((answer, clue_tag.get_text(), (defn_start_idx, defn_end_idx), ""))
    return clues


if __name__ == "__main__":
    try:
        _main()
    except Exception as e:
        print("Status: 400 Bad request")
        print("Content-Type: text/html")
        print()
        raise e