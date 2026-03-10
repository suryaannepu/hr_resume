"""SMTP Email Service for sending styled hiring decision emails."""
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime


def _get_smtp_config():
    return {
        "host": os.getenv("EMAIL_HOST", "smtp.gmail.com"),
        "port": int(os.getenv("EMAIL_PORT", 587)),
        "email": os.getenv("EMAIL_USER", ""),
        "password": os.getenv("EMAIL_PASS", ""),
    }


def _send_email(to_email, subject, html_body):
    """Send an HTML email via SMTP."""
    cfg = _get_smtp_config()
    if not cfg["email"] or not cfg["password"]:
        print(f"⚠️  SMTP not configured — skipping email to {to_email}")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"Agentic AI Hiring <{cfg['email']}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(cfg["host"], cfg["port"], timeout=5) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(cfg["email"], cfg["password"])
            server.sendmail(cfg["email"], to_email, msg.as_string())
        print(f"✓ Email sent to {to_email}")
        return True
    except Exception as e:
        print(f"✗ Failed to send email to {to_email}: {e}")
        return False


def _base_template(content, accent_color="#4f46e5"):
    """Wrap content in a premium HTML email template."""
    return f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:60px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 40px -10px rgba(0,0,0,0.1),0 0 10px rgba(0,0,0,0.02);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg, {accent_color}, #7c3aed);padding:40px 48px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
                <span style="display:inline-block;background:rgba(255,255,255,0.2);padding:8px 16px;border-radius:12px;margin-bottom:12px;font-size:24px;">✨</span><br>
                Agentic AI Hiring
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:48px;">
              {content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f1f5f9;padding:32px 48px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
                This is an automated message from your Agentic AI Hiring Platform.<br>
                Please do not reply directly to this email.
              </p>
              <p style="margin:12px 0 0 0;color:#94a3b8;font-size:12px;font-weight:500;">
                © {datetime.now().year} Agentic AI Hiring. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def send_shortlist_email(to_email, candidate_name, job_title, company_name, details=None):
    """Send shortlist notification (accepted for interview) email to candidate."""
    skills_html = ""
    if details and details.get("matched_skills"):
        skills_list = "".join(
            f'<span style="display:inline-block;background:#e8f5ff;color:#0077b5;padding:4px 12px;'
            f'border-radius:12px;font-size:13px;margin:3px;">{s}</span>'
            for s in details["matched_skills"][:8]
        )
        skills_html = f"""
        <div style="margin-top:20px;padding:16px;background:#f0fdf4;border-radius:10px;border-left:4px solid #0cce6b;">
          <p style="margin:0 0 8px 0;font-weight:600;color:#374151;font-size:14px;">🎯 Your Matched Skills</p>
          <div>{skills_list}</div>
        </div>
        """

    score_html = ""
    if details and details.get("match_score"):
        score = details["match_score"]
        color = "#0cce6b" if score >= 80 else "#0284c7" if score >= 60 else "#d97706"
        score_html = f"""
        <div style="text-align:center;margin:20px 0;">
          <div style="display:inline-block;width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,{color}22,{color}11);border:3px solid {color};line-height:80px;font-size:28px;font-weight:800;color:{color};">
            {score}
          </div>
          <p style="margin:8px 0 0 0;color:#6c7680;font-size:13px;">AI Match Score</p>
        </div>
        """

    company_name = company_name or "Our Company"

    content = f"""
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:48px;margin-bottom:8px;">🎉</div>
      <h2 style="color:#1f2937;margin:0;font-size:22px;">Great news, {candidate_name}!</h2>
    </div>

    <p style="color:#4a5460;font-size:15px;line-height:1.7;">
      We are excited to inform you that you have been <strong>shortlisted for an interview</strong>
      for the following position:
    </p>

    <div style="background:#f8fafc;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #e5e9f0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:8px 0;">
            <span style="color:#6c7680;font-size:13px;">Position</span><br>
            <span style="color:#1f2937;font-weight:700;font-size:16px;">{job_title}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;">
            <span style="color:#6c7680;font-size:13px;">Company</span><br>
            <span style="color:#1f2937;font-weight:700;font-size:16px;">{company_name}</span>
          </td>
        </tr>
      </table>
    </div>

    {score_html}
    {skills_html}

    <p style="color:#4a5460;font-size:15px;line-height:1.7;margin-top:20px;">
      You can now log in to the portal and <strong style="color:#0077b5;">start your AI interview</strong> at your convenience.
      The interview is conducted by our AI agent and will help us understand your technical skills better.
    </p>

    <div style="text-align:center;margin-top:28px;">
      <p style="color:#6c7680;font-size:14px;">Best regards,<br>
      <strong style="color:#1f2937;">{company_name} Hiring Team</strong></p>
    </div>
    """

    subject = f"🚀 Shortlisted for Interview — {job_title} at {company_name}"
    return _send_email(to_email, subject, _base_template(content, "#0077b5"))


def send_selection_email(to_email, candidate_name, job_title, company_name, interview_score=None):
    """Send final selection/job offer email to candidate."""
    score_html = ""
    if interview_score:
        score_html = f"""
        <div style="text-align:center;margin:20px 0;">
          <div style="display:inline-block;padding:10px 20px;background:#f0fdf4;border:2px solid #0cce6b;border-radius:30px;color:#0cce6b;font-weight:800;font-size:18px;">
            Interview Score: {interview_score}%
          </div>
        </div>
        """

    content = f"""
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:48px;margin-bottom:8px;">🏆</div>
      <h2 style="color:#1f2937;margin:0;font-size:22px;">Congratulations, {candidate_name}!</h2>
    </div>

    <p style="color:#4a5460;font-size:15px;line-height:1.7;">
      Following your impressive performance in the AI interview, we are thrilled to offer you the position of
      <strong style="color:#0cce6b;">{job_title}</strong> at <strong>{company_name}</strong>!
    </p>

    {score_html}

    <div style="background:#f8fafc;border-radius:12px;padding:24px;margin:24px 0;border:1px solid #e5e9f0;text-align:center;">
      <p style="margin:0;font-size:18px;color:#1f2937;font-weight:700;">You're Hired!</p>
      <p style="margin:8px 0 0 0;color:#6c7680;font-size:14px;">Our HR team will follow up with the official paperwork and next steps shortly.</p>
    </div>

    <p style="color:#4a5460;font-size:15px;line-height:1.7;">
      We were particularly impressed with your expertise and the way you handled the interview session.
      We're excited to have you join our team and start this journey together.
    </p>

    <div style="text-align:center;margin-top:28px;">
      <p style="color:#6c7680;font-size:14px;">Welcome aboard,<br>
      <strong style="color:#1f2937;">{company_name} Leadership Team</strong></p>
    </div>
    """

    subject = f"🎊 Job Offer: You have been selected for {job_title} at {company_name}"
    return _send_email(to_email, subject, _base_template(content, "#0cce6b"))


def send_rejection_email(to_email, candidate_name, job_title, company_name, feedback=None):
    """Send styled rejection email with constructive feedback."""
    feedback_html = ""
    if feedback:
        items = ""
        if feedback.get("skill_gaps"):
            items += "".join(f"<li style='color:#4a5460;padding:4px 0;'>{g}</li>" for g in feedback["skill_gaps"][:5])
        if feedback.get("resume_improvements"):
            items += "".join(f"<li style='color:#4a5460;padding:4px 0;'>{t}</li>" for t in feedback["resume_improvements"][:3])

        if items:
            feedback_html = f"""
            <div style="margin-top:20px;padding:16px;background:#fef3c7;border-radius:10px;border-left:4px solid #d97706;">
              <p style="margin:0 0 8px 0;font-weight:600;color:#374151;font-size:14px;">💡 Areas for Growth</p>
              <ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.8;">{items}</ul>
            </div>
            """

    coach_html = ""
    if feedback and feedback.get("coach_message"):
        coach_html = f"""
        <div style="margin-top:20px;padding:16px;background:#f0f9ff;border-radius:10px;border-left:4px solid #0284c7;">
          <p style="margin:0 0 8px 0;font-weight:600;color:#374151;font-size:14px;">🎓 Coach's Advice</p>
          <p style="margin:0;color:#4a5460;font-size:14px;line-height:1.7;">{feedback['coach_message']}</p>
        </div>
        """

    content = f"""
    <h2 style="color:#1f2937;margin:0 0 16px 0;font-size:20px;">Dear {candidate_name},</h2>

    <p style="color:#4a5460;font-size:15px;line-height:1.7;">
      Thank you for your interest in the <strong>{job_title}</strong> position at <strong>{company_name}</strong>
      and for taking the time to apply.
    </p>

    <p style="color:#4a5460;font-size:15px;line-height:1.7;">
      After careful review by our AI hiring committee, we have decided to move forward with other candidates
      whose profiles more closely match our current requirements.
    </p>

    {feedback_html}
    {coach_html}

    <p style="color:#4a5460;font-size:15px;line-height:1.7;margin-top:20px;">
      We encourage you to apply for future openings that match your profile. We wish you the very best
      in your career journey.
    </p>

    <div style="text-align:center;margin-top:28px;">
      <p style="color:#6c7680;font-size:14px;">Warm regards,<br>
      <strong style="color:#1f2937;">{company_name} Hiring Team</strong></p>
    </div>
    """

    subject = f"Application Update — {job_title} at {company_name}"
    return _send_email(to_email, subject, _base_template(content, "#374151"))


def send_interview_report_email(to_email, candidate_name, job_title, evaluation):
    """Send candidate their official AI Interview Performance Report."""
    score_html = ""
    if evaluation.get("overall_score"):
        score = evaluation["overall_score"]
        color = "#0cce6b" if score >= 80 else "#0284c7" if score >= 60 else "#d97706"
        score_html = f"""
        <div style="text-align:center;margin:20px 0;">
          <div style="display:inline-block;width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,{color}22,{color}11);border:3px solid {color};line-height:80px;font-size:28px;font-weight:800;color:{color};">
            {score}
          </div>
          <p style="margin:8px 0 0 0;color:#6c7680;font-size:13px;">Overall Interview Score</p>
        </div>
        """

    content = f"""
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:48px;margin-bottom:8px;">📊</div>
      <h2 style="color:#1f2937;margin:0;font-size:22px;">Your AI Interview Results</h2>
    </div>

    <p style="color:#4a5460;font-size:15px;line-height:1.7;">
      Hi {candidate_name},
    </p>
    <p style="color:#4a5460;font-size:15px;line-height:1.7;">
      Thank you for completing your Official Panel AI Interview for the <strong>{job_title}</strong> position. 
      Your interview responses have been analyzed by our AI system, and your official performance report is ready.
    </p>

    {score_html}

    <div style="background:#f8fafc;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #e5e9f0;">
      <p style="margin:0 0 8px 0;font-weight:600;color:#374151;font-size:14px;">Detailed Feedback</p>
      <p style="color:#4a5460;font-size:15px;line-height:1.7;">{evaluation.get("detailed_feedback", "N/A")}</p>
    </div>

    <p style="color:#4a5460;font-size:15px;line-height:1.7;margin-top:20px;">
      The recruitment team will review these results alongside your initial application and be in touch regarding the next steps in the hiring process.
    </p>

    <div style="text-align:center;margin-top:28px;">
      <p style="color:#6c7680;font-size:14px;">Best regards,<br>
      <strong style="color:#1f2937;">Your Hiring Team</strong></p>
    </div>
    """

    subject = f"Your AI Interview Results — {job_title}"
    return _send_email(to_email, subject, _base_template(content, "#0284c7"))
