#!/usr/bin/env python3
"""Build the PDF readings used by the published-works page."""

from __future__ import annotations

import re
import shutil
from pathlib import Path

from reportlab.lib.pagesizes import landscape, letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas


ROOT = Path(__file__).resolve().parents[1]
POEMS = ROOT / "src" / "poems"
OUTPUT = ROOT / "public" / "documents" / "published-works"
RESOURCES = ROOT.parent / "resources" / "CONTENT_ IMAGES, VIDEOS, ETC"

SERIF = "PublishedWorksSerif"
MONO = "PublishedWorksMono"


def register_fonts() -> None:
    pdfmetrics.registerFont(
        TTFont(SERIF, "/System/Library/Fonts/Supplemental/Times New Roman.ttf")
    )
    pdfmetrics.registerFont(
        TTFont(MONO, "/System/Library/Fonts/Supplemental/Courier New.ttf")
    )


def prepare_canvas(path: Path, pagesize: tuple[float, float], title: str) -> Canvas:
    canvas = Canvas(str(path), pagesize=pagesize, pageCompression=1)
    canvas.setTitle(title)
    canvas.setAuthor("Sara H. Hammami")
    canvas.setSubject("Published poem")
    return canvas


def draw_spatial(
    source_name: str,
    output_name: str,
    *,
    pagesize: tuple[float, float],
    font_size: float,
    leading: float,
    margin_x: float,
    margin_top: float,
) -> None:
    lines = (POEMS / source_name).read_text(encoding="utf-8").splitlines()
    width, height = pagesize
    title = lines[0].strip()
    canvas = prepare_canvas(OUTPUT / output_name, pagesize, title)
    canvas.setFont(MONO, font_size)
    canvas.setFillColorRGB(0.08, 0.075, 0.065)

    y = height - margin_top
    for line in lines:
        if y < margin_top:
            canvas.showPage()
            canvas.setFont(MONO, font_size)
            canvas.setFillColorRGB(0.08, 0.075, 0.065)
            y = height - margin_top
        canvas.drawString(margin_x, y, line)
        y -= leading

    canvas.save()


def wrap_preserving_spaces(text: str, font: str, size: float, max_width: float) -> list[str]:
    """Wrap a prose line while keeping runs of spaces that carry meaning."""
    tokens = re.findall(r"\S+\s*", text)
    if not tokens:
        return [""]

    lines: list[str] = []
    current = ""
    for token in tokens:
        candidate = current + token
        if current and pdfmetrics.stringWidth(candidate.rstrip(), font, size) > max_width:
            lines.append(current.rstrip())
            current = token.lstrip() if len(token) - len(token.lstrip()) == 1 else token
        else:
            current = candidate
    if current:
        lines.append(current.rstrip())
    return lines


def draw_prose(
    source_name: str,
    output_name: str,
    *,
    font_size: float = 11.5,
    leading: float = 15.5,
    margin_x: float = 72,
    margin_top: float = 72,
) -> None:
    source_lines = (POEMS / source_name).read_text(encoding="utf-8").splitlines()
    width, height = letter
    max_width = width - (2 * margin_x)
    title = source_lines[0].strip()
    canvas = prepare_canvas(OUTPUT / output_name, letter, title)
    canvas.setFillColorRGB(0.08, 0.075, 0.065)
    y = height - margin_top

    for index, source_line in enumerate(source_lines):
        lines = wrap_preserving_spaces(source_line, SERIF, font_size, max_width)
        for line in lines:
            if y < margin_top:
                canvas.showPage()
                canvas.setFillColorRGB(0.08, 0.075, 0.065)
                y = height - margin_top
            canvas.setFont(SERIF, font_size)
            canvas.drawString(margin_x, y, line)
            y -= leading
        if source_line == "" and index > 0:
            y -= leading * 0.25

    canvas.save()


def copy_original_pdfs() -> None:
    grist = next(RESOURCES.glob("GRIST FINAL*.pdf"))
    red_pocket = RESOURCES / "Red Pocket Press - Red Pocket Press.pdf"
    shutil.copyfile(grist, OUTPUT / "te-deseo-que-suenes-bien.pdf")
    shutil.copyfile(red_pocket, OUTPUT / "imperial-silk.pdf")


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    register_fonts()
    copy_original_pdfs()

    draw_spatial(
        "iram-of-the-pillars.txt",
        "iram-of-the-pillars.pdf",
        pagesize=letter,
        font_size=9.5,
        leading=10.5,
        margin_x=54,
        margin_top=54,
    )
    draw_prose("litany-of-i-miss-yous.txt", "litany-of-i-miss-yous.pdf")
    draw_spatial(
        "self-portrait-2022.txt",
        "self-portrait-2022.pdf",
        pagesize=landscape(letter),
        font_size=10,
        leading=14,
        margin_x=48,
        margin_top=58,
    )
    draw_spatial(
        "inshallah-inshallah-inshallah.txt",
        "inshallah-inshallah-inshallah.pdf",
        pagesize=landscape(letter),
        font_size=8.7,
        leading=12.5,
        margin_x=45,
        margin_top=52,
    )


if __name__ == "__main__":
    main()
