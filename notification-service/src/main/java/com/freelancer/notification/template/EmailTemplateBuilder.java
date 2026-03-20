package com.freelancer.notification.template;

import com.freelancer.notification.enums.NotificationEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
public class EmailTemplateBuilder {

    @Value("${app.name}")
    private String appName;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    // Returns email subject for each event
    public String buildSubject(NotificationEvent event,
                                Map<String, String> data) {
        return switch (event) {
            case WELCOME ->
                "Welcome to " + appName + "!";
            case PROFILE_UPDATED ->
                "Your profile has been updated";
            case JOB_POSTED ->
                "Your job has been posted: "
                + data.getOrDefault("jobTitle", "");
            case JOB_MATCHES_SKILLS ->
                "New job matches your skills: "
                + data.getOrDefault("jobTitle", "");
            case BID_RECEIVED ->
                "New bid received on: "
                + data.getOrDefault("jobTitle", "");
            case BID_ACCEPTED ->
                "Congratulations! Your bid was accepted";
            case BID_REJECTED ->
                "Update on your bid for: "
                + data.getOrDefault("jobTitle", "");
            case BID_WITHDRAWN ->
                "A freelancer withdrew their bid";
            case CONTRACT_CREATED ->
                "Contract created for: "
                + data.getOrDefault("jobTitle", "");
            case PROGRESS_REPORT_SUBMITTED ->
                "New progress report submitted";
            case REPORT_APPROVED ->
                "Your progress report was approved!";
            case REVISION_REQUESTED ->
                "Revision requested on your progress report";
            case MILESTONE_APPROVED ->
                "Milestone approved: "
                + data.getOrDefault("milestoneTitle", "");
            case CONTRACT_COMPLETED ->
                "Contract completed successfully!";
            case FILE_UPLOADED ->
                "New file uploaded to your project";
            case REVIEW_RECEIVED ->
                "You received a new review";
        };
    }

    // Returns HTML email body for each event
    public String buildBody(String recipientName,
                             NotificationEvent event,
                             Map<String, String> data) {
        String greeting = buildGreeting(recipientName);
        String content  = buildContent(event, data, recipientName);
        String footer   = buildFooter();

        return wrapInLayout(greeting + content + footer);
    }

    // ─────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────

    private String buildGreeting(String name) {
        return """
                <div style="margin-bottom:24px">
                  <h2 style="color:#2C2C2A;margin:0">
                    Hi %s,
                  </h2>
                </div>
                """.formatted(name);
    }

