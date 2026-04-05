using System.Net;
using System.Net.Mail;
using LicenseManagement.API.Data;
using Microsoft.EntityFrameworkCore;

namespace LicenseManagement.API.Services
{
    public class LicenseReminderService : BackgroundService
    {
        private readonly IServiceProvider _services;
        private readonly IConfiguration _config;
        private readonly ILogger<LicenseReminderService> _logger;
        private readonly TimeSpan _interval = TimeSpan.FromHours(24);

        public LicenseReminderService(
            IServiceProvider services,
            IConfiguration config,
            ILogger<LicenseReminderService> logger)
        {
            _services = services;
            _config   = config;
            _logger   = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("🔔 License Reminder Service started");
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try   { await SendReminderEmailsAsync(); }
                catch (Exception ex) { _logger.LogError(ex, "❌ Error sending reminder emails"); }
                await Task.Delay(_interval, stoppingToken);
            }
        }

        private async Task SendReminderEmailsAsync()
        {
            using var scope = _services.CreateScope();
            var db    = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var today = DateTime.UtcNow.Date;

            // ExpiryDate is DateTime (not nullable)
            var expiring = await db.Licenses
                .Include(l => l.Vendor)
                .Include(l => l.Department)
                .Where(l => l.ExpiryDate >= today && l.ExpiryDate <= today.AddDays(90))
                .OrderBy(l => l.ExpiryDate)
                .ToListAsync();

            if (!expiring.Any())
            {
                _logger.LogInformation("✅ No expiring licenses today, skipping email");
                return;
            }

            var critical = expiring.Where(l => (l.ExpiryDate.Date - today).Days <= 30).ToList();
            var warning  = expiring.Where(l => (l.ExpiryDate.Date - today).Days is > 30 and <= 60).ToList();
            var notice   = expiring.Where(l => (l.ExpiryDate.Date - today).Days is > 60 and <= 90).ToList();

            var html = BuildEmailHtml(critical, warning, notice, today);

            await SendEmailAsync(
                subject: $"[دارة الملك عبدالعزيز] تنبيه انتهاء الرخص — {today:yyyy-MM-dd}",
                htmlBody: html
            );

            _logger.LogInformation($"📧 Reminder sent: {expiring.Count} licenses ({critical.Count} critical)");
        }

