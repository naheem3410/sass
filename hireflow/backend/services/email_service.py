import os
import resend

resend.api_key = os.environ.get("EMAIL_API_KEY", "")

EMAIL_FROM = os.environ.get("EMAIL_FROM", "noreply@hireflow.ng")


def send_verification_link(
    to: str,
    candidate_name: str,
    job_title: str,
    verification_url: str,
) -> None:
    resend.Emails.send(
        {
            "from": EMAIL_FROM,
            "to": to,
            "subject": f"Verify your application for {job_title}",
            "html": f"""
                <div style="font-family:sans-serif;max-width:600px;margin:auto;">
                    <h2>Application received</h2>
                    <p>Hi {candidate_name},</p>
                    <p>Thank you for applying for the <strong>{job_title}</strong> role.
                       Click the button below to verify your application and complete
                       the process.</p>
                    <p style="margin:32px 0;">
                        <a href="{verification_url}"
                           style="background:#000;color:#fff;padding:12px 24px;
                                  border-radius:6px;text-decoration:none;font-weight:bold;">
                            Verify my application
                        </a>
                    </p>
                    <p style="color:#666;font-size:13px;">
                        This link expires in 24 hours. If you did not apply for this
                        role, you can safely ignore this email.
                    </p>
                </div>
            """,
        }
    )


def send_otp(to: str, otp: str) -> None:
    resend.Emails.send(
        {
            "from": EMAIL_FROM,
            "to": to,
            "subject": "Your HireFlow verification code",
            "html": f"""
                <div style="font-family:sans-serif;max-width:600px;margin:auto;">
                    <h2>Verification code</h2>
                    <p>Use the code below to verify your application.
                       It expires in <strong>10 minutes</strong>.</p>
                    <div style="font-size:36px;font-weight:bold;letter-spacing:8px;
                                margin:24px 0;padding:20px;background:#f5f5f5;
                                border-radius:8px;text-align:center;">
                        {otp}
                    </div>
                    <p style="color:#666;font-size:13px;">
                        If you did not request this code, you can safely ignore this email.
                    </p>
                </div>
            """,
        }
    )