    private String buildContent(NotificationEvent event,
                                 Map<String, String> data,
                                 String recipientName) {
        return switch (event) {

            case WELCOME -> """
                    <p>Welcome to <strong>%s</strong>!
                    We are excited to have you on board.</p>
                    <p>Your account has been created successfully.
                    You can now start exploring the platform.</p>
                    <a href="%s" style="%s">
                      Get Started
                    </a>
                    """.formatted(appName, frontendUrl, btnStyle());

            case JOB_POSTED -> """
                    <p>Your job has been posted successfully!</p>
                    <div style="%s">
                      <strong>Job Title:</strong> %s<br/>
                      <strong>Budget:</strong> $%s - $%s<br/>
                      <strong>Status:</strong> Open for bids
                    </div>
                    <p>Freelancers can now find and bid on your job.</p>
                    """.formatted(
                            cardStyle(),
                            data.getOrDefault("jobTitle", ""),
                            data.getOrDefault("budgetMin", ""),
                            data.getOrDefault("budgetMax", ""));

            case JOB_MATCHES_SKILLS -> """
                    <p>A new job matching your skills was just posted!</p>
                    <div style="%s">
                      <strong>Job Title:</strong> %s<br/>
                      <strong>Budget:</strong> $%s - $%s<br/>
                      <strong>Skills needed:</strong> %s
                    </div>
                    <a href="%s/jobs/%s" style="%s">
                      View Job
                    </a>
                    """.formatted(
                            cardStyle(),
                            data.getOrDefault("jobTitle", ""),
                            data.getOrDefault("budgetMin", ""),
                            data.getOrDefault("budgetMax", ""),
                            data.getOrDefault("requiredSkills", ""),
                            frontendUrl,
                            data.getOrDefault("jobId", ""),
                            btnStyle());

            case BID_RECEIVED -> """
                    <p>A freelancer has placed a bid on your job!</p>
                    <div style="%s">
                      <strong>Job:</strong> %s<br/>
                      <strong>Freelancer:</strong> %s<br/>
                      <strong>Bid Amount:</strong> $%s<br/>
                      <strong>Estimated Days:</strong> %s days
                    </div>
                    <a href="%s/jobs/%s/bids" style="%s">
                      Review Bid
                    </a>
                    """.formatted(
                            cardStyle(),
                            data.getOrDefault("jobTitle", ""),
                            data.getOrDefault("freelancerName", ""),
                            data.getOrDefault("bidAmount", ""),
                            data.getOrDefault("estimatedDays", ""),
                            frontendUrl,
                            data.getOrDefault("jobId", ""),
                            btnStyle());

            case BID_ACCEPTED -> """
                    <p>Great news! Your bid has been accepted!</p>
                    <div style="%s">
                      <strong>Job:</strong> %s<br/>
                      <strong>Client:</strong> %s<br/>
                      <strong>Agreed Amount:</strong> $%s
                    </div>
                    <p>A contract has been created.
                       You can now start working on the project.</p>
                    <a href="%s/contracts" style="%s">
                      View Contract
                    </a>
                    """.formatted(
                            cardStyle(),
                            data.getOrDefault("jobTitle", ""),
                            data.getOrDefault("clientName", ""),
                            data.getOrDefault("agreedAmount", ""),
                            frontendUrl,
                            btnStyle());

            case BID_REJECTED -> """
                    <p>Unfortunately your bid was not selected
                       this time.</p>
                    <div style="%s">
                      <strong>Job:</strong> %s<br/>
                      <strong>Your Bid:</strong> $%s
                    </div>
                    <p>Don't give up! There are many more
                       opportunities available.</p>
                    <a href="%s/jobs" style="%s">
                      Browse More Jobs
                    </a>
                    """.formatted(
                            cardStyle(),
                            data.getOrDefault("jobTitle", ""),
                            data.getOrDefault("bidAmount", ""),
                            frontendUrl,
                            btnStyle());

            case CONTRACT_CREATED -> """
                    <p>A new contract has been created!</p>
                    <div style="%s">
                      <strong>Job:</strong> %s<br/>
                      <strong>Agreed Amount:</strong> $%s<br/>
                      <strong>Start Date:</strong> %s
                    </div>
                    <a href="%s/contracts" style="%s">
                      View Contract
                    </a>
                    """.formatted(
                            cardStyle(),
                            data.getOrDefault("jobTitle", ""),
                            data.getOrDefault("agreedAmount", ""),
                            data.getOrDefault("startDate", ""),
                            frontendUrl,
                            btnStyle());

            case PROGRESS_REPORT_SUBMITTED -> """
                    <p>Your freelancer has submitted a
                       progress report.</p>
                    <div style="%s">
                      <strong>Milestone:</strong> %s<br/>
                      <strong>Progress:</strong> %s%%<br/>
                      <strong>Report Title:</strong> %s
                    </div>
                    <p>Please review and approve or request
                       a revision.</p>
                    <a href="%s/contracts/%s" style="%s">
                      Review Report
                    </a>
                    """.formatted(
                            cardStyle(),
                            data.getOrDefault("milestoneTitle", ""),
                            data.getOrDefault("percentage", ""),
                            data.getOrDefault("reportTitle", ""),
                            frontendUrl,
                            data.getOrDefault("contractId", ""),
                            btnStyle());

            case REPORT_APPROVED -> """
                    <p>Your progress report has been approved
                       by the client!</p>
                    <div style="%s">
                      <strong>Milestone:</strong> %s<br/>
                      <strong>Report:</strong> %s
                    </div>
                    <p>Keep up the great work!</p>
                    """.formatted(
                            cardStyle(),
                            data.getOrDefault("milestoneTitle", ""),
                            data.getOrDefault("reportTitle", ""));

            case REVISION_REQUESTED -> """
                    <p>The client has requested a revision
                       on your progress report.</p>
                    <div style="%s">
                      <strong>Milestone:</strong> %s<br/>
                      <strong>Client Feedback:</strong> %s
                    </div>
                    <p>Please review the feedback and
                       submit an updated report.</p>
                    <a href="%s/contracts/%s" style="%s">
                      View Feedback
                    </a>
                    """.formatted(
                            cardStyle(),
                            data.getOrDefault("milestoneTitle", ""),
                            data.getOrDefault("feedback", ""),
                            frontendUrl,
                            data.getOrDefault("contractId", ""),
                            btnStyle());

            case MILESTONE_APPROVED -> """
                    <p>A milestone has been approved!</p>
                    <div style="%s">
                      <strong>Milestone:</strong> %s<br/>
                      <strong>Amount:</strong> $%s
                    </div>
                    """.formatted(
                            cardStyle(),
                            data.getOrDefault("milestoneTitle", ""),
                            data.getOrDefault("milestoneAmount", ""));

            case CONTRACT_COMPLETED -> """
                    <p>The contract has been completed
                       successfully!</p>
                    <div style="%s">
                      <strong>Job:</strong> %s<br/>
                      <strong>Total Amount:</strong> $%s
                    </div>
                    <p>Please take a moment to leave a review.</p>
                    <a href="%s/contracts/%s/review" style="%s">
                      Leave a Review
                    </a>
                    """.formatted(
                            cardStyle(),
                            data.getOrDefault("jobTitle", ""),
                            data.getOrDefault("totalAmount", ""),
                            frontendUrl,
                            data.getOrDefault("contractId", ""),
                            btnStyle());

            case FILE_UPLOADED -> """
                    <p>A new file has been uploaded
                       to your project.</p>
                    <div style="%s">
                      <strong>File:</strong> %s<br/>
                      <strong>Uploaded by:</strong> %s
                    </div>
                    <a href="%s/contracts/%s" style="%s">
                      View File
                    </a>
                    """.formatted(
                            cardStyle(),
                            data.getOrDefault("fileName", ""),
                            data.getOrDefault("uploaderName", ""),
                            frontendUrl,
                            data.getOrDefault("contractId", ""),
                            btnStyle());

            case REVIEW_RECEIVED -> """
                    <p>You have received a new review!</p>
                    <div style="%s">
                      <strong>Rating:</strong> %s / 5<br/>
                      <strong>Comment:</strong> %s
                    </div>
                    <a href="%s/profile" style="%s">
                      View Your Profile
                    </a>
                    """.formatted(
                            cardStyle(),
                            data.getOrDefault("rating", ""),
                            data.getOrDefault("comment", ""),
                            frontendUrl,
                            btnStyle());

            default -> """
                    <p>You have a new notification
                       from %s.</p>
                    """.formatted(appName);
        };
    }