        private string BuildEmailHtml(
            List<LicenseManagement.API.Models.License> critical,
            List<LicenseManagement.API.Models.License> warning,
            List<LicenseManagement.API.Models.License> notice,
            DateTime today)
        {
            static string Row(LicenseManagement.API.Models.License l, DateTime today)
            {
                var days  = (l.ExpiryDate.Date - today).Days;
                var color = days <= 30 ? "#DC2626" : days <= 60 ? "#D97706" : "#059669";
                var bg    = days <= 30 ? "#FEF2F2" : "#FFFBEB";
                return $@"
                <tr style='background:{bg}'>
                    <td style='padding:10px 14px;font-size:13px;font-weight:600;color:#0D0F14'>{l.Name}</td>
                    <td style='padding:10px 14px;font-size:12px;color:#6B7280'>{l.Vendor?.Name ?? "—"}</td>
                    <td style='padding:10px 14px;font-size:12px;color:#6B7280'>{l.ExpiryDate:yyyy-MM-dd}</td>
                    <td style='padding:10px 14px;font-size:14px;font-weight:700;color:{color}'>{days} يوم</td>
                </tr>";
            }

            static string Section(string title, string color,
                List<LicenseManagement.API.Models.License> items, DateTime today)
            {
                if (!items.Any()) return "";
                var rows = string.Join("\n", items.Select(l => Row(l, today)));
                return $@"
                <h3 style='margin:24px 0 8px;font-size:13px;font-weight:700;letter-spacing:1px;
                           text-transform:uppercase;color:{color};border-bottom:2px solid {color};
                           padding-bottom:6px'>{title} ({items.Count})</h3>
                <table style='width:100%;border-collapse:collapse;font-family:Arial,sans-serif;margin-bottom:16px'>
                    <thead>
                        <tr style='background:#F3F4F6'>
                            <th style='padding:8px 14px;text-align:right;font-size:11px;color:#6B7280;font-weight:700'>اسم الرخصة</th>
                            <th style='padding:8px 14px;text-align:right;font-size:11px;color:#6B7280;font-weight:700'>المورّد</th>
                            <th style='padding:8px 14px;text-align:right;font-size:11px;color:#6B7280;font-weight:700'>تاريخ الانتهاء</th>
                            <th style='padding:8px 14px;text-align:right;font-size:11px;color:#6B7280;font-weight:700'>المتبقي</th>
                        </tr>
                    </thead>
                    <tbody>{rows}</tbody>
                </table>";
            }

            return $@"
<!DOCTYPE html>
<html dir='rtl' lang='ar'>
<head><meta charset='UTF-8'></head>
<body style='margin:0;padding:0;background:#F4F5F7;font-family:Arial,sans-serif;direction:rtl'>
<div style='max-width:680px;margin:32px auto;background:#FAF6F0;border:1px solid #D6CCBE'>

    <div style='background:#1A3A2A;padding:24px 28px'>
        <div style='font-size:18px;font-weight:700;color:#FAF6F0'>دارة الملك عبدالعزيز</div>
        <div style='font-size:11px;color:#8BAF97;letter-spacing:1px;margin-top:3px'>نظام إدارة الرخص — تقرير يومي</div>
    </div>

    <div style='background:#254D38;padding:14px 28px;display:flex;gap:24px'>
        <div style='text-align:center'>
            <div style='font-size:24px;font-weight:700;color:#DC2626'>{critical.Count}</div>
            <div style='font-size:10px;color:#8BAF97;text-transform:uppercase'>حرجة (30 يوم)</div>
        </div>
        <div style='width:1px;background:#2F6045'></div>
        <div style='text-align:center'>
            <div style='font-size:24px;font-weight:700;color:#D97706'>{warning.Count}</div>
            <div style='font-size:10px;color:#8BAF97;text-transform:uppercase'>تحذير (60 يوم)</div>
        </div>
        <div style='width:1px;background:#2F6045'></div>
        <div style='text-align:center'>
            <div style='font-size:24px;font-weight:700;color:#059669'>{notice.Count}</div>
            <div style='font-size:10px;color:#8BAF97;text-transform:uppercase'>تنبيه (90 يوم)</div>
        </div>
        <div style='flex:1'></div>
        <div style='text-align:center;align-self:center'>
            <div style='font-size:12px;color:#8BAF97'>{today:dd MMMM yyyy}</div>
        </div>
    </div>

    <div style='padding:24px 28px'>
        {Section("🔴 رخص حرجة — تنتهي خلال 30 يوماً", "#DC2626", critical, today)}
        {Section("🟡 تحذير — تنتهي خلال 60 يوماً", "#D97706", warning, today)}
        {Section("🟢 تنبيه — تنتهي خلال 90 يوماً", "#059669", notice, today)}
    </div>

    <div style='background:#1A3A2A;padding:14px 28px;text-align:center'>
        <div style='font-size:10px;color:#8BAF97'>
            تم الإرسال تلقائياً من نظام إدارة الرخص — دارة الملك عبدالعزيز
        </div>
        <a href='https://gallant-celebration-production-e728.up.railway.app'
           style='display:inline-block;margin-top:8px;padding:7px 18px;background:#BA7517;
                  color:white;font-size:11px;font-weight:700;text-decoration:none'>
            فتح النظام ←
        </a>
    </div>

</div>
</body>
</html>";
        }

        private async Task SendEmailAsync(string subject, string htmlBody)
        {
            var smtpHost  = _config["Email:SmtpHost"]  ?? "smtp.gmail.com";
            var smtpPort  = int.Parse(_config["Email:SmtpPort"] ?? "587");
            var smtpUser  = _config["Email:Username"]  ?? throw new Exception("Email:Username not configured");
            var smtpPass  = _config["Email:Password"]  ?? throw new Exception("Email:Password not configured");
            var fromEmail = _config["Email:From"]       ?? smtpUser;
            var toEmail   = _config["Email:To"]         ?? "adelrabeh@gmail.com";

            using var client = new SmtpClient(smtpHost, smtpPort)
            {
                Credentials    = new NetworkCredential(smtpUser, smtpPass),
                EnableSsl      = true,
                DeliveryMethod = SmtpDeliveryMethod.Network
            };

            using var msg = new MailMessage
            {
                From       = new MailAddress(fromEmail, "نظام إدارة الرخص"),
                Subject    = subject,
                Body       = htmlBody,
                IsBodyHtml = true
            };
            msg.To.Add(toEmail);

            await client.SendMailAsync(msg);
        }
    }
}
