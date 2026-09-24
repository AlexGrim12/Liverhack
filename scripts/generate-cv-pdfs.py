"""Genera los PDF de los CV de demostración (public/cvs/<id>.pdf) a partir de src/lib/demo/cvs.json.
Uso:  python3 scripts/generate-cv-pdfs.py     (requiere: pip install reportlab)"""
import json, os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from xml.sax.saxutils import escape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cvs = json.load(open(os.path.join(ROOT, "src/lib/demo/cvs.json"), encoding="utf-8"))
out = os.path.join(ROOT, "public/cvs"); os.makedirs(out, exist_ok=True)

PINK = colors.HexColor("#E10098")
name = ParagraphStyle("n", fontName="Helvetica-Bold", fontSize=20, leading=24)
sub = ParagraphStyle("s", fontName="Helvetica", fontSize=11, leading=14, textColor=PINK)
meta = ParagraphStyle("m", fontName="Helvetica", fontSize=9, leading=12, textColor=colors.HexColor("#555555"))
h = ParagraphStyle("h", fontName="Helvetica-Bold", fontSize=10.5, leading=14, spaceBefore=8, textColor=PINK)
b = ParagraphStyle("b", fontName="Helvetica", fontSize=9.5, leading=13)
job = ParagraphStyle("j", fontName="Helvetica-Bold", fontSize=10, leading=13, spaceBefore=4)
bul = ParagraphStyle("bl", parent=b, leftIndent=10, bulletIndent=0)
P = lambda t, s=b: Paragraph(escape(t), s)

for c in cvs:
    doc = SimpleDocTemplate(os.path.join(out, f"{c['id']}.pdf"), pagesize=A4, leftMargin=18*mm, rightMargin=18*mm, topMargin=16*mm, bottomMargin=14*mm, title=f"CV — {c['nombre']}", author=c["nombre"])
    s = [P(c["nombre"], name), P(c["titular"], sub), P(f"{c['ubicacion']}  ·  {c['email']}  ·  github.com/{c['github']}", meta), Spacer(1, 4), HRFlowable(width="100%", thickness=0.6, color=PINK)]
    s += [P("PERFIL", h), P(c["resumen"])]
    s += [P("EXPERIENCIA", h)]
    for e in c["experiencia"]:
        s += [P(f"{e['puesto']} — {e['empresa']}", job), P(e["periodo"], meta)]
        s += [Paragraph(escape(l), bul, bulletText="•") for l in e["logros"]]
    s += [P("EDUCACIÓN", h)] + [P(f"{d['titulo']} — {d['institucion']} ({d['periodo']})") for d in c["educacion"]]
    s += [P("HABILIDADES", h), P(", ".join(c["skills"]))]
    if c["certificaciones"]: s += [P("CERTIFICACIONES", h), P(", ".join(c["certificaciones"]))]
    s += [P("IDIOMAS", h), P(", ".join(f"{i['idioma']} ({i['nivel']})" for i in c["idiomas"]))]
    s += [P("INTERESES Y COMUNIDAD", h), P(", ".join(c["intereses"]))]
    s += [Spacer(1, 8), P("CV ficticio generado para la demostración de Liver Companion.", meta)]
    doc.build(s)
print(f"{len(cvs)} PDF en {out}")