    private String buildFooter() {
        return """
                <hr style="border:none;border-top:1px solid
                           #E8E6E0;margin:32px 0"/>
                <p style="color:#888780;font-size:12px">
                  This email was sent by %s.<br/>
                  If you did not expect this email,
                  please ignore it.
                </p>
                """.formatted(appName);
    }

    private String wrapInLayout(String content) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8"/>
                  <meta name="viewport"
                        content="width=device-width,
                                 initial-scale=1.0"/>
                </head>
                <body style="margin:0;padding:0;
                             background:#F1EFE8;
                             font-family:Arial,sans-serif">
                  <table width="100%%" cellpadding="0"
                         cellspacing="0" border="0"
                         style="background:#F1EFE8">
                    <tr>
                      <td align="center" style="padding:40px 20px">
                        <table width="600" cellpadding="0"
                               cellspacing="0" border="0"
                               style="background:#FFFFFF;
                                      border-radius:12px;
                                      overflow:hidden">
                          <tr>
                            <td style="background:#2C2C2A;
                                       padding:24px 32px">
                              <h1 style="color:#FFFFFF;
                                         margin:0;
                                         font-size:22px">
                                %s
                              </h1>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:32px;
                                       color:#2C2C2A;
                                       font-size:15px;
                                       line-height:1.6">
                              %s
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(appName, content);
    }

    private String btnStyle() {
        return "display:inline-block;background:#534AB7;" +
               "color:#FFFFFF;padding:12px 24px;" +
               "border-radius:8px;text-decoration:none;" +
               "font-weight:bold;margin-top:16px";
    }

    private String cardStyle() {
        return "background:#F1EFE8;border-radius:8px;" +
               "padding:16px;margin:16px 0;line-height:1.8";
    }
}