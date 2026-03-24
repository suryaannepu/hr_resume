"""
Resume PDF Generator – uses ReportLab to build a clean, ATS-friendly PDF
from a structured resume dict produced by Groq LLM.
"""
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable, ListFlowable, ListItem
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER

# ── Colour palette ──────────────────────────────────────────────────────────
DARK_BLUE   = colors.HexColor("#1e3a5f")
MID_BLUE    = colors.HexColor("#2d6aa0")
LIGHT_GREY  = colors.HexColor("#f5f5f5")
BORDER_GREY = colors.HexColor("#cccccc")
TEXT_BLACK  = colors.HexColor("#1a1a1a")
TEXT_GREY   = colors.HexColor("#555555")


def _styles():
    """Build a style sheet for the resume mimicking a premium LaTeX CV."""
    base = getSampleStyleSheet()

    name_style = ParagraphStyle(
        "ResumeName",
        parent=base["Normal"],
        fontSize=26, leading=30,
        textColor=DARK_BLUE,
        alignment=TA_CENTER,
        fontName="Times-Bold",
        spaceAfter=4,
    )
    contact_style = ParagraphStyle(
        "ResumeContact",
        parent=base["Normal"],
        fontSize=11, leading=14,
        textColor=TEXT_BLACK,
        alignment=TA_CENTER,
        fontName="Times-Roman",
        spaceAfter=8,
    )
    section_header_style = ParagraphStyle(
        "SectionHeader",
        parent=base["Normal"],
        fontSize=14, leading=18,
        textColor=DARK_BLUE,
        fontName="Times-Bold",
        spaceBefore=14, spaceAfter=4,
    )
    body_style = ParagraphStyle(
        "ResumeBody",
        parent=base["Normal"],
        fontSize=11, leading=15,
        textColor=TEXT_BLACK,
        fontName="Times-Roman",
        spaceAfter=4,
    )
    small_italic_style = ParagraphStyle(
        "SmallItalic",
        parent=base["Normal"],
        fontSize=11, leading=15,
        textColor=TEXT_GREY,
        fontName="Times-Italic",
    )
    bold_style = ParagraphStyle(
        "Bold",
        parent=base["Normal"],
        fontSize=12, leading=16,
        textColor=TEXT_BLACK,
        fontName="Times-Bold",
        spaceAfter=2,
    )
    return name_style, contact_style, section_header_style, body_style, small_italic_style, bold_style


def _bullet_list(items, body_style):
    """Convert a list of strings to a ReportLab bullet list."""
    if not items:
        return []
    list_items = [ListItem(Paragraph(str(i), body_style), leftIndent=12, bulletColor=MID_BLUE)
                  for i in items if i]
    return [ListFlowable(list_items, bulletType="bullet", leftIndent=6, bulletFontSize=6, spaceAfter=2)]


def _divider():
    return HRFlowable(width="100%", thickness=0.5, color=BORDER_GREY, spaceAfter=4, spaceBefore=2)


def generate_resume_pdf(resume: dict) -> bytes:
    """
    Build a polished PDF resume from a structured dict.

    Expected keys (all optional except 'name'):
        name, email, phone, linkedin, location,
        summary,
        experience: [{ title, company, dates, points: [...] }]
        education:  [{ degree, institution, dates, details }]
        skills:     { categories: [{ name, items: [...] }] }
        projects:   [{ name, description, tech, points: [...] }]
        certifications: [str]
    """
    buf = BytesIO()
    margin = 1.8 * cm
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=margin, rightMargin=margin,
        topMargin=1.5 * cm, bottomMargin=1.5 * cm,
    )

    name_s, contact_s, sec_s, body_s, italic_s, bold_s = _styles()
    story = []

    # ── Name ────────────────────────────────────────────────────────────────
    story.append(Paragraph(resume.get("name", "Candidate"), name_s))

    # ── Contact line ────────────────────────────────────────────────────────
    contact_parts = [
        resume.get("email", ""),
        resume.get("phone", ""),
        resume.get("linkedin", ""),
        resume.get("location", ""),
    ]
    contact_line = "  |  ".join(p for p in contact_parts if p)
    if contact_line:
        story.append(Paragraph(contact_line, contact_s))

    story.append(_divider())

    # ── Professional Summary ─────────────────────────────────────────────────
    summary = resume.get("summary", "")
    if summary:
        story.append(Paragraph("PROFESSIONAL SUMMARY", sec_s))
        story.append(_divider())
        story.append(Paragraph(str(summary), body_s))
        story.append(Spacer(1, 6))

    # ── Experience ──────────────────────────────────────────────────────────
    experience = resume.get("experience", [])
    if experience:
        story.append(Paragraph("EXPERIENCE", sec_s))
        story.append(_divider())
        for exp in experience:
            title = exp.get("title", "")
            company = exp.get("company", "")
            dates = exp.get("dates", "")
            header = f"<b>{title}</b> – {company}"
            story.append(Paragraph(header, bold_s))
            if dates:
                story.append(Paragraph(dates, italic_s))
            points = exp.get("points", [])
            if isinstance(points, list):
                story.extend(_bullet_list(points, body_s))
            elif isinstance(points, str):
                story.append(Paragraph(points, body_s))
            story.append(Spacer(1, 4))

    # ── Education ───────────────────────────────────────────────────────────
    education = resume.get("education", [])
    if education:
        story.append(Paragraph("EDUCATION", sec_s))
        story.append(_divider())
        for edu in education:
            story.append(Paragraph(f"<b>{edu.get('degree', '')}</b> – {edu.get('institution', '')}", bold_s))
            if edu.get("dates"):
                story.append(Paragraph(edu["dates"], italic_s))
            if edu.get("details"):
                story.append(Paragraph(str(edu["details"]), body_s))
            story.append(Spacer(1, 4))

    # ── Skills ──────────────────────────────────────────────────────────────
    skills = resume.get("skills", {})
    if skills:
        story.append(Paragraph("SKILLS", sec_s))
        story.append(_divider())
        categories = skills.get("categories", [])
        if categories:
            for cat in categories:
                cat_name = cat.get("name", "")
                items = cat.get("items", [])
                if items:
                    line = f"<b>{cat_name}:</b> " + ", ".join(str(i) for i in items)
                    story.append(Paragraph(line, body_s))
        else:
            # Flat list
            flat = skills.get("items", [])
            if flat:
                story.append(Paragraph(", ".join(str(i) for i in flat), body_s))
        story.append(Spacer(1, 4))

    # ── Projects ─────────────────────────────────────────────────────────────
    projects = resume.get("projects", [])
    if projects:
        story.append(Paragraph("PROJECTS", sec_s))
        story.append(_divider())
        for proj in projects:
            pname = proj.get("name", "")
            tech = proj.get("tech", "")
            desc = proj.get("description", "")
            header = f"<b>{pname}</b>"
            if tech:
                header += f"  <font color='#2d6aa0' size='8'>({tech})</font>"
            story.append(Paragraph(header, bold_s))
            if desc:
                story.append(Paragraph(str(desc), body_s))
            points = proj.get("points", [])
            if isinstance(points, list):
                story.extend(_bullet_list(points, body_s))
            story.append(Spacer(1, 4))

    # ── Certifications ───────────────────────────────────────────────────────
    certs = resume.get("certifications", [])
    if certs:
        story.append(Paragraph("CERTIFICATIONS", sec_s))
        story.append(_divider())
        story.extend(_bullet_list([str(c) for c in certs], body_s))
        story.append(Spacer(1, 4))

    doc.build(story)
    return buf.getvalue()
